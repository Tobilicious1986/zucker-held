package de.zuckerheld.domain.service;

import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.domain.model.Settings;
import de.zuckerheld.infrastructure.messaging.RabbitMQConfig;
import de.zuckerheld.infrastructure.repository.EntryRepository;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    private CapturingRabbitTemplate rabbitTemplate;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private SettingsRepository settingsRepository;

    @Mock
    private EntryRepository entryRepository;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        rabbitTemplate = new CapturingRabbitTemplate();
        notificationService = new NotificationService(
                rabbitTemplate,
                profileRepository,
                settingsRepository,
                entryRepository
        );
    }

    @Test
    void publishesDailySummaryForOptInProfiles() {
        Settings settings = new Settings();
        settings.setProfileId("profil-1");
        settings.setNotificationsEnabled(true);
        settings.setDailySummaryEnabled(true);

        Entry bzEntry = new Entry();
        bzEntry.setType(Entry.EntryType.BZ);
        bzEntry.setTimestamp(1_712_992_000_000L);
        bzEntry.setBzValue(145);
        bzEntry.setBzInTarget(true);

        Entry mealEntry = new Entry();
        mealEntry.setType(Entry.EntryType.MEAL);
        mealEntry.setTimestamp(1_712_995_000_000L);
        mealEntry.setMealKh(48);

        when(settingsRepository.findAllByNotificationsEnabledTrueAndDailySummaryEnabledTrue())
                .thenReturn(List.of(settings));
        when(entryRepository.findByProfileAndTimeRange(eq("profil-1"), anyLong(), anyLong()))
                .thenReturn(List.of(bzEntry, mealEntry));

        notificationService.publishDailySummariesFor(LocalDate.of(2026, 4, 13));

        Map<String, Object> payload = rabbitTemplate.lastPayload;
        assertThat(rabbitTemplate.sendCount).isEqualTo(1);
        assertThat(rabbitTemplate.lastExchange).isEqualTo(RabbitMQConfig.EXCHANGE_ALERTS);
        assertThat(rabbitTemplate.lastRoutingKey).isEqualTo(RabbitMQConfig.KEY_DAILY_SUMMARY);
        assertThat(payload).containsEntry("type", "DAILY_SUMMARY");
        assertThat(payload).containsEntry("profileId", "profil-1");
        assertThat(payload).containsEntry("date", "2026-04-13");
        assertThat(payload).containsEntry("latestBz", 145);
        assertThat(payload).containsEntry("entryCount", 2L);
        assertThat(payload).containsEntry("inTargetCount", 1L);
        @SuppressWarnings("unchecked")
        Map<String, Long> totalsByType = (Map<String, Long>) payload.get("totalsByType");
        assertThat(totalsByType)
                .containsEntry("bz", 1L)
                .containsEntry("meal", 1L);
    }

    @Test
    void skipsPublishWhenNoProfileOptedIn() {
        when(settingsRepository.findAllByNotificationsEnabledTrueAndDailySummaryEnabledTrue())
                .thenReturn(List.of());

        notificationService.publishDailySummariesFor(LocalDate.of(2026, 4, 13));

        assertThat(rabbitTemplate.sendCount).isZero();
    }

    @Test
    void publishesSignalGapAlertOnlyForStaleCgmData() {
        Settings settings = new Settings();
        settings.setProfileId("profil-2");
        settings.setNotificationsEnabled(true);
        settings.setQuietHoursStart(21);
        settings.setQuietHoursEnd(7);

        Entry cgmEntry = new Entry();
        cgmEntry.setType(Entry.EntryType.BZ);
        cgmEntry.setTimestamp(System.currentTimeMillis() - (40 * 60_000L));
        cgmEntry.setBzValue(141);
        cgmEntry.setSource("nightscout");

        when(settingsRepository.findAllByNotificationsEnabledTrue())
                .thenReturn(List.of(settings));
        when(entryRepository.findByProfileAndTimeRange(eq("profil-2"), anyLong(), anyLong()))
                .thenReturn(List.of(cgmEntry));

        notificationService.publishSignalGapAlerts();

        Map<String, Object> payload = rabbitTemplate.lastPayload;
        assertThat(rabbitTemplate.sendCount).isEqualTo(1);
        assertThat(rabbitTemplate.lastRoutingKey).isEqualTo(RabbitMQConfig.KEY_ROUTINE_REMINDER);
        assertThat(payload).containsEntry("type", "SIGNAL_GAP");
        assertThat(payload).containsEntry("profileId", "profil-2");
    }

    private static class CapturingRabbitTemplate extends RabbitTemplate {
        private String lastExchange;
        private String lastRoutingKey;
        private Map<String, Object> lastPayload;
        private int sendCount;

        @Override
        @SuppressWarnings("unchecked")
        public void convertAndSend(String exchange, String routingKey, Object object) {
            this.lastExchange = exchange;
            this.lastRoutingKey = routingKey;
            this.lastPayload = (Map<String, Object>) object;
            this.sendCount++;
        }
    }
}
