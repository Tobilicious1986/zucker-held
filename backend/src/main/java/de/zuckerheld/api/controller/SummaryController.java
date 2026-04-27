package de.zuckerheld.api.controller;

import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.InsightsService;
import de.zuckerheld.domain.service.ProfileLinkService;
import de.zuckerheld.infrastructure.repository.EntryRepository;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import jakarta.persistence.EntityNotFoundException;
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
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

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
    private final ProfileRepository  profileRepository;
    private final EntryRepository    entryRepository;

    public SummaryController(ProfileLinkService linkService,
                             InsightsService insightsService,
                             ProfileRepository profileRepository,
                             EntryRepository entryRepository) {
        this.linkService     = linkService;
        this.insightsService = insightsService;
        this.profileRepository = profileRepository;
        this.entryRepository = entryRepository;
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

        Profile owner = profileRepository.findById(ownerId)
                .orElseThrow(() -> new EntityNotFoundException("Profil nicht gefunden: " + ownerId));
        var metrics = insightsService.computeMetrics(ownerId, 7);
        GlucoseCounts counts = computeGlucoseCounts(ownerId, 7);

        return ResponseEntity.ok(new SummaryResponse(
                ownerId,
                owner.getName(),
                LocalDate.now().minusDays(7).toString(),
                LocalDate.now().toString(),
                metrics.tirPercent(),
                counts.hypoCount(),
                counts.hyperCount(),
                metrics.avgBz(),
                metrics.totalReadings()
        ));
    }

    private GlucoseCounts computeGlucoseCounts(String ownerId, int days) {
        long to = Instant.now().toEpochMilli();
        long from = Instant.now().minus(days, ChronoUnit.DAYS).toEpochMilli();
        List<Entry> entries = entryRepository.findByProfileAndTimeRange(ownerId, from, to);
        long hypo = entries.stream()
                .filter(e -> e.getType() == Entry.EntryType.BZ && e.getBzValue() != null)
                .filter(e -> e.getBzValue() < 70)
                .count();
        long hyper = entries.stream()
                .filter(e -> e.getType() == Entry.EntryType.BZ && e.getBzValue() != null)
                .filter(e -> e.getBzValue() > 180)
                .count();
        return new GlucoseCounts(hypo, hyper);
    }

    private record GlucoseCounts(long hypoCount, long hyperCount) {}

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
