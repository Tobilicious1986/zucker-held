package de.zuckerheld.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Alle Auth-bezogenen DTOs in einer Datei */
public class AuthDtos {

    public record LoginRequest(
        @NotBlank String profileId,
        String pin          // optional (bei Profil ohne PIN leer)
    ) {}

    public record RegisterRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        String avatar,
        String type
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
