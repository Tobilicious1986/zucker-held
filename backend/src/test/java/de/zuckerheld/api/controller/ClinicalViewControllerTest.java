package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.InsightsDtos;
import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.Settings;
import de.zuckerheld.domain.model.ShareLink;
import de.zuckerheld.domain.service.InsightsService;
import de.zuckerheld.infrastructure.repository.EntryRepository;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import de.zuckerheld.infrastructure.repository.ShareLinkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * T-03: ClinicalViewTest
 * Prüft: gültiger Token, 410 GONE bei abgelaufenem Token, 404 bei falschem/widerrufenen Token,
 * 403 bei falschem Modus, keine privaten Felder in ClinicalSettingsView.
 */
@ExtendWith(MockitoExtension.class)
class ClinicalViewControllerTest {

    @Mock private ShareLinkRepository  shareLinkRepository;
    @Mock private EntryRepository      entryRepository;
    @Mock private InsightsService      insightsService;
    @Mock private SettingsRepository   settingsRepository;

    private ClinicalViewController controller;

    @BeforeEach
    void setUp() {
        controller = new ClinicalViewController(
                shareLinkRepository, entryRepository, insightsService, settingsRepository);
    }

    // ── Happy-Path ────────────────────────────────────────────────────────

    @Test
    void validDoctorTokenReturnsClinicalView() {
        ShareLink link = doctorLink(OffsetDateTime.now().plusDays(7));
        when(shareLinkRepository.findByTokenAndRevokedFalse("tok-valid")).thenReturn(Optional.of(link));
        when(entryRepository.findByProfileAndTimeRange(eq("owner-1"), anyLong(), anyLong()))
                .thenReturn(List.of());
        when(insightsService.computeMetrics("owner-1", 14))
                .thenReturn(metrics(72, 7.1, 35));
        when(settingsRepository.findById("owner-1")).thenReturn(Optional.empty());

        ResponseEntity<ClinicalViewController.ClinicalViewResponse> response =
                controller.getClinicalView("tok-valid");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Dr.-Owner", response.getBody().ownerName());
    }

    @Test
    void validTokenWithSettingsReturnsTherapyPlan() {
        ShareLink link = doctorLink(OffsetDateTime.now().plusDays(7));
        Settings settings = settingsWithClinicalFields();
        when(shareLinkRepository.findByTokenAndRevokedFalse("tok-settings")).thenReturn(Optional.of(link));
        when(entryRepository.findByProfileAndTimeRange(eq("owner-1"), anyLong(), anyLong()))
                .thenReturn(List.of());
        when(insightsService.computeMetrics("owner-1", 14))
                .thenReturn(metrics(68, 6.9, 40));
        when(settingsRepository.findById("owner-1")).thenReturn(Optional.of(settings));

        ResponseEntity<ClinicalViewController.ClinicalViewResponse> response =
                controller.getClinicalView("tok-settings");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        ClinicalViewController.ClinicalSettingsView plan = response.getBody().therapyPlan();
        assertNotNull(plan);
        assertEquals(70,  plan.bzMin());
        assertEquals(180, plan.bzMax());
        assertEquals(110, plan.targetBz());
        assertEquals(10,  plan.insulinRatio());
        assertEquals(50,  plan.correctionFactor());
    }

    @Test
    void entriesAreFilteredToClinicalTypes() {
        ShareLink link = doctorLink(OffsetDateTime.now().plusDays(7));
        Entry bzEntry      = entryWithType(Entry.EntryType.BZ, 120);
        Entry insulinEntry = entryWithType(Entry.EntryType.INSULIN, null);
        Entry activityEntry = entryWithType(Entry.EntryType.ACTIVITY, null);  // soll rausgefiltert werden

        when(shareLinkRepository.findByTokenAndRevokedFalse("tok-entries")).thenReturn(Optional.of(link));
        when(entryRepository.findByProfileAndTimeRange(eq("owner-1"), anyLong(), anyLong()))
                .thenReturn(List.of(bzEntry, insulinEntry, activityEntry));
        when(insightsService.computeMetrics("owner-1", 14))
                .thenReturn(metrics(72, 7.1, 35));
        when(settingsRepository.findById("owner-1")).thenReturn(Optional.empty());

        ResponseEntity<ClinicalViewController.ClinicalViewResponse> response =
                controller.getClinicalView("tok-entries");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        // NOTE-Eintrag wurde herausgefiltert — nur BZ und Insulin
        assertEquals(2, response.getBody().entries14d().size());
    }

