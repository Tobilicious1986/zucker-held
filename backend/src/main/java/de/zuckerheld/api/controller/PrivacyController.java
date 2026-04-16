package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.PrivacyDtos;
import de.zuckerheld.domain.model.AuditLog;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.AuditLogService;
import de.zuckerheld.domain.service.PrivacyHubService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/privacy")
@Tag(name = "Privacy", description = "Datenschutz- und Freigabe-Hub")
@PreAuthorize("isAuthenticated()")
public class PrivacyController {

    private final PrivacyHubService privacyHubService;
    private final AuditLogService   auditLogService;

    public PrivacyController(PrivacyHubService privacyHubService,
                              AuditLogService auditLogService) {
        this.privacyHubService = privacyHubService;
        this.auditLogService   = auditLogService;
    }

    @Operation(summary = "Datenschutz-Übersicht für das eigene Profil")
    @GetMapping("/overview")
    public ResponseEntity<PrivacyDtos.PrivacyOverviewResponse> overview(Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        return ResponseEntity.ok(privacyHubService.getOverview(profileId));
    }

    @Operation(summary = "JSON-Snapshot des eigenen Profils exportieren")
    @GetMapping("/export")
    public ResponseEntity<PrivacyDtos.PrivacySnapshotResponse> export(Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        return ResponseEntity.ok(privacyHubService.exportSnapshot(profileId));
    }

    @Operation(summary = "Löschanfrage stellen")
    @PostMapping("/deletion-request")
    public ResponseEntity<PrivacyDtos.DeletionRequestSummary> requestDeletion(Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        return ResponseEntity.ok(privacyHubService.requestDeletion(profileId));
    }

    @Operation(summary = "Löschanfrage widerrufen")
    @DeleteMapping("/deletion-request")
    public ResponseEntity<PrivacyDtos.DeletionRequestSummary> revokeDeletion(Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        return ResponseEntity.ok(privacyHubService.revokeDeletionRequest(profileId));
    }

    @Operation(summary = "Consent-Journal: Verlauf aller Freigabe-Aktionen (NET-06)")
    @GetMapping("/consent-history")
    public ResponseEntity<Page<PrivacyDtos.ConsentEventResponse>> consentHistory(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        Page<AuditLog> logs = auditLogService.getConsentHistory(
                profileId, PageRequest.of(page, Math.min(size, 100)));
        return ResponseEntity.ok(logs.map(l -> new PrivacyDtos.ConsentEventResponse(
                l.getId(),
                l.getAction(),
                l.getDetails(),
                l.getActor().getName(),
                l.getCreatedAt()
        )));
    }
}
