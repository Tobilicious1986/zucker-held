package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.InsightsDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.InsulinSupportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/insulin")
@Tag(name = "Insulin Support", description = "Adaptive Hinweise für den Bolus-Rechner")
public class InsulinSupportController {

    private final InsulinSupportService insulinSupportService;

    public InsulinSupportController(InsulinSupportService insulinSupportService) {
        this.insulinSupportService = insulinSupportService;
    }

    @Operation(summary = "Adaptive Bolus-Hinweis aus Historie")
    @GetMapping("/adaptive-suggestion")
    public ResponseEntity<InsightsDtos.AdaptiveBolusResponse> adaptiveSuggestion(
            @RequestParam int bz,
            @RequestParam int kh,
            Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        return ResponseEntity.ok(insulinSupportService.adaptiveSuggestion(profileId, bz, kh));
    }
}
