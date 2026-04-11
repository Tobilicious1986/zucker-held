package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.EntryDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.NightscoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Nightscout-Integration: Synchronisiert CGM-Daten vom Nightscout-Server.
 */
@RestController
@RequestMapping("/api/v1/nightscout")
@Tag(name = "Nightscout", description = "Nightscout CGM-Daten synchronisieren")
public class NightscoutProxyController {

    private final NightscoutService nightscoutService;

    public NightscoutProxyController(NightscoutService nightscoutService) {
        this.nightscoutService = nightscoutService;
    }

    // ═══════════════════════════════════════════════════════════════════════

    @Operation(summary = "Nightscout-Daten synchronisieren und neue Einträge zurückgeben")
    @GetMapping("/sync")
    public ResponseEntity<List<EntryDtos.EntryResponse>> sync(Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();

        List<EntryDtos.EntryResponse> newEntries = nightscoutService.fetchAndSync(profileId)
                .stream()
                .map(EntryDtos.EntryResponse::from)
                .toList();

        return ResponseEntity.ok(newEntries);
    }
}
