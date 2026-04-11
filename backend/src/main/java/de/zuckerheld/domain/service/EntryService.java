package de.zuckerheld.domain.service;

import de.zuckerheld.api.dto.EntryDtos;
import de.zuckerheld.domain.model.Achievement;
import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.domain.model.Entry.EntryType;
import de.zuckerheld.domain.model.MealItem;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.Settings;
import de.zuckerheld.infrastructure.events.BZAlertEvent;
import de.zuckerheld.infrastructure.events.EntryCreatedEvent;
import de.zuckerheld.infrastructure.repository.AchievementRepository;
import de.zuckerheld.infrastructure.repository.EntryRepository;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Kern-Service für alle Entry-Operationen.
 * Verwaltet BZ, Insulin, Mahlzeiten, Aktivitäten und Ketone.
 */
@Service
public class EntryService {

    private static final Logger log = LoggerFactory.getLogger(EntryService.class);

    private final EntryRepository         entryRepository;
    private final ProfileRepository       profileRepository;
    private final AchievementRepository   achievementRepository;
    private final SettingsRepository      settingsRepository;
    private final ApplicationEventPublisher eventPublisher;

    public EntryService(EntryRepository entryRepository,
                        ProfileRepository profileRepository,
                        AchievementRepository achievementRepository,
                        SettingsRepository settingsRepository,
                        ApplicationEventPublisher eventPublisher) {
        this.entryRepository       = entryRepository;
        this.profileRepository     = profileRepository;
        this.achievementRepository = achievementRepository;
        this.settingsRepository    = settingsRepository;
        this.eventPublisher        = eventPublisher;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Öffentliche API
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Erstellt einen neuen Entry-Datensatz und löst Events aus.
     */
    @Transactional
    public Entry createEntry(String profileId, EntryDtos.CreateEntryRequest req) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new EntityNotFoundException("Profil nicht gefunden: " + profileId));

        Settings settings = settingsRepository.findById(profileId).orElse(null);

        Entry entry = buildEntryFromRequest(profile, req, settings);
        entry = entryRepository.save(entry);

        // Events publizieren
        eventPublisher.publishEvent(
                new EntryCreatedEvent(this, profileId, entry.getId(),
                        entry.getType().toString(), entry.getTimestamp()));

        if (entry.getType() == EntryType.BZ && entry.getBzValue() != null) {
            eventPublisher.publishEvent(
                    new BZAlertEvent(this, profileId, entry.getBzValue(), entry.getTimestamp()));
        }

        // Achievements asynchron prüfen
        checkAchievements(profileId);

