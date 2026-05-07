package de.zuckerheld.domain.service;

import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.GuardianPingKind;
import de.zuckerheld.domain.model.ProfileLink;
import de.zuckerheld.domain.model.Settings;
import de.zuckerheld.infrastructure.messaging.RabbitMQConfig;
import de.zuckerheld.infrastructure.repository.ProfileLinkRepository;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuardianPingServiceTest {

    @Mock
    private ProfileLinkRepository profileLinkRepository;

    @Mock
    private SettingsRepository settingsRepository;

    private CapturingRabbitTemplate rabbitTemplate;
    private GuardianPingService guardianPingService;

    @BeforeEach
    void setUp() {
        rabbitTemplate = new CapturingRabbitTemplate();
        guardianPingService = new GuardianPingService(
                profileLinkRepository,
                settingsRepository,
                rabbitTemplate
        );
    }

    @Test
    void publishesGuardianPingForAcceptedCaregiversAndAdmins() {
        Settings settings = new Settings();
        settings.setProfileId("owner-1");
        settings.setGuardianPingEnabled(true);

        Profile watcherA = new Profile();
        watcherA.setId("caregiver-1");
        watcherA.setName("Mama");
        Profile watcherB = new Profile();
        watcherB.setId("admin-1");
        watcherB.setName("Papa");

        ProfileLink caregiverLink = new ProfileLink();
        caregiverLink.setWatcher(watcherA);
        caregiverLink.setRole(ProfileLink.LinkRole.CAREGIVER);

        ProfileLink adminLink = new ProfileLink();
        adminLink.setWatcher(watcherB);
        adminLink.setRole(ProfileLink.LinkRole.ADMIN);

        when(settingsRepository.findById("owner-1")).thenReturn(Optional.of(settings));
        when(profileLinkRepository.findByOwnerIdAndStatusAndRoleIn(
                eq("owner-1"),
                eq(ProfileLink.LinkStatus.ACCEPTED),
                eq(List.of(ProfileLink.LinkRole.CAREGIVER, ProfileLink.LinkRole.ADMIN))
        )).thenReturn(List.of(caregiverLink, adminLink));

        GuardianPingService.GuardianPingResult result =
                guardianPingService.sendGuardianPing("owner-1", GuardianPingKind.CHECK_IN, "Bitte kurz kommen.");

        assertThat(result.recipients()).isEqualTo(2);
        assertThat(result.recipientNames()).containsExactly("Mama", "Papa");
        assertThat(result.messageKind()).isEqualTo(GuardianPingKind.CHECK_IN);
        assertThat(result.deliveredMessage()).isEqualTo("Bitte kurz kommen.");
        assertThat(rabbitTemplate.lastExchange).isEqualTo(RabbitMQConfig.EXCHANGE_ALERTS);
        assertThat(rabbitTemplate.lastRoutingKey).isEqualTo(RabbitMQConfig.KEY_GUARDIAN_PING);
        assertThat(rabbitTemplate.lastPayload).containsEntry("type", "GUARDIAN_PING");
        assertThat(rabbitTemplate.lastPayload).containsEntry("ownerId", "owner-1");
        assertThat(rabbitTemplate.lastPayload).containsEntry("messageKind", "CHECK_IN");
        assertThat(rabbitTemplate.lastPayload).containsEntry("message", "Bitte kurz kommen.");
        assertThat((List<String>) rabbitTemplate.lastPayload.get("recipientIds"))
                .containsExactly("caregiver-1", "admin-1");
        assertThat((List<String>) rabbitTemplate.lastPayload.get("recipientNames"))
                .containsExactly("Mama", "Papa");
    }

    @Test
    void ignoresExpiredGuardianPingRecipients() {
        Settings settings = new Settings();
        settings.setProfileId("owner-1");
        settings.setGuardianPingEnabled(true);

        Profile watcherA = new Profile();
        watcherA.setId("caregiver-1");
        watcherA.setName("Mama");
        Profile watcherB = new Profile();
        watcherB.setId("admin-1");
        watcherB.setName("Papa");

        ProfileLink activeLink = new ProfileLink();
        activeLink.setWatcher(watcherA);
        activeLink.setRole(ProfileLink.LinkRole.CAREGIVER);
        activeLink.setExpiresAt(OffsetDateTime.now().plusHours(1));

        ProfileLink expiredLink = new ProfileLink();
        expiredLink.setWatcher(watcherB);
        expiredLink.setRole(ProfileLink.LinkRole.ADMIN);
        expiredLink.setExpiresAt(OffsetDateTime.now().minusHours(1));

        when(settingsRepository.findById("owner-1")).thenReturn(Optional.of(settings));
        when(profileLinkRepository.findByOwnerIdAndStatusAndRoleIn(
                eq("owner-1"),
                eq(ProfileLink.LinkStatus.ACCEPTED),
                eq(List.of(ProfileLink.LinkRole.CAREGIVER, ProfileLink.LinkRole.ADMIN))
        )).thenReturn(List.of(activeLink, expiredLink));

        GuardianPingService.GuardianPingResult result =
                guardianPingService.sendGuardianPing("owner-1", GuardianPingKind.CHECK_IN, "Bitte kurz kommen.");

        assertThat(result.recipients()).isEqualTo(1);
        assertThat(result.recipientNames()).containsExactly("Mama");
        assertThat((List<String>) rabbitTemplate.lastPayload.get("recipientIds"))
                .containsExactly("caregiver-1");
    }

    @Test
    void rejectsGuardianPingWhenFeatureIsDisabled() {
        Settings settings = new Settings();
        settings.setProfileId("owner-1");
        settings.setGuardianPingEnabled(false);

        when(settingsRepository.findById("owner-1")).thenReturn(Optional.of(settings));

        assertThatThrownBy(() -> guardianPingService.sendGuardianPing("owner-1", "Hallo"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403 FORBIDDEN");
    }

    @Test
    void usesStructuredAllClearMessageWhenNoCustomMessageIsProvided() {
        Settings settings = new Settings();
        settings.setProfileId("owner-1");
        settings.setGuardianPingEnabled(true);

        Profile watcher = new Profile();
        watcher.setId("caregiver-1");
        watcher.setName("Mama");

        ProfileLink link = new ProfileLink();
        link.setWatcher(watcher);
        link.setRole(ProfileLink.LinkRole.CAREGIVER);

        when(settingsRepository.findById("owner-1")).thenReturn(Optional.of(settings));
        when(profileLinkRepository.findByOwnerIdAndStatusAndRoleIn(
                eq("owner-1"),
                eq(ProfileLink.LinkStatus.ACCEPTED),
                eq(List.of(ProfileLink.LinkRole.CAREGIVER, ProfileLink.LinkRole.ADMIN))
        )).thenReturn(List.of(link));

        GuardianPingService.GuardianPingResult result =
                guardianPingService.sendGuardianPing("owner-1", GuardianPingKind.ALL_CLEAR, null);

        assertThat(result.messageKind()).isEqualTo(GuardianPingKind.ALL_CLEAR);
        assertThat(result.deliveredMessage()).isEqualTo("Mir geht es gut. Alles okay.");
        assertThat(rabbitTemplate.lastPayload).containsEntry("messageKind", "ALL_CLEAR");
        assertThat(rabbitTemplate.lastPayload).containsEntry("message", "Mir geht es gut. Alles okay.");
    }

    @Test
    void rejectsDosingInstructionsInGuardianPingMessages() {
        Settings settings = new Settings();
        settings.setProfileId("owner-1");
        settings.setGuardianPingEnabled(true);

        when(settingsRepository.findById("owner-1")).thenReturn(Optional.of(settings));

        assertThatThrownBy(() -> guardianPingService.sendGuardianPing(
                "owner-1",
                GuardianPingKind.HELP_NEEDED,
                "Bitte 2 IE Insulin geben."
        ))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");
    }

    private static class CapturingRabbitTemplate extends RabbitTemplate {
        private String lastExchange;
        private String lastRoutingKey;
        private Map<String, Object> lastPayload;

        @Override
        @SuppressWarnings("unchecked")
        public void convertAndSend(String exchange, String routingKey, Object object) {
            this.lastExchange = exchange;
            this.lastRoutingKey = routingKey;
            this.lastPayload = (Map<String, Object>) object;
        }
    }
}
