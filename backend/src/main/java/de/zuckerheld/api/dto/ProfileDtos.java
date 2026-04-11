package de.zuckerheld.api.dto;

import de.zuckerheld.domain.model.Profile;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public class ProfileDtos {

    public record CreateProfileRequest(
        @NotBlank @Size(max = 255) String name,
        String avatar,          // default '🦊'
        String type,            // 'kind' | 'erwachsen'
        String role,            // default 'patient'
        String pin              // optional
    ) {}

    public record UpdateProfileRequest(
        @Size(max = 255) String name,
        String avatar,
        String pin              // null = PIN entfernen, leer = unverändert
    ) {}

    public record ProfileResponse(
        String id,
        String name,
        String avatar,
        String type,
        String role,
        boolean hasPin,
        OffsetDateTime createdAt
    ) {
        public static ProfileResponse from(Profile p) {
            return new ProfileResponse(
                p.getId(),
                p.getName(),
                p.getAvatar(),
                p.getType().toString(),
                p.getRole().toString(),
                p.getPinHash() != null,
                p.getCreatedAt()
            );
        }
    }
}
