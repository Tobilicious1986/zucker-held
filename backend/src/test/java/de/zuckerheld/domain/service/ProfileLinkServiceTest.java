package de.zuckerheld.domain.service;

import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.ProfileLink;
import de.zuckerheld.infrastructure.repository.ProfileLinkRepository;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileLinkServiceTest {

    @Mock
    private ProfileLinkRepository linkRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private AuditLogService auditLogService;

    private ProfileLinkService service;

    @BeforeEach
    void setUp() {
        service = new ProfileLinkService(linkRepository, profileRepository, auditLogService);
    }

    @Test
    void createInviteRejectsLiveMedicalForSchool() {
        Profile owner = adminProfile("owner-1");
        when(profileRepository.findById("owner-1")).thenReturn(Optional.of(owner));

        assertThrows(ResponseStatusException.class, () -> service.createInvite(
                "owner-1",
                ProfileLink.LinkRole.OBSERVER,
                ProfileLink.RelationshipKind.SCHOOL,
                ProfileLink.AccessScope.LIVE_MEDICAL,
                "Schulbegleitung"
        ));
    }

    @Test
    void createInviteAllowsSchoolTrainerAsLearningOnlyObserver() {
        Profile owner = adminProfile("owner-1");
        when(profileRepository.findById("owner-1")).thenReturn(Optional.of(owner));
        when(linkRepository.save(any(ProfileLink.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(auditLogService).log(any(), any(), any(), any());

        ProfileLink created = service.createInvite(
                "owner-1",
                ProfileLink.LinkRole.OBSERVER,
                ProfileLink.RelationshipKind.SCHOOL,
                ProfileLink.AccessScope.LEARNING_ONLY,
                "Sport/Schule: Notfallhilfe und Tagesuebergabe"
        );

        assertEquals(ProfileLink.RelationshipKind.SCHOOL, created.getRelationshipKind());
        assertEquals(ProfileLink.AccessScope.LEARNING_ONLY, created.getAccessScope());
        assertEquals(ProfileLink.LinkRole.OBSERVER, created.getRole());
    }

    @Test
    void createInviteAllowsFamilyLearningOnlyForGrandparentCare() {
        Profile owner = adminProfile("owner-1");
        when(profileRepository.findById("owner-1")).thenReturn(Optional.of(owner));
        when(linkRepository.save(any(ProfileLink.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(auditLogService).log(any(), any(), any(), any());

        ProfileLink created = service.createInvite(
                "owner-1",
                ProfileLink.LinkRole.OBSERVER,
                ProfileLink.RelationshipKind.FAMILY,
                ProfileLink.AccessScope.LEARNING_ONLY,
                "Grosseltern/Betreuung: Notfallhilfe im Alltag"
        );

        assertEquals(ProfileLink.RelationshipKind.FAMILY, created.getRelationshipKind());
        assertEquals(ProfileLink.AccessScope.LEARNING_ONLY, created.getAccessScope());
        assertEquals(ProfileLink.LinkRole.OBSERVER, created.getRole());
    }

    @Test
    void createInviteAllowsFamilySummaryOnlyForPartnerSibling() {
        Profile owner = adminProfile("owner-1");
        when(profileRepository.findById("owner-1")).thenReturn(Optional.of(owner));
        when(linkRepository.save(any(ProfileLink.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(auditLogService).log(any(), any(), any(), any());

        ProfileLink created = service.createInvite(
                "owner-1",
                ProfileLink.LinkRole.OBSERVER,
                ProfileLink.RelationshipKind.FAMILY,
                ProfileLink.AccessScope.SUMMARY_ONLY,
                "Partner/Geschwister: Wochenueberblick und Alltagshilfe"
        );

        assertEquals(ProfileLink.RelationshipKind.FAMILY, created.getRelationshipKind());
        assertEquals(ProfileLink.AccessScope.SUMMARY_ONLY, created.getAccessScope());
        assertEquals(ProfileLink.LinkRole.OBSERVER, created.getRole());
    }

    @Test
    void createInviteRejectsAdminForProfessional() {
        Profile owner = adminProfile("owner-1");
        when(profileRepository.findById("owner-1")).thenReturn(Optional.of(owner));

        assertThrows(ResponseStatusException.class, () -> service.createInvite(
                "owner-1",
                ProfileLink.LinkRole.ADMIN,
                ProfileLink.RelationshipKind.PROFESSIONAL,
                ProfileLink.AccessScope.LIVE_MEDICAL,
                "Diabetologie",
                ProfileLink.ProfessionalRole.DOCTOR,
                72
        ));
    }

    @Test
    void getWatchingReturnsOnlyLiveMedicalLinks() {
        ProfileLink live = new ProfileLink();
        live.setStatus(ProfileLink.LinkStatus.ACCEPTED);
        live.setAccessScope(ProfileLink.AccessScope.LIVE_MEDICAL);

        ProfileLink learning = new ProfileLink();
        learning.setStatus(ProfileLink.LinkStatus.ACCEPTED);
        learning.setAccessScope(ProfileLink.AccessScope.LEARNING_ONLY);

        when(linkRepository.findByWatcherIdAndStatus("watcher-1", ProfileLink.LinkStatus.ACCEPTED))
                .thenReturn(List.of(live, learning));

        List<ProfileLink> watching = service.getWatching("watcher-1");

        assertEquals(1, watching.size());
        assertSame(live, watching.get(0));
    }

    @Test
    void hasAccessOnlyReturnsTrueForLiveMedicalAcceptedLink() {
        ProfileLink link = new ProfileLink();
        link.setStatus(ProfileLink.LinkStatus.ACCEPTED);
        link.setAccessScope(ProfileLink.AccessScope.SUMMARY_ONLY);

        when(linkRepository.findByOwnerIdAndWatcherId("owner-1", "watcher-1"))
                .thenReturn(Optional.of(link));

        assertFalse(service.hasAccess("owner-1", "watcher-1"));

        link.setAccessScope(ProfileLink.AccessScope.LIVE_MEDICAL);

        assertTrue(service.hasAccess("owner-1", "watcher-1"));
    }

    @Test
    void createInvitePersistsNormalizedConsentData() {
        Profile owner = adminProfile("owner-1");
        when(profileRepository.findById("owner-1")).thenReturn(Optional.of(owner));
        when(linkRepository.save(any(ProfileLink.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(auditLogService).log(any(), any(), any(), any());

        ProfileLink created = service.createInvite(
                "owner-1",
                ProfileLink.LinkRole.OBSERVER,
                ProfileLink.RelationshipKind.PROFESSIONAL,
                ProfileLink.AccessScope.LIVE_MEDICAL,
                "  Arztgespraech   Diabetologie  ",
                ProfileLink.ProfessionalRole.DOCTOR,
                72
        );

        assertEquals(ProfileLink.RelationshipKind.PROFESSIONAL, created.getRelationshipKind());
        assertEquals(ProfileLink.AccessScope.LIVE_MEDICAL, created.getAccessScope());
        assertEquals(ProfileLink.ProfessionalRole.DOCTOR, created.getProfessionalRole());
        assertEquals(72, created.getAccessDurationHours());
        assertEquals("Arztgespraech Diabetologie", created.getPurpose());
        assertEquals(ProfileLink.LinkStatus.PENDING, created.getStatus());
        assertNotNull(created.getInviteCode());
        assertNotNull(created.getInviteExpiresAt());
        assertNull(created.getExpiresAt());
    }

    @Test
    void createInviteRejectsProfessionalWithoutTimeLimit() {
        Profile owner = adminProfile("owner-1");
        when(profileRepository.findById("owner-1")).thenReturn(Optional.of(owner));

        assertThrows(ResponseStatusException.class, () -> service.createInvite(
                "owner-1",
                ProfileLink.LinkRole.OBSERVER,
                ProfileLink.RelationshipKind.PROFESSIONAL,
                ProfileLink.AccessScope.LIVE_MEDICAL,
                "Diabetologie",
                ProfileLink.ProfessionalRole.DOCTOR,
                null
        ));
    }

    @Test
    void getAllWatchingFiltersExpiredAcceptedLinks() {
        ProfileLink active = acceptedLiveLink();
        active.setExpiresAt(OffsetDateTime.now().plusHours(2));
        ProfileLink expired = acceptedLiveLink();
        expired.setExpiresAt(OffsetDateTime.now().minusHours(1));

        when(linkRepository.findByWatcherIdAndStatus("watcher-1", ProfileLink.LinkStatus.ACCEPTED))
                .thenReturn(List.of(active, expired));

        List<ProfileLink> links = service.getAllWatching("watcher-1");

        assertEquals(1, links.size());
        assertSame(active, links.get(0));
    }

    @Test
    void getPendingInvitesFiltersExpiredCodes() {
        ProfileLink active = new ProfileLink();
        active.setStatus(ProfileLink.LinkStatus.PENDING);
        active.setInviteExpiresAt(OffsetDateTime.now().plusHours(2));
        ProfileLink expired = new ProfileLink();
        expired.setStatus(ProfileLink.LinkStatus.PENDING);
        expired.setInviteExpiresAt(OffsetDateTime.now().minusHours(1));

        when(linkRepository.findByOwnerIdAndStatus("owner-1", ProfileLink.LinkStatus.PENDING))
                .thenReturn(List.of(active, expired));

        List<ProfileLink> links = service.getPendingInvites("owner-1");

        assertEquals(1, links.size());
        assertSame(active, links.get(0));
    }

    @Test
    void acceptInviteSetsAccessExpirationFromDuration() {
        Profile owner   = adminProfile("owner-1");
        Profile watcher = watcherProfile("watcher-1");

        ProfileLink link = pendingLinkWithOwner(owner);
        link.setAccessDurationHours(24);
        when(linkRepository.findByInviteCode("CODE1234")).thenReturn(Optional.of(link));
        when(profileRepository.findById("watcher-1")).thenReturn(Optional.of(watcher));
        when(linkRepository.findByOwnerIdAndWatcherId("owner-1", "watcher-1")).thenReturn(Optional.empty());
        when(linkRepository.save(any(ProfileLink.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(auditLogService).log(any(), any(), any(), any());

        ProfileLink accepted = service.acceptInvite("CODE1234", "watcher-1");

        assertEquals(ProfileLink.LinkStatus.ACCEPTED, accepted.getStatus());
        assertNull(accepted.getInviteCode());
        assertNotNull(accepted.getExpiresAt());
        assertTrue(accepted.getExpiresAt().isAfter(OffsetDateTime.now().plusHours(23)));
    }

    // ── T-04: Consent-Journal Audit-Events ────────────────────────────────

    @Test
    void createInviteLogsInviteCreatedEvent() {
        Profile owner = adminProfile("owner-1");
        when(profileRepository.findById("owner-1")).thenReturn(Optional.of(owner));
        when(linkRepository.save(any(ProfileLink.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(auditLogService).log(any(), any(), any(), any());

        service.createInvite(
                "owner-1",
                ProfileLink.LinkRole.OBSERVER,
                ProfileLink.RelationshipKind.FAMILY,
                ProfileLink.AccessScope.LIVE_MEDICAL,
                "Familienzugang"
        );

        verify(auditLogService, times(1))
                .log(eq("owner-1"), eq("owner-1"),
                     eq(ProfileLinkService.ACTION_INVITE_CREATED), any());
    }

    @Test
    void acceptInviteLogsInviteAcceptedEvent() {
        Profile owner   = adminProfile("owner-1");
        Profile watcher = watcherProfile("watcher-1");

        ProfileLink link = pendingLinkWithOwner(owner);
        when(linkRepository.findByInviteCode("CODE1234")).thenReturn(Optional.of(link));
        when(profileRepository.findById("watcher-1")).thenReturn(Optional.of(watcher));
        when(linkRepository.findByOwnerIdAndWatcherId("owner-1", "watcher-1")).thenReturn(Optional.empty());
        when(linkRepository.save(any(ProfileLink.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(auditLogService).log(any(), any(), any(), any());

        service.acceptInvite("CODE1234", "watcher-1");

        verify(auditLogService, times(1))
                .log(eq("owner-1"), eq("watcher-1"),
                     eq(ProfileLinkService.ACTION_INVITE_ACCEPTED), any());
    }

    @Test
    void revokeLinkLogsLinkRevokedEvent() {
        Profile owner   = adminProfile("owner-1");
        Profile watcher = watcherProfile("watcher-1");

        UUID linkId = UUID.randomUUID();
        ProfileLink link = acceptedLink(linkId, owner, watcher);

        when(linkRepository.findById(linkId)).thenReturn(Optional.of(link));
        when(linkRepository.save(any(ProfileLink.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(auditLogService).log(any(), any(), any(), any());

        service.revokeLink(linkId, "owner-1");

        verify(auditLogService, times(1))
                .log(eq("owner-1"), eq("owner-1"),
                     eq(ProfileLinkService.ACTION_LINK_REVOKED), any());
    }

    // ── T-02: Scope-Zugriffsprüfung ───────────────────────────────────────

    @Test
    void grantsSummaryAccessReturnsTrueOnlyForSummaryOnlyLinks() {
        ProfileLink link = new ProfileLink();
        link.setStatus(ProfileLink.LinkStatus.ACCEPTED);
        link.setAccessScope(ProfileLink.AccessScope.SUMMARY_ONLY);

        when(linkRepository.findByOwnerIdAndWatcherId("owner-1", "watcher-1"))
                .thenReturn(Optional.of(link));

        assertTrue(service.grantsSummaryAccess("owner-1", "watcher-1"));
    }

    @Test
    void grantsSummaryAccessReturnsFalseForLiveMedical() {
        ProfileLink link = new ProfileLink();
        link.setStatus(ProfileLink.LinkStatus.ACCEPTED);
        link.setAccessScope(ProfileLink.AccessScope.LIVE_MEDICAL);

        when(linkRepository.findByOwnerIdAndWatcherId("owner-1", "watcher-1"))
                .thenReturn(Optional.of(link));

        assertFalse(service.grantsSummaryAccess("owner-1", "watcher-1"));
    }

    @Test
    void grantsLearningAccessReturnsTrueOnlyForLearningOnlyLinks() {
        ProfileLink link = new ProfileLink();
        link.setStatus(ProfileLink.LinkStatus.ACCEPTED);
        link.setAccessScope(ProfileLink.AccessScope.LEARNING_ONLY);

        when(linkRepository.findByOwnerIdAndWatcherId("owner-1", "watcher-1"))
                .thenReturn(Optional.of(link));

        assertTrue(service.grantsLearningAccess("owner-1", "watcher-1"));
    }

    // ── Hilfsmethoden ─────────────────────────────────────────────────────

    private Profile adminProfile(String id) {
        Profile profile = new Profile();
        profile.setId(id);
        profile.setRole(Profile.Role.ADMIN);
        profile.setName("Admin");
        return profile;
    }

    private Profile watcherProfile(String id) {
        Profile profile = new Profile();
        profile.setId(id);
        profile.setRole(Profile.Role.PATIENT);
        profile.setName("Watcher");
        return profile;
    }

    private ProfileLink pendingLinkWithOwner(Profile owner) {
        ProfileLink link = new ProfileLink();
        link.setOwner(owner);
        link.setStatus(ProfileLink.LinkStatus.PENDING);
        link.setAccessScope(ProfileLink.AccessScope.LIVE_MEDICAL);
        link.setRelationshipKind(ProfileLink.RelationshipKind.FAMILY);
        link.setPurpose("Test");
        link.setInviteCode("CODE1234");
        link.setInviteExpiresAt(OffsetDateTime.now().plusHours(2));
        return link;
    }

    private ProfileLink acceptedLink(UUID id, Profile owner, Profile watcher) {
        ProfileLink link = new ProfileLink();
        link.setId(id);
        link.setOwner(owner);
        link.setWatcher(watcher);
        link.setStatus(ProfileLink.LinkStatus.ACCEPTED);
        link.setAccessScope(ProfileLink.AccessScope.LIVE_MEDICAL);
        link.setRelationshipKind(ProfileLink.RelationshipKind.FAMILY);
        link.setPurpose("Test");
        return link;
    }

    private ProfileLink acceptedLiveLink() {
        ProfileLink link = new ProfileLink();
        link.setStatus(ProfileLink.LinkStatus.ACCEPTED);
        link.setAccessScope(ProfileLink.AccessScope.LIVE_MEDICAL);
        return link;
    }
}
