package de.zuckerheld.domain.service;

import de.zuckerheld.api.dto.PrivacyDtos;
import de.zuckerheld.api.dto.ProfileDtos;
import de.zuckerheld.api.dto.ProfileLinkDtos;
import de.zuckerheld.api.dto.SettingsDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.ProfileLink;
import de.zuckerheld.domain.model.Settings;
import de.zuckerheld.domain.model.ShareLink;
import de.zuckerheld.infrastructure.repository.ProfileLinkRepository;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import de.zuckerheld.infrastructure.repository.ShareLinkRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class PrivacyHubService {

    private final ProfileRepository profileRepository;
    private final SettingsRepository settingsRepository;
    private final ProfileLinkRepository profileLinkRepository;
    private final ShareLinkRepository shareLinkRepository;
    private final AuditLogService auditLogService;

    public PrivacyHubService(ProfileRepository profileRepository,
                             SettingsRepository settingsRepository,
                             ProfileLinkRepository profileLinkRepository,
                             ShareLinkRepository shareLinkRepository,
                             AuditLogService auditLogService) {
        this.profileRepository = profileRepository;
        this.settingsRepository = settingsRepository;
        this.profileLinkRepository = profileLinkRepository;
        this.shareLinkRepository = shareLinkRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PrivacyDtos.PrivacyOverviewResponse getOverview(String profileId) {
        Profile profile = getProfile(profileId);
        SettingsDtos.SettingsResponse settings = getSettings(profileId);

        List<PrivacyDtos.LinkSummary> activeWatchers = profileLinkRepository
                .findByOwnerIdAndStatus(profileId, ProfileLink.LinkStatus.ACCEPTED)
                .stream()
                .map(this::toLinkSummary)
                .toList();

        List<PrivacyDtos.LinkSummary> pendingInvites = profileLinkRepository
                .findByOwnerIdAndStatus(profileId, ProfileLink.LinkStatus.PENDING)
                .stream()
                .map(this::toLinkSummary)
                .toList();

        List<PrivacyDtos.ShareLinkSummary> activeShareLinks = shareLinkRepository
                .findByOwnerIdOrderByCreatedAtDesc(profileId)
                .stream()
                .filter(this::isActiveShareLink)
                .map(this::toShareSummary)
                .toList();

        return new PrivacyDtos.PrivacyOverviewResponse(
                ProfileDtos.ProfileResponse.from(profile),
                settings,
                toDeletionRequestSummary(profile),
                activeWatchers,
                pendingInvites,
                activeShareLinks,
                activeWatchers.size(),
                pendingInvites.size(),
                activeShareLinks.size()
        );
    }

    @Transactional
    public PrivacyDtos.PrivacySnapshotResponse exportSnapshot(String profileId) {
        PrivacyDtos.PrivacySnapshotResponse snapshot = new PrivacyDtos.PrivacySnapshotResponse(
                OffsetDateTime.now(),
                "v1",
                getOverview(profileId)
        );

        auditLogService.log(
                profileId,
                profileId,
                "PRIVACY_EXPORT",
                "Datenschutz-Snapshot exportiert (watchers=" + snapshot.overview().activeWatcherCount()
                        + ", invites=" + snapshot.overview().pendingInviteCount()
                        + ", shareLinks=" + snapshot.overview().activeShareLinkCount() + ")."
        );

        return snapshot;
    }

    @Transactional
    public PrivacyDtos.DeletionRequestSummary requestDeletion(String profileId) {
        Profile profile = getProfile(profileId);
        profile.setPrivacyDeleteStatus(Profile.PrivacyDeleteStatus.REQUESTED);
        profile.setPrivacyDeleteRequestedAt(OffsetDateTime.now());
        profileRepository.save(profile);

        auditLogService.log(
                profileId,
                profileId,
                "PRIVACY_DELETE_REQUEST",
                "Löschanfrage gestellt."
        );

        return toDeletionRequestSummary(profile);
    }

    @Transactional
    public PrivacyDtos.DeletionRequestSummary revokeDeletionRequest(String profileId) {
        Profile profile = getProfile(profileId);
        profile.setPrivacyDeleteStatus(Profile.PrivacyDeleteStatus.REVOKED);
        profileRepository.save(profile);

        auditLogService.log(
                profileId,
                profileId,
                "PRIVACY_DELETE_REQUEST_REVOKE",
                "Löschanfrage widerrufen."
        );

        return toDeletionRequestSummary(profile);
    }

    @Transactional(readOnly = true)
    public PrivacyDtos.DeletionRequestSummary getDeletionRequest(String profileId) {
        return toDeletionRequestSummary(getProfile(profileId));
    }

    private PrivacyDtos.LinkSummary toLinkSummary(ProfileLink link) {
        return new PrivacyDtos.LinkSummary(
                link.getId(),
                link.getRole(),
                link.getStatus(),
                ProfileLinkDtos.ProfileSummary.from(link.getOwner()),
                link.getWatcher() != null ? ProfileLinkDtos.ProfileSummary.from(link.getWatcher()) : null,
                link.getExpiresAt(),
                link.getCreatedAt(),
                isActiveLink(link)
        );
    }

    private PrivacyDtos.ShareLinkSummary toShareSummary(ShareLink link) {
        return new PrivacyDtos.ShareLinkSummary(
                link.getId(),
                link.getMode(),
                link.getExpiresAt(),
                link.getCreatedAt(),
                isActiveShareLink(link)
        );
    }

    private PrivacyDtos.DeletionRequestSummary toDeletionRequestSummary(Profile profile) {
        boolean active = profile.getPrivacyDeleteStatus() == Profile.PrivacyDeleteStatus.REQUESTED;
        return new PrivacyDtos.DeletionRequestSummary(
                profile.getPrivacyDeleteStatus(),
                profile.getPrivacyDeleteRequestedAt(),
                active
        );
    }

    private boolean isActiveLink(ProfileLink link) {
        if (link.getStatus() != ProfileLink.LinkStatus.ACCEPTED && link.getStatus() != ProfileLink.LinkStatus.PENDING) {
            return false;
        }
        return link.getExpiresAt() == null || link.getExpiresAt().isAfter(OffsetDateTime.now());
    }

    private boolean isActiveShareLink(ShareLink link) {
        return !link.isRevoked()
                && (link.getExpiresAt() == null || link.getExpiresAt().isAfter(OffsetDateTime.now()));
    }

    private Profile getProfile(String profileId) {
        return profileRepository.findById(profileId)
                .orElseThrow(() -> new EntityNotFoundException("Profil nicht gefunden: " + profileId));
    }

    private SettingsDtos.SettingsResponse getSettings(String profileId) {
        return settingsRepository.findById(profileId)
                .map(SettingsDtos.SettingsResponse::from)
                .orElseGet(() -> SettingsDtos.SettingsResponse.from(buildDefaultSettings(getProfile(profileId))));
    }

    private Settings buildDefaultSettings(Profile profile) {
        Settings settings = new Settings();
        settings.setProfile(profile);
        settings.setProfileId(profile.getId());
        return settings;
    }
}
