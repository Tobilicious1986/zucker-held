package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.InsightsDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.InsightsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/insights")
@Tag(name = "Insights", description = "Metriken und Muster-Erkennung")
public class InsightsController {

    private final InsightsService insightsService;

    public InsightsController(InsightsService insightsService) {
        this.insightsService = insightsService;
    }

    @Operation(summary = "Konsensus-Metriken (TIR/GMI/CV) für Zeitraum")
    @GetMapping("/metrics")
    public ResponseEntity<InsightsDtos.MetricsResponse> metrics(
            @RequestParam(defaultValue = "14") int days,
            Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        int safeDays = Math.max(3, Math.min(days, 90));
        return ResponseEntity.ok(insightsService.computeMetrics(profileId, safeDays));
    }

    @Operation(summary = "Wiederkehrende Muster erkennen")
    @GetMapping("/patterns")
    public ResponseEntity<InsightsDtos.PatternResponse> patterns(
            @RequestParam(defaultValue = "14") int days,
            Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        int safeDays = Math.max(3, Math.min(days, 90));
        return ResponseEntity.ok(insightsService.detectPatterns(profileId, safeDays));
    }

    @Operation(summary = "Signalqualität und Datenqualität bewerten")
    @GetMapping("/data-quality")
    public ResponseEntity<InsightsDtos.DataQualityResponse> dataQuality(
            @RequestParam(defaultValue = "14") int days,
            Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        int safeDays = Math.max(3, Math.min(days, 90));
        return ResponseEntity.ok(insightsService.computeDataQuality(profileId, safeDays));
    }
}
