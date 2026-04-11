package de.zuckerheld.domain.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.domain.model.Entry.EntryType;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.Settings;
import de.zuckerheld.infrastructure.repository.EntryRepository;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import de.zuckerheld.infrastructure.security.EncryptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Synchronisiert CGM-Daten von einer Nightscout-Instanz.
 * Lädt die letzten 288 Einträge (24h bei 5-Minuten-Intervall) und
 * speichert nur neue Einträge (Duplikat-Check via ID).
 */
@Service
public class NightscoutService {

    private static final Logger   log     = LoggerFactory.getLogger(NightscoutService.class);
    private static final Duration TIMEOUT = Duration.ofSeconds(12);

    private final WebClient.Builder  webClientBuilder;
    private final SettingsRepository settingsRepository;
    private final EncryptionService  encryptionService;
    private final EntryRepository    entryRepository;
    private final ProfileRepository  profileRepository;
    private final ObjectMapper       objectMapper;

    public NightscoutService(WebClient.Builder webClientBuilder,
                             SettingsRepository settingsRepository,
                             EncryptionService encryptionService,
                             EntryRepository entryRepository,
                             ProfileRepository profileRepository) {
        this.webClientBuilder  = webClientBuilder;
        this.settingsRepository = settingsRepository;
        this.encryptionService  = encryptionService;
        this.entryRepository    = entryRepository;
        this.profileRepository  = profileRepository;
        this.objectMapper       = new ObjectMapper();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Öffentliche API
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Lädt CGM-Einträge von Nightscout und speichert neue Messungen.
     *
     * @param profileId Profil-ID dessen Nightscout-Verbindung genutzt wird
     * @return Liste der neu hinzugefügten Entry-Objekte
     */
    @Transactional
    public List<Entry> fetchAndSync(String profileId) {
        Settings settings = settingsRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profil nicht gefunden: " + profileId));

        String nightscoutUrl = settings.getNightscoutUrl();
        if (nightscoutUrl == null || nightscoutUrl.isBlank()) {
            throw new RuntimeException("Keine Nightscout-URL für Profil " + profileId + " konfiguriert.");
        }

        String token = null;
        if (settings.getNightscoutTokenEnc() != null && !settings.getNightscoutTokenEnc().isBlank()) {
            token = encryptionService.decrypt(settings.getNightscoutTokenEnc());
        }

        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profil nicht gefunden: " + profileId));

        // Nightscout API abrufen
        List<JsonNode> rawEntries = fetchFromNightscout(nightscoutUrl, token);
        log.info("Nightscout-Sync: {} Einträge von {} erhalten", rawEntries.size(), nightscoutUrl);

        if (rawEntries.isEmpty()) {
            return List.of();
        }

        // Duplikat-Check: welche IDs bereits vorhanden?
        List<String> candidateIds = rawEntries.stream()
                .map(e -> "ns_" + e.path("_id").asText(""))
                .filter(id -> !id.equals("ns_"))
                .toList();

        Set<String> existingIds = Set.copyOf(entryRepository.findExistingIds(candidateIds, profileId));
        log.debug("Nightscout-Sync: {} bereits vorhanden, {} zu importieren",
                existingIds.size(), candidateIds.size() - existingIds.size());

        // Neue Einträge speichern
        List<Entry> newEntries = new ArrayList<>();
        for (JsonNode raw : rawEntries) {
            String nsId    = "ns_" + raw.path("_id").asText("");
            int    sgv     = raw.path("sgv").asInt(0);
            long   dateMs  = raw.path("date").asLong(0);

            if (nsId.equals("ns_") || sgv <= 0 || existingIds.contains(nsId)) {
                continue;
            }

            Entry entry = new Entry();
            entry.setId(nsId);
            entry.setProfile(profile);
            entry.setType(EntryType.BZ);
            entry.setTimestamp(dateMs);
            entry.setBzValue(sgv);
            entry.setBzLevel(classifyBzLevel(sgv));
            entry.setBzInTarget(sgv >= 70 && sgv <= 180); // Standard-Zielbereich als Fallback
            entry.setSource("nightscout");

            newEntries.add(entry);
        }

        if (!newEntries.isEmpty()) {
            entryRepository.saveAll(newEntries);
            log.info("Nightscout-Sync: {} neue BZ-Einträge gespeichert", newEntries.size());
        }

        return newEntries;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Private Hilfsmethoden
    // ═══════════════════════════════════════════════════════════════════════

    private List<JsonNode> fetchFromNightscout(String baseUrl, String token) {
        // URL normalisieren
        String url = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String endpoint = url + "/api/v1/entries.json?count=288";
        if (token != null && !token.isBlank()) {
            endpoint += "&token=" + token;
        }

        try {
            String rawJson = webClientBuilder.build()
                    .get()
                    .uri(endpoint)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(TIMEOUT)
                    .block();

            if (rawJson == null || rawJson.isBlank()) {
                return List.of();
            }

            JsonNode array = objectMapper.readTree(rawJson);
            if (!array.isArray()) {
                log.warn("Unerwartete Nightscout-Antwort (kein Array): {}", rawJson.substring(0, Math.min(200, rawJson.length())));
                return List.of();
            }

            List<JsonNode> result = new ArrayList<>();
            array.forEach(result::add);
            return result;

        } catch (Exception e) {
            throw new RuntimeException("Nightscout-Abruf fehlgeschlagen: " + e.getMessage(), e);
        }
    }

    private String classifyBzLevel(int bz) {
        if (bz < 55)  return "critical";
        if (bz < 70)  return "low";
        if (bz <= 180) return "ok";
        if (bz <= 250) return "high";
        return "veryhigh";
    }
}
