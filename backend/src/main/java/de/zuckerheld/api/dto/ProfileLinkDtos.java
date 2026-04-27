package de.zuckerheld.api.dto;

import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.ProfileLink;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class ProfileLinkDtos {

    /** Anfrage: Einladungslink erstellen */
    public record CreateInviteRequest(
        @NotNull ProfileLink.LinkRole role,
        @NotNull ProfileLink.RelationshipKind relationshipKind,
        @NotNull ProfileLink.AccessScope accessScope,
        @NotBlank @Size(min = 3, max = 120) String purpose,
        ProfileLink.ProfessionalRole professionalRole,
        Integer accessDurationHours
    ) {}

    /** Antwort nach Einladungscode-Erstellung */
    public record InviteResponse(
        UUID            id,
        String          inviteCode,
        String          ownerId,
        String          ownerName,
        String          ownerAvatar,
        ProfileLink.LinkRole role,
        ProfileLink.RelationshipKind relationshipKind,
        ProfileLink.AccessScope accessScope,
        ProfileLink.ProfessionalRole professionalRole,
        String purpose,
        OffsetDateTime  inviteExpiresAt,
        Integer         accessDurationHours,
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
                link.getRelationshipKind(),
                link.getAccessScope(),
                link.getProfessionalRole(),
                link.getPurpose(),
                link.getInviteExpiresAt(),
                link.getAccessDurationHours(),
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
        int recipients,
        List<String> recipientNames
    ) {}

    /** Vollständige Link-Darstellung (für Listen) */
    public record ProfileLinkResponse(
        UUID                    id,
        ProfileSummary          owner,
        ProfileSummary          watcher,
        ProfileLink.LinkRole    role,
        ProfileLink.RelationshipKind relationshipKind,
        ProfileLink.AccessScope accessScope,
        ProfileLink.ProfessionalRole professionalRole,
        String purpose,
        ProfileLink.LinkStatus  status,
        OffsetDateTime          inviteExpiresAt,
        Integer                 accessDurationHours,
        OffsetDateTime          expiresAt,
        OffsetDateTime          createdAt
    ) {
        public static ProfileLinkResponse from(ProfileLink link) {
            return new ProfileLinkResponse(
                link.getId(),
                ProfileSummary.from(link.getOwner()),
                link.getWatcher() != null ? ProfileSummary.from(link.getWatcher()) : null,
                link.getRole(),
                link.getRelationshipKind(),
                link.getAccessScope(),
                link.getProfessionalRole(),
                link.getPurpose(),
                link.getStatus(),
                link.getInviteExpiresAt(),
                link.getAccessDurationHours(),
                link.getExpiresAt(),
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