    // ── Fehlerszenarien ───────────────────────────────────────────────────

    @Test
    void invalidOrRevokedTokenReturns404() {
        when(shareLinkRepository.findByTokenAndRevokedFalse("tok-invalid")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getClinicalView("tok-invalid"));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void expiredTokenReturns410Gone() {
        ShareLink expired = doctorLink(OffsetDateTime.now().minusDays(1));
        when(shareLinkRepository.findByTokenAndRevokedFalse("tok-expired")).thenReturn(Optional.of(expired));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getClinicalView("tok-expired"));

        assertEquals(HttpStatus.GONE, ex.getStatusCode());
    }

    @Test
    void nonDoctorModeTokenReturns403() {
        ShareLink miniLink = shareLink(ShareLink.ShareMode.MINI, OffsetDateTime.now().plusDays(7));
        when(shareLinkRepository.findByTokenAndRevokedFalse("tok-mini")).thenReturn(Optional.of(miniLink));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getClinicalView("tok-mini"));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    // ── Datenschutz-Prüfung: Allow-List ──────────────────────────────────

    @Test
    void clinicalSettingsViewExposesOnlyAllowListedFields() {
        // Prüft, dass ClinicalSettingsView kein apiKey, kein uiPref o.Ä. enthält.
        // Strukturprüfung via Record-Komponenten.
        var components = ClinicalViewController.ClinicalSettingsView.class.getRecordComponents();
        var names = java.util.Arrays.stream(components)
                .map(java.lang.reflect.RecordComponent::getName)
                .toList();

        assertEquals(5, names.size(), "ClinicalSettingsView darf exakt 5 Felder haben");
        assertTrue(names.contains("bzMin"));
        assertTrue(names.contains("bzMax"));
        assertTrue(names.contains("targetBz"));
        assertTrue(names.contains("insulinRatio"));
        assertTrue(names.contains("correctionFactor"));

        // Explizit sicherstellen, dass keine sensitiven Felder enthalten sind
        assertFalse(names.contains("apiKey"),    "apiKey darf nicht exponiert werden");
        assertFalse(names.contains("contacts"),  "contacts darf nicht exponiert werden");
        assertFalse(names.contains("pinHash"),   "pinHash darf nicht exponiert werden");
    }

    // ── Hilfsmethoden ─────────────────────────────────────────────────────

    private ShareLink doctorLink(OffsetDateTime expiresAt) {
        return shareLink(ShareLink.ShareMode.DOCTOR, expiresAt);
    }

    private ShareLink shareLink(ShareLink.ShareMode mode, OffsetDateTime expiresAt) {
        Profile owner = new Profile();
        owner.setId("owner-1");
        owner.setName("Dr.-Owner");
        owner.setRole(Profile.Role.ADMIN);

        ShareLink link = new ShareLink();
        link.setToken("tok-" + mode.name().toLowerCase());
        link.setMode(mode);
        link.setOwner(owner);
        link.setExpiresAt(expiresAt);
        link.setRevoked(false);
        return link;
    }

    private Settings settingsWithClinicalFields() {
        Settings s = new Settings();
        s.setBzMin(70);
        s.setBzMax(180);
        s.setTargetBz(110);
        s.setInsulinRatio(10);
        s.setCorrectionFactor(50);
        return s;
    }

    private InsightsDtos.MetricsResponse metrics(double tir, double gmi, double cv) {
        return new InsightsDtos.MetricsResponse(
                14, 0,
                BigDecimal.valueOf(120),
                BigDecimal.valueOf(tir),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.valueOf(gmi),
                BigDecimal.valueOf(cv)
        );
    }

    private Entry entryWithType(Entry.EntryType type, Integer bzValue) {
        Entry e = new Entry();
        e.setType(type);
        e.setTimestamp(System.currentTimeMillis() - 3_600_000L);
        if (type == Entry.EntryType.BZ) {
            e.setBzValue(bzValue);
        } else if (type == Entry.EntryType.INSULIN) {
            e.setInsulinUnits(BigDecimal.valueOf(4));
        }
        return e;
    }
}
