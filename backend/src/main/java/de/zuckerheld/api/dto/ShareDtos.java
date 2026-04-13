package de.zuckerheld.api.dto;

import de.zuckerheld.domain.model.ShareLink;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class ShareDtos {

    public record CreateShareLinkRequest(
            @NotNull ShareLink.ShareMode mode,
            Integer ttlHours
    ) {}

    public record ShareLinkResponse(
            UUID id,
            ShareLink.ShareMode mode,
            String token,
            OffsetDateTime expiresAt,
            boolean revoked,
            OffsetDateTime createdAt
    ) {
        public static ShareLinkResponse from(ShareLink link) {
            return new ShareLinkResponse(
                    link.getId(),
                    link.getMode(),
                    link.getToken(),
                    link.getExpiresAt(),
                    link.isRevoked(),
                    link.getCreatedAt()
            );
        }
    }

    public record PublicEntry(
            long timestamp,
            String type,
            String label
    ) {}

    public record PublicShareResponse(
            ShareLink.ShareMode mode,
            String ownerName,
            String ownerAvatar,
            Integer lastBz,
            Long lastBzTime,
            Double tir7d,
            Double gmi7d,
            Double cv7d,
            String emergencyMessage,
            List<String> insights,
            List<PublicEntry> entries
    ) {}

    public record GuardianPingRequest(
            @NotBlank String message
    ) {}
}
