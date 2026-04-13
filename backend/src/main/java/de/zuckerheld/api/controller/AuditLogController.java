package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.AuditDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Audit", description = "Audit-Log für Admin-/Settings-Aktionen")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @Operation(summary = "Eigene Audit-Events abrufen")
    @GetMapping("/api/v1/audit-logs")
    public ResponseEntity<List<AuditDtos.AuditLogResponse>> getLogs(
            @RequestParam(defaultValue = "50") int size,
            Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        int safeSize = Math.max(10, Math.min(size, 200));
        List<AuditDtos.AuditLogResponse> logs = auditLogService
                .getLogs(profileId, PageRequest.of(0, safeSize))
                .map(AuditDtos.AuditLogResponse::from)
                .toList();
        return ResponseEntity.ok(logs);
    }
}
