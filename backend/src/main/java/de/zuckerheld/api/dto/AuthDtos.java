package de.zuckerheld.api.dto;

import jakarta.validation.constraints.NotBlank;

/** Alle Auth-bezogenen DTOs in einer Datei */
public class AuthDtos {

    public record LoginRequest(
        @NotBlank String profileId,
        String pin          // optional (bei Profil ohne PIN leer)
    ) {}

    public record RefreshRequest(
        @NotBlank String refreshToken
    ) {}

    public record ElevateRequest(
        @NotBlank String pin
    ) {}

    public record AuthResponse(
        String token,
        String refreshToken,
        ProfileDtos.ProfileResponse profile
    ) {}

    public record TokenResponse(
        String token
    ) {}
}
