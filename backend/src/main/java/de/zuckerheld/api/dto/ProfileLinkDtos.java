package de.zuckerheld.api.dto;

import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.ProfileLink;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ProfileLinkDtos {

    /** Anfrage: Einladungslink erstellen */
    public record CreateInviteRequest(
        @NotNull ProfileLink.LinkRole role   // OBSERVER, CAREGIVER, ADMIN
    ) {}

    /** Antwort nach Einladungscode-Erstellung */
    public record InviteResponse(
        UUID            id,
        String          inviteCode,
        String          ownerId,
        String          ownerName,
        String          ownerAvatar,
        ProfileLink.LinkRole role,
        OffsetDateTime  expiresAt
    ) {
        public static InviteResponse from(ProfileLink link) {
            return new InviteResponse(
                link.getId(),
                link.getInviteCode(),
                link.getOwner().getId(),
                link.getOwner().getName(),
                link.getOwner().getAvatar(),
                link.getRole(),
                link.getExpiresAt()
            );
        }
    }

    /** Anfrage: Einladungscode einlösen */
    public record AcceptInviteRequest(
        @NotNull String inviteCode
    ) {}

    /** Anfrage: Eltern-/Betreuer-Ping senden */
    public record GuardianPingRequest(
        @NotBlank String message
    ) {}

    /** Antwort: Anzahl erreichter Empfänger */
    public record GuardianPingResponse(
        int recipients
    ) {}

    /** Vollständige Link-Darstellung (für Listen) */
    public record ProfileLinkResponse(
        UUID                    id,
        ProfileSummary          owner,
        ProfileSummary          watcher,
        ProfileLink.LinkRole    role,
        ProfileLink.LinkStatus  status,
        OffsetDateTime          createdAt
    ) {
        public static ProfileLinkResponse from(ProfileLink link) {
            return new ProfileLinkResponse(
                link.getId(),
                ProfileSummary.from(link.getOwner()),
                link.getWatcher() != null ? ProfileSummary.from(link.getWatcher()) : null,
                link.getRole(),
                link.getStatus(),
                link.getCreatedAt()
            );
        }
    }

    public record ProfileSummary(
        String id,
        String name,
        String avatar,
        Profile.Role   role,
        Profile.ProfileType type,
        String ageGroup,
        Integer lastBz   // nur befüllt wenn gerade verfügbar
    ) {
        public static ProfileSummary from(Profile p) {
            return new ProfileSummary(
                p.getId(), p.getName(), p.getAvatar(),
                p.getRole(), p.getType(),
                p.getAgeGroup(),
                null
            );
        }
    }
}
