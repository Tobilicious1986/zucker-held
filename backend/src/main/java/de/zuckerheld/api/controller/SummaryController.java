package de.zuckerheld.api.controller;

import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.InsightsService;
import de.zuckerheld.domain.service.ProfileLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Sprint 15 — NET-03: Wochenbericht für SUMMARY_ONLY-Watcher.
 * Kein Einzeleintrag, nur aggregierte Kennzahlen für die letzte Woche.
 */
@RestController
@Tag(name = "Summary", description = "Wochenbericht für SUMMARY_ONLY-Zugriff (NET-03)")
@PreAuthorize("isAuthenticated()")
public class SummaryController {

    private final ProfileLinkService linkService;
    private final InsightsService    insightsService;

    public SummaryController(ProfileLinkService linkService, InsightsService insightsService) {
        this.linkService     = linkService;
        this.insightsService = insightsService;
    }

    @Operation(summary = "Wochenzusammenfassung für SUMMARY_ONLY-Watcher")
    @GetMapping("/api/v1/profiles/{ownerId}/summary")
    public ResponseEntity<SummaryResponse> getSummary(
            @PathVariable String ownerId,
            Authentication auth) {

        String watcherId = ((Profile) auth.getPrincipal()).getId();

        // Eigener Zugriff immer erlaubt (Owner sieht eigene Zusammenfassung)
        boolean isSelf = ownerId.equals(watcherId);
        if (!isSelf && !linkService.grantsSummaryAccess(ownerId, watcherId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Kein SUMMARY_ONLY-Zugang für dieses Profil.");
        }

        var metrics = insightsService.computeMetrics(ownerId, 7);
        Profile owner = ((Profile) auth.getPrincipal());

        return ResponseEntity.ok(new SummaryResponse(
                ownerId,
                isSelf ? owner.getName() : "—",
                LocalDate.now().minusDays(7).toString(),
                LocalDate.now().toString(),
                metrics.tirPercent(),
                toLong(metrics.belowPercent()),
                toLong(metrics.abovePercent()),
                metrics.avgBz(),
                metrics.totalReadings()
        ));
    }

    private long toLong(BigDecimal pct) {
        if (pct == null) return 0;
        // Näherung: pro 7 Tage / 8 Messungen täglich = 56 Messungen
        return Math.round(pct.doubleValue() * 56 / 100);
    }

    public record SummaryResponse(
            String ownerId,
            String ownerName,
            String weekFrom,
            String weekTo,
            BigDecimal tirPercent,
            long hypoCount,
            long hyperCount,
            BigDecimal avgBz,
            int entryCount
    ) {}
}
