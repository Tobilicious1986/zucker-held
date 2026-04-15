package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.AuthDtos;
import de.zuckerheld.api.dto.ProfileDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.AuthRateLimitService;
import de.zuckerheld.domain.service.ProfileService;
import de.zuckerheld.infrastructure.security.JwtService;
import de.zuckerheld.infrastructure.security.KeycloakAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Authentifizierung: Login, Token-Refresh und PIN-Elevation.
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Login, Refresh und Admin-Elevation")
public class AuthController {

    private final ProfileService profileService;
    private final JwtService     jwtService;
    private final AuthRateLimitService authRateLimitService;
    private final KeycloakAdminService keycloakAdminService;

    public AuthController(ProfileService profileService,
                          JwtService jwtService,
                          AuthRateLimitService authRateLimitService,
                          KeycloakAdminService keycloakAdminService) {
        this.profileService = profileService;
        this.jwtService     = jwtService;
        this.authRateLimitService = authRateLimitService;
        this.keycloakAdminService = keycloakAdminService;
    }

    // ═══════════════════════════════════════════════════════════════════════

    @Operation(summary = "Login mit Profil-ID und optionalem PIN")
    @PostMapping("/login")
    public ResponseEntity<AuthDtos.AuthResponse> login(@Valid @RequestBody AuthDtos.LoginRequest req) {
        if (authRateLimitService.isBlocked(req.profileId())) {
            long wait = authRateLimitService.getRemainingLockSeconds(req.profileId());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(wait))
                    .build();
        }

        Profile profile = profileService.getProfile(req.profileId());

        // PIN prüfen wenn eines gesetzt ist
        if (profile.getPinHash() != null) {
            if (!profileService.verifyPin(req.profileId(), req.pin())) {
                authRateLimitService.registerFailure(req.profileId());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        }
        authRateLimitService.registerSuccess(req.profileId());

        String accessToken  = jwtService.generateToken(profile.getId(), profile.getRole().toString());
        String refreshToken = jwtService.generateRefreshToken(profile.getId());

        return ResponseEntity.ok(new AuthDtos.AuthResponse(
                accessToken,
                refreshToken,
                ProfileDtos.ProfileResponse.from(profile)
        ));
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Neues Konto registrieren")
    @PostMapping("/register")
    public ResponseEntity<AuthDtos.AuthResponse> register(@Valid @RequestBody AuthDtos.RegisterRequest req) {
        try {
            keycloakAdminService.createUser(req.email(), req.name(), req.password(), req.type());
        } catch (KeycloakAdminService.EmailAlreadyExistsException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        ProfileDtos.CreateProfileRequest createReq = new ProfileDtos.CreateProfileRequest(
                req.name(),
                req.avatar() != null ? req.avatar() : "🦊",
                req.type() != null ? req.type() : "erwachsen",
                "patient",
                null,
                4,
                "kind".equalsIgnoreCase(req.type()) ? "child_young" : "adult"
        );
        Profile profile = profileService.createProfile(createReq);

        String accessToken  = jwtService.generateToken(profile.getId(), profile.getRole().toString());
        String refreshToken = jwtService.generateRefreshToken(profile.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthDtos.AuthResponse(
                accessToken,
                refreshToken,
                ProfileDtos.ProfileResponse.from(profile)
        ));
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Access-Token mit Refresh-Token erneuern")
    @PostMapping("/refresh")
    public ResponseEntity<AuthDtos.TokenResponse> refresh(@Valid @RequestBody AuthDtos.RefreshRequest req) {
        String token = req.refreshToken();

        if (!jwtService.isTokenValid(token) || !jwtService.isRefreshToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String profileId = jwtService.extractProfileId(token);
        // Aktuelle Rolle aus DB laden (Rolle könnte sich geändert haben)
        Profile profile = profileService.getProfile(profileId);
        String newToken = jwtService.generateToken(profileId, profile.getRole().toString());

        return ResponseEntity.ok(new AuthDtos.TokenResponse(newToken));
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Admin-Token durch PIN-Verifikation erhalten (15 Min gültig)")
    @PostMapping("/elevate")
    @PreAuthorize("hasRole('CAREGIVER') or hasRole('PATIENT') or hasRole('ADMIN')")
    public ResponseEntity<AuthDtos.TokenResponse> elevate(
            @Valid @RequestBody AuthDtos.ElevateRequest req,
            Authentication auth) {

        Profile profile = (Profile) auth.getPrincipal();

        if (!profileService.verifyPin(profile.getId(), req.pin())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String elevatedToken = jwtService.generateElevatedToken(
                profile.getId(), profile.getRole().toString());

        return ResponseEntity.ok(new AuthDtos.TokenResponse(elevatedToken));
    }
}
