package de.zuckerheld.domain.service;

import de.zuckerheld.infrastructure.events.BZAlertEvent;
import de.zuckerheld.infrastructure.messaging.RabbitMQConfig;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import de.zuckerheld.domain.model.Settings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

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

    private final RabbitTemplate     rabbitTemplate;
    private final ProfileRepository  profileRepository;
    private final SettingsRepository settingsRepository;

    public NotificationService(RabbitTemplate rabbitTemplate,
                               ProfileRepository profileRepository,
                               SettingsRepository settingsRepository) {
        this.rabbitTemplate     = rabbitTemplate;
        this.profileRepository  = profileRepository;
        this.settingsRepository = settingsRepository;
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
}
