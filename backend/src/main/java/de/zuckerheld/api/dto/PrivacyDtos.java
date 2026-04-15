package de.zuckerheld.api.dto;

import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.ProfileLink;
import de.zuckerheld.domain.model.ShareLink;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class PrivacyDtos {

    public record LinkSummary(
            UUID id,
            ProfileLink.LinkRole role,
            ProfileLink.LinkStatus status,
            ProfileLinkDtos.ProfileSummary owner,
            ProfileLinkDtos.ProfileSummary watcher,
            OffsetDateTime expiresAt,
            OffsetDateTime createdAt,
            boolean active
    ) {}

    public record ShareLinkSummary(
            UUID id,
            ShareLink.ShareMode mode,
            OffsetDateTime expiresAt,
            OffsetDateTime createdAt,
            boolean active
    ) {}

    public record DeletionRequestSummary(
            Profile.PrivacyDeleteStatus status,
            OffsetDateTime requestedAt,
            boolean active
    ) {}

    public record PrivacyOverviewResponse(
            ProfileDtos.ProfileResponse profile,
            SettingsDtos.SettingsResponse settings,
            DeletionRequestSummary deletionRequest,
            List<LinkSummary> activeWatchers,
            List<LinkSummary> pendingInvites,
            List<ShareLinkSummary> shareLinks,
            int activeWatcherCount,
            int pendingInviteCount,
            int activeShareLinkCount
    ) {}

    public record PrivacySnapshotResponse(
            OffsetDateTime generatedAt,
            String snapshotVersion,
            PrivacyOverviewResponse overview
    ) {}
}
