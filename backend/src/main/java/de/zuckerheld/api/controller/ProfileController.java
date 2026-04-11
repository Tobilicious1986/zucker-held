package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.ProfileDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Profile-Verwaltung: Auflisten, Erstellen, Aktualisieren, Löschen.
 */
@RestController
@RequestMapping("/api/v1/profiles")
@Tag(name = "Profile", description = "Nutzerprofile verwalten")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    // ═══════════════════════════════════════════════════════════════════════

    @Operation(summary = "Alle Profile auflisten (öffentlich — für Login-Screen)")
    @GetMapping
    public List<ProfileDtos.ProfileResponse> listProfiles() {
        return profileService.getAllProfiles().stream()
                .map(ProfileDtos.ProfileResponse::from)
                .toList();
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Neues Profil erstellen")
    @PostMapping
    public ResponseEntity<ProfileDtos.ProfileResponse> createProfile(
            @Valid @RequestBody ProfileDtos.CreateProfileRequest req) {
        Profile created = profileService.createProfile(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ProfileDtos.ProfileResponse.from(created));
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Profil aktualisieren (nur eigenes Profil oder Admin)")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CAREGIVER') or hasRole('PATIENT') or hasRole('ADMIN')")
    public ResponseEntity<ProfileDtos.ProfileResponse> updateProfile(
            @PathVariable String id,
            @Valid @RequestBody ProfileDtos.UpdateProfileRequest req,
            Authentication auth) {

        Profile currentProfile = (Profile) auth.getPrincipal();

        // Nur eigenes Profil oder Admin darf aktualisieren
        boolean isOwnProfile = currentProfile.getId().equals(id);
        boolean isAdmin      = currentProfile.getRole().hasMinRole(Profile.Role.ADMIN);

        if (!isOwnProfile && !isAdmin) {
            throw new AccessDeniedException("Du kannst nur dein eigenes Profil bearbeiten.");
        }

        Profile updated = profileService.updateProfile(id, req);
        return ResponseEntity.ok(ProfileDtos.ProfileResponse.from(updated));
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Profil löschen (nur Admin)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProfile(@PathVariable String id) {
        profileService.deleteProfile(id);
        return ResponseEntity.noContent().build();
    }
}