        return entry;
    }

    /**
     * Batch-Sync: Mehrere Entries auf einmal importieren (Offline-Sync).
     * Bereits vorhandene IDs werden übersprungen.
     */
    @Transactional
    public EntryDtos.BatchSyncResponse batchSync(String profileId,
                                                  List<EntryDtos.CreateEntryRequest> requests) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new EntityNotFoundException("Profil nicht gefunden: " + profileId));

        Settings settings = settingsRepository.findById(profileId).orElse(null);

        List<String> incomingIds = requests.stream()
                .map(EntryDtos.CreateEntryRequest::id)
                .toList();

        Set<String> existingIds = new HashSet<>(entryRepository.findExistingIds(incomingIds, profileId));

        List<Entry>  toSave    = new ArrayList<>();
        List<String> skippedIds = new ArrayList<>();

        for (EntryDtos.CreateEntryRequest req : requests) {
            if (existingIds.contains(req.id())) {
                skippedIds.add(req.id());
                continue;
            }
            toSave.add(buildEntryFromRequest(profile, req, settings));
        }

        if (!toSave.isEmpty()) {
            entryRepository.saveAll(toSave);
            checkAchievements(profileId);
        }

        return new EntryDtos.BatchSyncResponse(toSave.size(), skippedIds.size(), skippedIds);
    }

    /**
     * Löscht einen Entry — nur wenn er zum angegebenen Profil gehört.
     */
    @Transactional
    public void deleteEntry(String profileId, String entryId) {
        if (!entryRepository.existsByIdAndProfileId(entryId, profileId)) {
            throw new EntityNotFoundException(
                    "Entry " + entryId + " nicht gefunden oder gehört nicht zu Profil " + profileId);
        }
        entryRepository.deleteById(entryId);
    }

    /**
     * Gibt paginierte Entries zurück, optional gefiltert nach Typ und Zeitraum.
     */
    @Transactional(readOnly = true)
    public Page<Entry> getEntries(String profileId, String type, Long from, Long to, Pageable pageable) {
        if (type != null && !type.isBlank()) {
            EntryType entryType = EntryType.valueOf(type.toUpperCase());
            return entryRepository.findByProfileIdAndTypeOrderByTimestampDesc(profileId, entryType, pageable);
        }
        return entryRepository.findByProfileIdOrderByTimestampDesc(profileId, pageable);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Achievement-Prüfung
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Prüft alle Achievement-Bedingungen für das Profil und speichert neue Errungenschaften.
     */
    public void checkAchievements(String profileId) {
        Profile profile = profileRepository.findById(profileId).orElse(null);
        if (profile == null) return;

        Set<String> unlocked = achievementRepository.findUnlockedIds(profileId);

        // BZ-Einträge zählen
        long bzCount = entryRepository
                .findByProfileIdAndTypeOrderByTimestampDesc(profileId, EntryType.BZ, Pageable.unpaged())
                .getTotalElements();

        // Mahlzeit-Einträge zählen
        long mealCount = entryRepository
                .findByProfileIdAndTypeOrderByTimestampDesc(profileId, EntryType.MEAL, Pageable.unpaged())
                .getTotalElements();

        // Aktivitäts-Einträge zählen
        long activityCount = entryRepository
                .findByProfileIdAndTypeOrderByTimestampDesc(profileId, EntryType.ACTIVITY, Pageable.unpaged())
                .getTotalElements();

        // BZ im Zielbereich prüfen (recentBz wird später ohnehin geladen)
        Settings settings = settingsRepository.findById(profileId).orElse(null);
        int bzMin = settings != null && settings.getBzMin() != null ? settings.getBzMin() : 70;
        int bzMax = settings != null && settings.getBzMax() != null ? settings.getBzMax() : 180;

        // Streak berechnen (Tage in Folge mit BZ-Messung) — recentBz auch für target_ok nutzen
        long sinceMs = System.currentTimeMillis() - (14L * 24 * 60 * 60 * 1000); // 14 Tage
        List<Entry> recentBz = entryRepository.findBzEntriesSince(profileId, sinceMs);
        int streak = calculateStreak(recentBz);

        long bzInTargetCount = recentBz.stream()
                .filter(e -> e.getBzValue() != null
                        && e.getBzValue() >= bzMin
                        && e.getBzValue() <= bzMax)
                .count();

        // ── Achievements prüfen und speichern ─────────────────────────────

        unlockIfNew(profile, unlocked, "first_bz",     bzCount >= 1);
        unlockIfNew(profile, unlocked, "bz_10",        bzCount >= 10);
        unlockIfNew(profile, unlocked, "bz_50",        bzCount >= 50);
        unlockIfNew(profile, unlocked, "bz_100",       bzCount >= 100);
        unlockIfNew(profile, unlocked, "target_ok",    bzInTargetCount >= 1);
        unlockIfNew(profile, unlocked, "meal_10",      mealCount >= 10);
        unlockIfNew(profile, unlocked, "meal_20",      mealCount >= 20);
        unlockIfNew(profile, unlocked, "activity_5",   activityCount >= 5);
        unlockIfNew(profile, unlocked, "activity_10",  activityCount >= 10);
        unlockIfNew(profile, unlocked, "streak_3",     streak >= 3);
        unlockIfNew(profile, unlocked, "streak_7",     streak >= 7);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Private Hilfsmethoden
    // ═══════════════════════════════════════════════════════════════════════

    private Entry buildEntryFromRequest(Profile profile, EntryDtos.CreateEntryRequest req, Settings settings) {
        Entry entry = new Entry();
        entry.setId(req.id());
        entry.setProfile(profile);
        entry.setType(EntryType.valueOf(req.type().toUpperCase()));
        entry.setTimestamp(req.timestamp());
        entry.setNote(req.note());
        entry.setSource(req.source() != null ? req.source() : "manual");

        switch (entry.getType()) {
            case BZ -> {
                entry.setBzValue(req.bzValue());
                entry.setBzMeasureTime(req.bzMeasureTime());
                if (req.bzValue() != null) {
                    entry.setBzLevel(classifyBzLevel(req.bzValue()));
                    int min = settings != null && settings.getBzMin() != null ? settings.getBzMin() : 70;
                    int max = settings != null && settings.getBzMax() != null ? settings.getBzMax() : 180;
                    entry.setBzInTarget(req.bzValue() >= min && req.bzValue() <= max);
                }
            }
            case INSULIN -> {
                entry.setInsulinUnits(req.insulinUnits());
                entry.setInsulinType(req.insulinType());
            }
            case MEAL -> {
                entry.setMealName(req.mealName());
                entry.setMealKh(req.mealKh());
                entry.setMealTime(req.mealTime());
                if (req.items() != null) {
                    List<MealItem> items = req.items().stream()
                            .map(dto -> {
                                MealItem mi = new MealItem();
                                mi.setEntry(entry);
                                mi.setName(dto.name());
                                mi.setAmountG(dto.amountG());
                                mi.setKh(dto.kh());
                                return mi;
                            }).toList();
                    entry.setMealItems(new ArrayList<>(items));
                }
            }
            case ACTIVITY -> {
                entry.setActivityId(req.activityId());
                entry.setActivityName(req.activityName());
                entry.setActivityEmoji(req.activityEmoji());
                entry.setActivityIntensity(req.activityIntensity());
                entry.setDurationMin(req.durationMin());
            }
            case KETONE -> {
                entry.setKetoneValue(req.ketoneValue());
                entry.setKetoneUnit(req.ketoneUnit());
            }
        }

        return entry;
    }

    private String classifyBzLevel(int bz) {
        if (bz < 55)   return "critical";
        if (bz < 70)   return "low";
        if (bz <= 180) return "ok";
        if (bz <= 250) return "high";
        return "veryhigh";
    }

    private int calculateStreak(List<Entry> bzEntries) {
        if (bzEntries.isEmpty()) return 0;

        Set<LocalDate> datesWithMeasurement = bzEntries.stream()
                .map(e -> Instant.ofEpochMilli(e.getTimestamp())
                        .atZone(ZoneId.systemDefault())
                        .toLocalDate())
                .collect(Collectors.toSet());

        int streak = 0;
        LocalDate day = LocalDate.now();

        while (datesWithMeasurement.contains(day)) {
            streak++;
            day = day.minusDays(1);
        }

        return streak;
    }

    private void unlockIfNew(Profile profile, Set<String> unlocked, String achievementId, boolean condition) {
        if (!condition || unlocked.contains(achievementId)) return;

        try {
            Achievement achievement = new Achievement();
            achievement.setProfile(profile);
            achievement.setAchievementId(achievementId);
            achievementRepository.save(achievement);
            log.info("Achievement freigeschaltet: {} für Profil {}", achievementId, profile.getId());
        } catch (DataIntegrityViolationException e) {
            // UNIQUE-Constraint verletzt — bereits vorhanden, ignorieren
            log.debug("Achievement {} bereits vorhanden für Profil {}", achievementId, profile.getId());
        }
    }
}
