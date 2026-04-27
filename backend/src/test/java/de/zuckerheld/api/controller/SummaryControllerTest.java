package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.InsightsDtos;
import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.InsightsService;
import de.zuckerheld.domain.service.ProfileLinkService;
import de.zuckerheld.infrastructure.repository.EntryRepository;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SummaryControllerTest {

    @Mock private ProfileLinkService linkService;
    @Mock private InsightsService insightsService;
    @Mock private ProfileRepository profileRepository;
    @Mock private EntryRepository entryRepository;
    @Mock private Authentication authentication;

    private SummaryController controller;

    @BeforeEach
    void setUp() {
        controller = new SummaryController(linkService, insightsService, profileRepository, entryRepository);
    }

    @Test
    void summaryOnlyWatcherGetsRealOwnerNameAndExactGlucoseCounts() {
        Profile watcher = profile("watcher-1", "Oma");
        Profile owner = profile("owner-1", "Malte");

        when(authentication.getPrincipal()).thenReturn(watcher);
        when(linkService.grantsSummaryAccess("owner-1", "watcher-1")).thenReturn(true);
        when(profileRepository.findById("owner-1")).thenReturn(Optional.of(owner));
        when(insightsService.computeMetrics("owner-1", 7)).thenReturn(metrics());
        when(entryRepository.findByProfileAndTimeRange(eq("owner-1"), anyLong(), anyLong()))
                .thenReturn(List.of(bz(65), bz(62), bz(181), bz(220), bz(120), meal()));

        ResponseEntity<SummaryController.SummaryResponse> response =
                controller.getSummary("owner-1", authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Malte", response.getBody().ownerName());
        assertEquals(2, response.getBody().hypoCount());
        assertEquals(2, response.getBody().hyperCount());
        assertEquals(5, response.getBody().entryCount());
    }

    @Test
    void summaryOnlyWatcherWithoutAccessGetsForbidden() {
        Profile watcher = profile("watcher-1", "Oma");
        when(authentication.getPrincipal()).thenReturn(watcher);
        when(linkService.grantsSummaryAccess("owner-1", "watcher-1")).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getSummary("owner-1", authentication));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    private Profile profile(String id, String name) {
        Profile profile = new Profile();
        profile.setId(id);
        profile.setName(name);
        profile.setRole(Profile.Role.PATIENT);
        return profile;
    }

    private InsightsDtos.MetricsResponse metrics() {
        return new InsightsDtos.MetricsResponse(
                7,
                5,
                BigDecimal.valueOf(129.6),
                BigDecimal.valueOf(20.0),
                BigDecimal.valueOf(40.0),
                BigDecimal.valueOf(40.0),
                BigDecimal.valueOf(6.4),
                BigDecimal.valueOf(34.0)
        );
    }

    private Entry bz(int value) {
        Entry entry = new Entry();
        entry.setType(Entry.EntryType.BZ);
        entry.setTimestamp(System.currentTimeMillis());
        entry.setBzValue(value);
        return entry;
    }

    private Entry meal() {
        Entry entry = new Entry();
        entry.setType(Entry.EntryType.MEAL);
        entry.setTimestamp(System.currentTimeMillis());
        return entry;
    }
}
