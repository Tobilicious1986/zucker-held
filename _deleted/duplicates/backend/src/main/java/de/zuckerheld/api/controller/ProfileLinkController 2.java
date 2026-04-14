package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.ProfileLinkDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.ProfileLink;
import de.zuckerheld.domain.service.GuardianPingService;
import de.zuckerheld.domain.service.ProfileLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Familien-Links: Einladungen erstellen, annehmen, widerrufen.
 * Ermöglicht Eltern/Betreuer/Ärzten Zugang zu Patientendaten.
 */
@RestController
@PreAuthorize("isAuthenticated()")
@Tag(name = "Profile Links", description = "Familien-Rollen und Zugriffsfreigaben")
public class ProfileLinkController {

    private final ProfileLinkService linkService;
    private final GuardianPingService guardianPingService;

    public ProfileLinkController(ProfileLinkService linkService,
                                 GuardianPingService guardianPingService) {
        this.linkService = linkService;
        this.guardianPingService = guardianPingService;
    }

    // ── Wer beobachte ich? ─────────────────────────────────────────────────

    @Operation(summary = "Profile die ich beobachte (als Watcher)")
    @GetMapping("/api/v1/profiles/{id}/watching")
    public List<ProfileLinkDtos.ProfileLinkResponse> getWatching(
            @PathVariable String id, Authentication auth) {
        requireSelfOrAdmin(id, auth);
        return linkService.getWatching(id).stream()
                .map(ProfileLinkDtos.ProfileLinkResponse::from)
                .toList();
    }

    // ── Wer beobachtet mein Profil? ────────────────────────────────────────

    @Operation(summary = "Watcher die mein Profil beobachten dürfen")
    @GetMapping("/api/v1/profiles/{id}/watchers")
    public List<ProfileLinkDtos.ProfileLinkResponse> getWatchers(
            @PathVariable String id, Authentication auth) {
        requireSelfOrAdmin(id, auth);
        return linkService.getWatchers(id).stream()
                .map(ProfileLinkDtos.ProfileLinkResponse::from)
                .toList();
    }

    // ── Einladungslink erstellen ───────────────────────────────────────────

    @Operation(summary = "Einladungslink erstellen (nur ADMIN-Profil)")
    @PostMapping("/api/v1/profiles/{id}/invite")
    public ResponseEntity<ProfileLinkDtos.InviteResponse> createInvite(
            @PathVariable String id,
            @Valid @RequestBody ProfileLinkDtos.CreateInviteRequest req,
            Authentication auth) {
        requireSelfOrAdmin(id, auth);
        ProfileLink link = linkService.createInvite(id, req.role());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ProfileLinkDtos.InviteResponse.from(link));
    }

    // ── Einladung annehmen ─────────────────────────────────────────────────

    @Operation(summary = "Einladungscode einlösen → Link wird aktiv")
    @PostMapping("/api/v1/profile-links/accept")
    public ResponseEntity<ProfileLinkDtos.ProfileLinkResponse> acceptInvite(
            @Valid @RequestBody ProfileLinkDtos.AcceptInviteRequest req,
            Authentication auth) {
        String watcherId = ((Profile) auth.getPrincipal()).getId();
        ProfileLink link = linkService.acceptInvite(req.inviteCode(), watcherId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ProfileLinkDtos.ProfileLinkResponse.from(link));
    }

    // ── Link widerrufen ────────────────────────────────────────────────────

    @Operation(summary = "Zugriff entziehen (Owner oder Watcher)")
    @DeleteMapping("/api/v1/profile-links/{linkId}")
    public ResponseEntity<Void> revokeLink(
            @PathVariable UUID linkId, Authentication auth) {
        String requesterId = ((Profile) auth.getPrincipal()).getId();
        linkService.revokeLink(linkId, requesterId);
        return ResponseEntity.noContent().build();
    }

    // ── Eltern-/Betreuer-Ping ─────────────────────────────────────────────

    @Operation(summary = "Eltern-/Betreuer-Ping senden")
    @PostMapping("/api/v1/profiles/{id}/guardian-ping")
    public ResponseEntity<ProfileLinkDtos.GuardianPingResponse> sendGuardianPing(
            @PathVariable String id,
            @Valid @RequestBody ProfileLinkDtos.GuardianPingRequest req,
            Authentication auth) {
        requireSelfOrAdmin(id, auth);
        int recipients = guardianPingService.sendGuardianPing(id, req.message());
        return ResponseEntity.ok(new ProfileLinkDtos.GuardianPingResponse(recipients));
    }

    // ── Hilfsmethoden ──────────────────────────────────────────────────────

    private void requireSelfOrAdmin(String profileId, Authentication auth) {
        Profile caller = (Profile) auth.getPrincipal();
        if (!caller.getId().equals(profileId) && !caller.getRole().hasMinRole(Profile.Role.ADMIN)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Kein Zugriff auf fremde Profile.");
        }
    }
}
