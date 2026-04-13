package de.zuckerheld.domain.service;

import de.zuckerheld.infrastructure.events.BZAlertEvent;
import de.zuckerheld.infrastructure.messaging.RabbitMQConfig;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import de.zuckerheld.infrastructure.repository.EntryRepository;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.domain.model.Entry.EntryType;
import de.zuckerheld.domain.model.Settings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Verarbeitet BZ-Alerts und sendet Benachrichtigungen via RabbitMQ.
 * Wird asynchron aufgerufen damit der HTTP-Request nicht blockiert wird.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    // BZ-Schwellwerte für kritische Werte
    private static final int BZ_CRITICAL_LOW  = 55;
    private static final int BZ_CRITICAL_HIGH = 300;

    // Zeitfenster für "BZ seit 2h zu hoch" Warnung (in Millisekunden)
    private static final long TWO_HOURS_MS = 2 * 60 * 60 * 1000L;
    private static final ZoneId BERLIN_ZONE = ZoneId.of("Europe/Berlin");

    private final RabbitTemplate     rabbitTemplate;
    private final ProfileRepository  profileRepository;
    private final SettingsRepository settingsRepository;
    private final EntryRepository    entryRepository;

    public NotificationService(RabbitTemplate rabbitTemplate,
                               ProfileRepository profileRepository,
                               SettingsRepository settingsRepository,
                               EntryRepository entryRepository) {
        this.rabbitTemplate     = rabbitTemplate;
        this.profileRepository  = profileRepository;
        this.settingsRepository = settingsRepository;
        this.entryRepository    = entryRepository;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Event-Handler
    // ═══════════════════════════════════════════════════════════════════════

    @Async
    @EventListener
    public void handleBZAlert(BZAlertEvent event) {
        String profileId = event.getProfileId();
        int    bzValue   = event.getBzValue();
        long   timestamp = event.getOccurredAt();

        // Settings laden
        Settings settings = settingsRepository.findById(profileId).orElse(null);
        if (settings == null) {
            log.warn("Keine Settings für Profil {} gefunden — Benachrichtigung übersprungen", profileId);
            return;
        }

        // Notifications müssen aktiviert sein
        if (Boolean.FALSE.equals(settings.getNotificationsEnabled())) {
            log.debug("Benachrichtigungen für Profil {} deaktiviert", profileId);
            return;
        }

        // ── Kritisch niedrig: BZ < 55 mg/dL (schwere Hypoglykämie) ───────
        if (bzValue < BZ_CRITICAL_LOW) {
            log.warn("KRITISCH NIEDRIG: BZ {} mg/dL für Profil {}", bzValue, profileId);
            publishBzAlert(profileId, bzValue, "CRITICAL_LOW",
                    "Kritisch niedriger Blutzucker! Sofort Traubenzucker geben!");
            return;
        }

        // ── Kritisch hoch: BZ > 300 mg/dL ────────────────────────────────
        if (bzValue > BZ_CRITICAL_HIGH) {
            log.warn("KRITISCH HOCH: BZ {} mg/dL für Profil {}", bzValue, profileId);
            publishBzAlert(profileId, bzValue, "CRITICAL_HIGH",
                    "Sehr hoher Blutzucker! Bitte Ketone messen.");
            // Zusätzlich Ketone-Erinnerung mit TTL 1h (Queue hat TTL konfiguriert)
            publishKetoneReminder(profileId, bzValue);
            return;
        }

        // ── BZ > eingestelltem Maximum seit 2h ────────────────────────────
        int bzMax = settings.getBzMax() != null ? settings.getBzMax() : 180;
        if (bzValue > bzMax) {
            long twoHoursAgo = System.currentTimeMillis() - TWO_HOURS_MS;
            if (timestamp <= twoHoursAgo) {
                log.info("BZ {} mg/dL seit über 2h über Zielbereich ({}) für Profil {}",
                        bzValue, bzMax, profileId);
                publishBzAlert(profileId, bzValue, "PROLONGED_HIGH",
                        String.format("Blutzucker seit über 2 Stunden erhöht (%d mg/dL)", bzValue));
            }
        }
    }

    @Scheduled(cron = "0 0 20 * * *", zone = "Europe/Berlin")
    public void publishDailySummaries() {
        publishDailySummariesFor(LocalDate.now(BERLIN_ZONE));
    }

    @Scheduled(cron = "0 0 * * * *", zone = "Europe/Berlin")
    public void publishRoutineReminders() {
        int hour = java.time.ZonedDateTime.now(BERLIN_ZONE).getHour();
        LocalDate today = LocalDate.now(BERLIN_ZONE);
        long from = today.atStartOfDay(BERLIN_ZONE).toInstant().toEpochMilli();
        long to = System.currentTimeMillis();

        List<Settings> settingsList = settingsRepository.findAllByNotificationsEnabledTrue();
        for (Settings settings : settingsList) {
            if (isQuietHour(settings, hour)) continue;
            if (hour < 7 || hour > 21) continue;

            List<Entry> entries = entryRepository.findByProfileAndTimeRange(settings.getProfileId(), from, to);
            boolean hasBzToday = entries.stream().anyMatch(e ->
                    e.getType() == EntryType.BZ && e.getBzValue() != null);

            if (!hasBzToday) {
                Map<String, Object> payload = new HashMap<>();
                payload.put("type", "ROUTINE_REMINDER");
                payload.put("profileId", settings.getProfileId());
                payload.put("message", "Zeit für eine BZ-Messung 🩸");
                payload.put("hour", hour);
                rabbitTemplate.convertAndSend(
                        RabbitMQConfig.EXCHANGE_ALERTS,
                        RabbitMQConfig.KEY_ROUTINE_REMINDER,
                        payload
                );
            }
        }
    }

    void publishDailySummariesFor(LocalDate date) {
        List<Settings> optInSettings = settingsRepository.findAllByNotificationsEnabledTrueAndDailySummaryEnabledTrue();
        for (Settings settings : optInSettings) {
            publishDailySummaryForProfile(settings.getProfileId(), date);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Private Hilfsmethoden
    // ═══════════════════════════════════════════════════════════════════════

    private void publishBzAlert(String profileId, int bzValue, String type, String message) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type",      type);
        payload.put("profileId", profileId);
        payload.put("bzValue",   bzValue);
        payload.put("message",   message);

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_ALERTS,
                    RabbitMQConfig.KEY_BZ_ALERT,
                    payload);
            log.debug("BZ-Alert publiziert: {} für Profil {}", type, profileId);
        } catch (Exception e) {
            log.error("Fehler beim Publizieren des BZ-Alerts für Profil {}: {}", profileId, e.getMessage());
        }
    }

    private void publishKetoneReminder(String profileId, int bzValue) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type",      "KETONE_REMINDER");
        payload.put("profileId", profileId);
        payload.put("bzValue",   bzValue);
        payload.put("message",   "Bitte Ketone messen — BZ war sehr hoch.");

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_ALERTS,
                    RabbitMQConfig.KEY_KETONE_REMINDER,
                    payload);
            log.debug("Ketone-Erinnerung für Profil {} eingeplant", profileId);
        } catch (Exception e) {
            log.error("Fehler beim Publizieren der Ketone-Erinnerung für Profil {}: {}", profileId, e.getMessage());
        }
    }

    private void publishDailySummaryForProfile(String profileId, LocalDate date) {
        long from = date.atStartOfDay(BERLIN_ZONE).toInstant().toEpochMilli();
        long to = date.plusDays(1).atStartOfDay(BERLIN_ZONE).toInstant().toEpochMilli() - 1;

        List<Entry> entries = entryRepository.findByProfileAndTimeRange(profileId, from, to);
        Entry latestBzEntry = entries.stream()
                .filter(entry -> entry.getType() == EntryType.BZ && entry.getBzValue() != null)
                .max((left, right) -> Long.compare(left.getTimestamp(), right.getTimestamp()))
                .orElse(null);

        Map<String, Long> totalsByType = entries.stream()
                .collect(Collectors.groupingBy(
                        entry -> entry.getType().toString().toLowerCase(Locale.ROOT),
                        LinkedHashMap::new,
                        Collectors.counting()
                ));

        long inTargetCount = entries.stream()
                .filter(entry -> entry.getType() == EntryType.BZ && Boolean.TRUE.equals(entry.getBzInTarget()))
                .count();

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "DAILY_SUMMARY");
        payload.put("profileId", profileId);
        payload.put("date", date.toString());
        payload.put("latestBz", latestBzEntry != null ? latestBzEntry.getBzValue() : null);
        payload.put("entryCount", (long) entries.size());
        payload.put("totalsByType", totalsByType);
        payload.put("inTargetCount", inTargetCount);

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_ALERTS,
                    RabbitMQConfig.KEY_DAILY_SUMMARY,
                    payload);
            log.debug("Tageszusammenfassung publiziert für Profil {} am {}", profileId, date);
        } catch (Exception e) {
            log.error("Fehler beim Publizieren der Tageszusammenfassung für Profil {}: {}", profileId, e.getMessage());
        }
    }

    private boolean isQuietHour(Settings settings, int hour) {
        int start = settings.getQuietHoursStart() != null ? settings.getQuietHoursStart() : 21;
        int end = settings.getQuietHoursEnd() != null ? settings.getQuietHoursEnd() : 7;
        if (start == end) return false;
        if (start < end) {
            return hour >= start && hour < end;
        }
        return hour >= start || hour < end;
    }
}
