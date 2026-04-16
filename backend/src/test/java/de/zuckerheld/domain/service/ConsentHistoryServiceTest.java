package de.zuckerheld.domain.service;

import de.zuckerheld.domain.model.AuditLog;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.infrastructure.repository.AuditLogRepository;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * T-01: Consent-Journal / Einwilligungshistorie
 * Prüft: korrekte Filterung, leere Liste, korrekte Actions-Liste.
 */
@ExtendWith(MockitoExtension.class)
class ConsentHistoryServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private ProfileRepository profileRepository;

    private AuditLogService service;

    @BeforeEach
    void setUp() {
        service = new AuditLogService(auditLogRepository, profileRepository);
    }

    @Test
    void getConsentHistoryReturnsOnlyConsentActions() {
        AuditLog inviteLog = auditLogWithAction("INVITE_CREATED");
        AuditLog unrelated = auditLogWithAction("PIN_CHANGED");
        PageRequest pageable = PageRequest.of(0, 50);

        // Repo filtert korrekt → gibt nur INVITE_CREATED zurück
        when(auditLogRepository.findByProfileIdAndActionInOrderByCreatedAtDesc(
                eq("profile-1"), eq(AuditLogService.CONSENT_ACTIONS), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(inviteLog)));

        Page<AuditLog> result = service.getConsentHistory("profile-1", pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("INVITE_CREATED", result.getContent().get(0).getAction());

        // Repo sollte nicht mit unfilterter Liste aufgerufen worden sein
        verify(auditLogRepository, times(1))
                .findByProfileIdAndActionInOrderByCreatedAtDesc(any(), any(), any());
        verify(auditLogRepository, never())
                .findByProfileIdOrderByCreatedAtDesc(any(), any());
    }

    @Test
    void getConsentHistoryReturnsEmptyPageWhenNoActions() {
        PageRequest pageable = PageRequest.of(0, 50);
        when(auditLogRepository.findByProfileIdAndActionInOrderByCreatedAtDesc(
                eq("profile-1"), eq(AuditLogService.CONSENT_ACTIONS), eq(pageable)))
                .thenReturn(Page.empty());

        Page<AuditLog> result = service.getConsentHistory("profile-1", pageable);

        assertTrue(result.isEmpty());
    }

    @Test
    void consentActionsListContainsAllExpectedActions() {
        List<String> actions = AuditLogService.CONSENT_ACTIONS;

        assertTrue(actions.contains("INVITE_CREATED"));
        assertTrue(actions.contains("INVITE_ACCEPTED"));
        assertTrue(actions.contains("LINK_REVOKED"));
        assertTrue(actions.contains("PRIVACY_EXPORT"));
        assertTrue(actions.contains("PRIVACY_DELETE_REQUEST"));
        assertTrue(actions.contains("PRIVACY_DELETE_REQUEST_REVOKE"));
    }

    @Test
    void logWritesCorrectFields() {
        Profile profile = profileWithId("p-1");
        Profile actor   = profileWithId("a-1");

        when(profileRepository.findById("p-1")).thenReturn(Optional.of(profile));
        when(profileRepository.findById("a-1")).thenReturn(Optional.of(actor));
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        service.log("p-1", "a-1", "INVITE_CREATED", "FAMILY/LIVE_MEDICAL/Test — Max");

        verify(auditLogRepository, times(1)).save(argThat(log ->
                "INVITE_CREATED".equals(log.getAction())
                && "FAMILY/LIVE_MEDICAL/Test — Max".equals(log.getDetails())
        ));
    }

    // ── Hilfsmethoden ─────────────────────────────────────────────────────

    private AuditLog auditLogWithAction(String action) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setDetails("Testdetails");
        Profile actor = profileWithId("actor-1");
        actor.setName("Admin");
        log.setActor(actor);
        return log;
    }

    private Profile profileWithId(String id) {
        Profile p = new Profile();
        p.setId(id);
        p.setRole(Profile.Role.ADMIN);
        p.setName("Test");
        return p;
    }
}
