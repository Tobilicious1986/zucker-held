package de.zuckerheld.domain.service;

import de.zuckerheld.api.dto.PrivacyDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.ProfileLink;
import de.zuckerheld.domain.model.Settings;
import de.zuckerheld.domain.model.ShareLink;
import de.zuckerheld.infrastructure.repository.ProfileLinkRepository;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import de.zuckerheld.infrastructure.repository.ShareLinkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PrivacyHubServiceTest {

    @Mock private ProfileRepository profileRepository;
    @Mock private SettingsRepository settingsRepository;
    @Mock private ProfileLinkRepository profileLinkRepository;
    @Mock private ShareLinkRepository shareLinkRepository;
    @Mock private AuditLogService auditLogService;

    private PrivacyHubService service;

    @BeforeEach
    void setUp() {
        service = new PrivacyHubService(
                profileRepository,
                settingsRepository,
                profileLinkRepository,
                shareLinkRepository,
                auditLogService
        );
    }

    @Test
    void overviewShowsWatchersPendingInvitesAndActiveShareLinks() {
        Profile owner = profile("p-owner", "Malte");
        Settings settings = settings();
        Profile watcher = profile("p-watcher", "Mama");
        Profile pendingWatcher = profile("p-pending", "Papa");

        ProfileLink activeLink = profileLink(owner, watcher, ProfileLink.LinkStatus.ACCEPTED,
                OffsetDateTime.now().plusDays(2));
        ProfileLink pendingLink = profileLink(owner, pendingWatcher, ProfileLink.LinkStatus.PENDING,
                OffsetDateTime.now().plusDays(2));

        ShareLink activeShare = shareLink(owner, false, OffsetDateTime.now().plusDays(1));
        ShareLink revokedShare = shareLink(owner, true, OffsetDateTime.now().plusDays(1));

        when(profileRepository.findById("p-owner")).thenReturn(Optional.of(owner));
        when(settingsRepository.findById("p-owner")).thenReturn(Optional.of(settings));
        when(profileLinkRepository.findByOwnerIdAndStatus("p-owner", ProfileLink.LinkStatus.ACCEPTED))
                .thenReturn(List.of(activeLink));
        when(profileLinkRepository.findByOwnerIdAndStatus("p-owner", ProfileLink.LinkStatus.PENDING))
                .thenReturn(List.of(pendingLink));
        when(shareLinkRepository.findByOwnerIdOrderByCreatedAtDesc("p-owner"))
                .thenReturn(List.of(activeShare, revokedShare));

        PrivacyDtos.PrivacyOverviewResponse overview = service.getOverview("p-owner");

        assertEquals("p-owner", overview.profile().id());
        assertEquals(1, overview.activeWatcherCount());
        assertEquals(1, overview.pendingInviteCount());
        assertEquals(1, overview.activeShareLinkCount());
        assertEquals(1, overview.activeWatchers().size());
        assertEquals(1, overview.pendingInvites().size());
        assertEquals(1, overview.shareLinks().size());
        assertTrue(overview.deletionRequest().active() == false);
        assertEquals(Profile.PrivacyDeleteStatus.NONE, overview.deletionRequest().status());
        assertEquals(ShareLink.ShareMode.DOCTOR, overview.shareLinks().get(0).mode());
    }

    @Test
    void overviewFallsBackToDefaultSettingsWhenProfileHasNoPersistedSettings() {
        Profile owner = profile("p-owner", "Malte");

        when(profileRepository.findById("p-owner")).thenReturn(Optional.of(owner));
        when(settingsRepository.findById("p-owner")).thenReturn(Optional.empty());
        when(profileLinkRepository.findByOwnerIdAndStatus("p-owner", ProfileLink.LinkStatus.ACCEPTED))
                .thenReturn(List.of());
        when(profileLinkRepository.findByOwnerIdAndStatus("p-owner", ProfileLink.LinkStatus.PENDING))
                .thenReturn(List.of());
        when(shareLinkRepository.findByOwnerIdOrderByCreatedAtDesc("p-owner"))
                .thenReturn(List.of());

        PrivacyDtos.PrivacyOverviewResponse overview = service.getOverview("p-owner");

        assertNotNull(overview.settings());
        assertEquals(70, overview.settings().bzMin());
        assertEquals(180, overview.settings().bzMax());
        assertEquals("light", overview.settings().themeMode());
    }

    @Test
    void overviewExcludesExpiredAcceptedLinksAndExpiredInvites() {
        Profile owner = profile("p-owner", "Malte");
        Profile watcher = profile("p-watcher", "Mama");

        ProfileLink expiredAccepted = profileLink(owner, watcher, ProfileLink.LinkStatus.ACCEPTED,
                OffsetDateTime.now().minusHours(1));
        ProfileLink expiredInvite = profileLink(owner, null, ProfileLink.LinkStatus.PENDING, null);
        expiredInvite.setInviteExpiresAt(OffsetDateTime.now().minusHours(1));

        when(profileRepository.findById("p-owner")).thenReturn(Optional.of(owner));
        when(settingsRepository.findById("p-owner")).thenReturn(Optional.empty());
        when(profileLinkRepository.findByOwnerIdAndStatus("p-owner", ProfileLink.LinkStatus.ACCEPTED))
                .thenReturn(List.of(expiredAccepted));
        when(profileLinkRepository.findByOwnerIdAndStatus("p-owner", ProfileLink.LinkStatus.PENDING))
                .thenReturn(List.of(expiredInvite));
        when(shareLinkRepository.findByOwnerIdOrderByCreatedAtDesc("p-owner"))
                .thenReturn(List.of());

        PrivacyDtos.PrivacyOverviewResponse overview = service.getOverview("p-owner");

        assertEquals(0, overview.activeWatcherCount());
        assertEquals(0, overview.pendingInviteCount());
        assertTrue(overview.activeWatchers().isEmpty());
        assertTrue(overview.pendingInvites().isEmpty());
    }

    @Test
    void exportSnapshotLogsAuditAndOmitsSecrets() {
        Profile owner = profile("p-owner", "Malte");
        Settings settings = settings();

        when(profileRepository.findById("p-owner")).thenReturn(Optional.of(owner));
        when(settingsRepository.findById("p-owner")).thenReturn(Optional.of(settings));
        when(profileLinkRepository.findByOwnerIdAndStatus("p-owner", ProfileLink.LinkStatus.ACCEPTED))
                .thenReturn(List.of());
        when(profileLinkRepository.findByOwnerIdAndStatus("p-owner", ProfileLink.LinkStatus.PENDING))
                .thenReturn(List.of());
        when(shareLinkRepository.findByOwnerIdOrderByCreatedAtDesc("p-owner"))
                .thenReturn(List.of());

        PrivacyDtos.PrivacySnapshotResponse snapshot = service.exportSnapshot("p-owner");

        assertNotNull(snapshot.generatedAt());
        assertEquals("v1", snapshot.snapshotVersion());
        assertFalse(snapshot.overview().settings().hasClaudeApiKey());
        verify(auditLogService).log(
                eq("p-owner"),
                eq("p-owner"),
                eq("PRIVACY_EXPORT"),
                contains("Datenschutz-Snapshot exportiert")
        );
    }

    @Test
    void overviewFallsBackToDefaultSettingsWhenNoSettingsExist() {
        Profile owner = profile("p-owner", "Malte");

        when(profileRepository.findById("p-owner")).thenReturn(Optional.of(owner));
        when(settingsRepository.findById("p-owner")).thenReturn(Optional.empty());
        when(profileLinkRepository.findByOwnerIdAndStatus("p-owner", ProfileLink.LinkStatus.ACCEPTED))
                .thenReturn(List.of());
        when(profileLinkRepository.findByOwnerIdAndStatus("p-owner", ProfileLink.LinkStatus.PENDING))
                .thenReturn(List.of());
        when(shareLinkRepository.findByOwnerIdOrderByCreatedAtDesc("p-owner"))
                .thenReturn(List.of());

        PrivacyDtos.PrivacyOverviewResponse overview = service.getOverview("p-owner");

        assertEquals(70, overview.settings().bzMin());
        assertEquals(180, overview.settings().bzMax());
        assertEquals("[]", overview.settings().contacts());
        assertFalse(overview.settings().hasClaudeApiKey());
    }

    @Test
    void requestAndRevokeDeletionUpdateStatusAndLog() {
        Profile owner = profile("p-owner", "Malte");

        when(profileRepository.findById("p-owner")).thenReturn(Optional.of(owner));

        PrivacyDtos.DeletionRequestSummary requested = service.requestDeletion("p-owner");
        assertEquals(Profile.PrivacyDeleteStatus.REQUESTED, requested.status());
        assertTrue(requested.active());
        assertEquals(Profile.PrivacyDeleteStatus.REQUESTED, owner.getPrivacyDeleteStatus());
        assertNotNull(owner.getPrivacyDeleteRequestedAt());

        PrivacyDtos.DeletionRequestSummary revoked = service.revokeDeletionRequest("p-owner");
        assertEquals(Profile.PrivacyDeleteStatus.REVOKED, revoked.status());
        assertFalse(revoked.active());
        assertEquals(Profile.PrivacyDeleteStatus.REVOKED, owner.getPrivacyDeleteStatus());

        verify(auditLogService).log(eq("p-owner"), eq("p-owner"), eq("PRIVACY_DELETE_REQUEST"), contains("gestellt"));
        verify(auditLogService).log(eq("p-owner"), eq("p-owner"), eq("PRIVACY_DELETE_REQUEST_REVOKE"), contains("widerrufen"));
    }

    private Profile profile(String id, String name) {
        Profile profile = new Profile();
        profile.setId(id);
        profile.setName(name);
        profile.setAvatar("🦊");
        profile.setType(Profile.ProfileType.ERWACHSEN);
        profile.setRole(Profile.Role.PATIENT);
        profile.setAgeGroup("adult");
        return profile;
    }

    private Settings settings() {
        Settings settings = new Settings();
        settings.setProfileId("p-owner");
        settings.setBzMin(70);
        settings.setBzMax(180);
        settings.setContacts("[]");
        settings.setNotificationsEnabled(true);
        return settings;
    }

    private ProfileLink profileLink(Profile owner, Profile watcher, ProfileLink.LinkStatus status, OffsetDateTime expiresAt) {
        ProfileLink link = new ProfileLink();
        link.setId(UUID.randomUUID());
        link.setOwner(owner);
        link.setWatcher(watcher);
        link.setRole(ProfileLink.LinkRole.CAREGIVER);
        link.setStatus(status);
        link.setExpiresAt(expiresAt);
        link.setInviteExpiresAt(expiresAt);
        return link;
    }

    private ShareLink shareLink(Profile owner, boolean revoked, OffsetDateTime expiresAt) {
        ShareLink link = new ShareLink();
        link.setId(UUID.randomUUID());
        link.setOwner(owner);
        link.setMode(ShareLink.ShareMode.DOCTOR);
        link.setToken(UUID.randomUUID().toString().replace("-", ""));
        link.setExpiresAt(expiresAt);
        link.setRevoked(revoked);
        return link;
    }
}
