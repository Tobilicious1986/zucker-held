package de.zuckerheld.api.controller;

import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.domain.model.Settings;
import de.zuckerheld.domain.model.ShareLink;
import de.zuckerheld.domain.service.InsightsService;
import de.zuckerheld.infrastructure.repository.EntryRepository;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import de.zuckerheld.infrastructure.repository.ShareLinkRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;

/**
 * Sprint 15 — CLN-02: Strukturierter Fachpersonen-View.
 * Liefert klinisch relevante Daten für DOCTOR-Mode Share-Links.
 * Abgelaufener Token → 410 GONE, ungültiger Token → 404 NOT_FOUND (kein 403, verhindert Enumeration).
 */
@RestController
@Tag(name = "Clinical View", description = "Strukturierter Arzt-/Fachpersonen-View (CLN-02)")
public class ClinicalViewController {

    private final ShareLinkRepository shareLinkRepository;
    private final EntryRepository     entryRepository;
    private final InsightsService     insightsService;
    private final SettingsRepository  settingsRepository;

    public ClinicalViewController(ShareLinkRepository shareLinkRepository,
                                   EntryRepository entryRepository,
                                   InsightsService insightsService,
                                   SettingsRepository settingsRepository) {
        this.shareLinkRepository = shareLinkRepository;
        this.entryRepository     = entryRepository;
        this.insightsService     = insightsService;
        this.settingsRepository  = settingsRepository;
    }

    @Operation(summary = "Klinische Ansicht per DOCTOR-Token (CLN-02)")
    @GetMapping("/api/v1/share/{token}/clinical-view")
    public ResponseEntity<ClinicalViewResponse> getClinicalView(@PathVariable String token) {

        // Revozierter oder nicht existierender Token → 404 (kein 403 — verhindert Token-Enumeration)
        ShareLink link = shareLinkRepository.findByTokenAndRevokedFalse(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Link nicht gefunden."));

        // Abgelaufener Token → 410 GONE
        if (link.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Dieser Link ist abgelaufen.");
        }

        // Nur DOCTOR-Links für klinische Ansicht
        if (link.getMode() != ShareLink.ShareMode.DOCTOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Klinische Ansicht nur für Arzt-Links.");
        }

        String ownerId = link.getOwner().getId();

        // 14-Tage-Einträge (BZ, Insulin, Mahlzeit)
        long to   = System.currentTimeMillis();
        long from = to - (14L * 24 * 60 * 60 * 1000);
        List<Entry> entries = entryRepository.findByProfileAndTimeRange(ownerId, from, to);

        // Letzter BZ
        Entry lastBzEntry = entries.stream()
                .filter(e -> e.getType() == Entry.EntryType.BZ && e.getBzValue() != null)
                .findFirst()
                .orElse(null);

        // Metriken (14 Tage)
        var metrics = insightsService.computeMetrics(ownerId, 14);

        // Therapieplan (Allow-List: nur klinisch relevante Felder)
        Settings settings = settingsRepository.findById(ownerId).orElse(null);
        ClinicalSettingsView therapyPlan = settings != null
                ? new ClinicalSettingsView(
                        settings.getBzMin(),
                        settings.getBzMax(),
                        settings.getTargetBz(),
                        settings.getInsulinRatio(),
                        settings.getCorrectionFactor()
                  )
                : null;

        // Entry-Timeline (max. 50, nur BZ/Insulin/Mahlzeit/Ketone)
        List<ClinicalEntry> timeline = entries.stream()
                .filter(e -> e.getType() == Entry.EntryType.BZ
                          || e.getType() == Entry.EntryType.INSULIN
                          || e.getType() == Entry.EntryType.MEAL
                          || e.getType() == Entry.EntryType.KETONE)
                .limit(50)
                .map(e -> new ClinicalEntry(
                        e.getTimestamp(),
                        e.getType().toString().toLowerCase(Locale.ROOT),
                        buildClinicalLabel(e),
                        e.getType() == Entry.EntryType.BZ ? e.getBzValue() : null
                ))
                .toList();

        return ResponseEntity.ok(new ClinicalViewResponse(
                link.getOwner().getName(),
                OffsetDateTime.now(),
                metrics.tirPercent(),
                metrics.gmi(),
                metrics.cvPercent(),
                lastBzEntry != null ? lastBzEntry.getBzValue() : null,
                lastBzEntry != null ? lastBzEntry.getTimestamp() : null,
                timeline,
                therapyPlan,
                link.getExpiresAt()
        ));
    }

    // ── Response-DTOs (inline, kein Package-Bloat für ein Feature) ────────

    public record ClinicalViewResponse(
            String ownerName,
            OffsetDateTime generatedAt,
            BigDecimal tirPercent,
            BigDecimal gmi,
            BigDecimal cvPercent,
            Integer lastBz,
            Long lastBzAt,
            List<ClinicalEntry> entries14d,
            ClinicalSettingsView therapyPlan,
            OffsetDateTime tokenExpiresAt
    ) {}

    public record ClinicalEntry(
            Long timestamp,
            String type,
            String label,
            Integer bzValue
    ) {}

    /** Allow-List: nur klinisch relevante Settings-Felder — keine API-Keys, keine UI-Prefs */
    public record ClinicalSettingsView(
            Integer bzMin,
            Integer bzMax,
            Integer targetBz,
            Integer insulinRatio,
            Integer correctionFactor
    ) {}

    private String buildClinicalLabel(Entry e) {
        return switch (e.getType()) {
            case BZ      -> (e.getBzValue() != null ? e.getBzValue() : "—") + " mg/dL";
            case INSULIN -> (e.getInsulinUnits() != null ? e.getInsulinUnits() : "—") + " IE";
            case MEAL    -> (e.getMealName() != null ? e.getMealName() : "Mahlzeit")
                            + (e.getMealKh() != null ? " (" + e.getMealKh() + " g KH)" : "");
            case KETONE  -> "Ketone " + (e.getKetoneValue() != null ? e.getKetoneValue() : "—");
            default      -> e.getType().toString();
        };
    }
}
