package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.ShareDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.ShareLink;
import de.zuckerheld.domain.service.AuditLogService;
import de.zuckerheld.domain.service.ShareLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@Tag(name = "Share", description = "Zeitlich begrenzte Share-Links für Arzt-/Mini-Ansicht")
public class ShareController {

    private final ShareLinkService shareLinkService;
    private final AuditLogService auditLogService;

    public ShareController(ShareLinkService shareLinkService,
                           AuditLogService auditLogService) {
        this.shareLinkService = shareLinkService;
        this.auditLogService = auditLogService;
    }

    @Operation(summary = "Neuen Share-Link erstellen (DOCTOR oder MINI)")
    @PostMapping("/api/v1/share-links")
    public ResponseEntity<ShareDtos.ShareLinkResponse> createLink(
            @Valid @RequestBody ShareDtos.CreateShareLinkRequest req,
            Authentication auth) {
        Profile profile = (Profile) auth.getPrincipal();
        ShareLink link = shareLinkService.createLink(profile.getId(), req.mode(), req.ttlHours());
        auditLogService.log(
                profile.getId(),
                profile.getId(),
                "SHARE_LINK_CREATE",
                "Share-Link (" + req.mode() + ") erstellt."
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ShareDtos.ShareLinkResponse.from(link));
    }

    @Operation(summary = "Eigene Share-Links auflisten")
    @GetMapping("/api/v1/share-links")
    public List<ShareDtos.ShareLinkResponse> listLinks(Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        return shareLinkService.listLinks(profileId).stream().map(ShareDtos.ShareLinkResponse::from).toList();
    }

    @Operation(summary = "Share-Link widerrufen")
    @DeleteMapping("/api/v1/share-links/{id}")
    public ResponseEntity<Void> revokeLink(@PathVariable UUID id, Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        shareLinkService.revokeLink(id, profileId);
        auditLogService.log(profileId, profileId, "SHARE_LINK_REVOKE", "Share-Link widerrufen.");
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Öffentliche Share-Ansicht per Token")
    @GetMapping("/api/v1/public/share/{token}")
    public ResponseEntity<ShareDtos.PublicShareResponse> publicShare(@PathVariable String token) {
        return ResponseEntity.ok(shareLinkService.resolvePublicSnapshot(token));
    }
}
