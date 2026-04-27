package de.zuckerheld.domain.service;

import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.ProfileLink;
import de.zuckerheld.domain.model.ProfileLink.AccessScope;
import de.zuckerheld.domain.model.ProfileLink.LinkRole;
import de.zuckerheld.domain.model.ProfileLink.LinkStatus;
import de.zuckerheld.domain.model.ProfileLink.ProfessionalRole;
import de.zuckerheld.domain.model.ProfileLink.RelationshipKind;
import de.zuckerheld.infrastructure.repository.ProfileLinkRepository;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Verwaltet Familien-Links: Einladungen erstellen, annehmen, widerrufen.
 * Ermöglicht Eltern, Ärzten und Betreuern den Zugang zu Patientendaten.
 */
@Service
public class ProfileLinkService {

    // ── Consent-Journal Actions ────────────────────────────────────────────
    public static final String ACTION_INVITE_CREATED  = "INVITE_CREATED";
    public static final String ACTION_INVITE_ACCEPTED = "INVITE_ACCEPTED";
    public static final String ACTION_LINK_REVOKED    = "LINK_REVOKED";

    private static final String INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int    INVITE_LEN   = 8;
    private static final int    INVITE_TTL_H = 48;
    private static final int    ACCESS_MIN_H = 1;
    private static final int    ACCESS_MAX_H = 168;

    private final ProfileLinkRepository linkRepository;
    private final ProfileRepository     profileRepository;
    private final AuditLogService       auditLogService;

    public ProfileLinkService(ProfileLinkRepository linkRepository,
                               ProfileRepository profileRepository,
                               AuditLogService auditLogService) {
        this.linkRepository   = linkRepository;
        this.profileRepository = profileRepository;
        this.auditLogService  = auditLogService;
    }

    // ── Wer beobachte ich? ─────────────────────────────────────────────────

    /** Profile die dieser Watcher (watcherId) per LIVE_MEDICAL-Scope beobachten darf */
    public List<ProfileLink> getWatching(String watcherId) {
        return linkRepository.findByWatcherIdAndStatus(watcherId, LinkStatus.ACCEPTED)
                .stream()
                .filter(ProfileLink::grantsLiveMedicalAccess)
                .toList();
    }

    /** Alle Profile die dieser Watcher beobachtet — alle AccessScopes */
    public List<ProfileLink> getAllWatching(String watcherId) {
        return linkRepository.findByWatcherIdAndStatus(watcherId, LinkStatus.ACCEPTED)
                .stream()
                .filter(link -> !link.isExpired())
                .toList();
    }

    /** Watcher die diesen Owner beobachten dürfen */
    public List<ProfileLink> getWatchers(String ownerId) {
        return linkRepository.findByOwnerIdAndStatus(ownerId, LinkStatus.ACCEPTED)
                .stream()
                .filter(link -> !link.isExpired())
                .toList();
    }

    /** Alle ausstehenden Einladungen die dieser Owner erstellt hat */
    public List<ProfileLink> getPendingInvites(String ownerId) {
        return linkRepository.findByOwnerIdAndStatus(ownerId, LinkStatus.PENDING)
                .stream()
                .filter(link -> !link.isInviteExpired())
                .toList();
    }

    // ── Einladung erstellen ────────────────────────────────────────────────

    @Transactional
    public ProfileLink createInvite(String ownerId,
                                    LinkRole role,
                                    RelationshipKind relationshipKind,
                                    AccessScope accessScope,
                                    String purpose) {
        return createInvite(ownerId, role, relationshipKind, accessScope, purpose, null, null);
    }

    @Transactional
    public ProfileLink createInvite(String ownerId,
                                    LinkRole role,
                                    RelationshipKind relationshipKind,
                                    AccessScope accessScope,
                                    String purpose,
                                    ProfessionalRole professionalRole,
                                    Integer accessDurationHours) {
        Profile owner = profileRepository.findById(ownerId)
                .orElseThrow(() -> new EntityNotFoundException("Profil nicht gefunden: " + ownerId));

        // Nur ADMIN darf Einladungen erstellen
        if (!owner.getRole().hasMinRole(Profile.Role.ADMIN)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Nur Admins können Einladungen erstellen.");
        }

        ProfileLink link = new ProfileLink();
        link.setOwner(owner);
        link.setWatcher(null);   // Watcher wird beim Accept gesetzt
        link.setRole(role);
        link.setRelationshipKind(relationshipKind);
        link.setAccessScope(accessScope);
        link.setProfessionalRole(professionalRole);
        link.setPurpose(normalizePurpose(purpose));
        link.setStatus(LinkStatus.PENDING);
        link.setInviteCode(generateCode());
        link.setInviteExpiresAt(OffsetDateTime.now().plusHours(INVITE_TTL_H));
        link.setAccessDurationHours(normalizeAccessDuration(accessDurationHours));

        validateInvite(link);

        ProfileLink saved = linkRepository.save(link);

        // Consent-Journal: Einladung erstellt
        String details = buildLinkDetails(link, null);
        auditLogService.log(ownerId, ownerId, ACTION_INVITE_CREATED, details);

        return saved;
    }

    // ── Einladung annehmen ─────────────────────────────────────────────────

    @Transactional
    public ProfileLink acceptInvite(String inviteCode, String watcherId) {
        ProfileLink link = linkRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Einladungscode ungültig oder abgelaufen."));

        if (link.getStatus() != LinkStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Einladung bereits verwendet oder widerrufen.");
        }
        if (link.isInviteExpired()) {
            throw new ResponseStatusException(HttpStatus.GONE,
                    "Einladungscode abgelaufen.");
        }
        if (link.getOwner().getId().equals(watcherId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Du kannst nicht dein eigenes Profil beobachten.");
        }

        Profile watcher = profileRepository.findById(watcherId)
                .orElseThrow(() -> new EntityNotFoundException("Profil nicht gefunden: " + watcherId));

        // Prüfen ob schon ein Link existiert
        linkRepository.findByOwnerIdAndWatcherId(link.getOwner().getId(), watcherId)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Du beobachtest dieses Profil bereits.");
                });

        link.setWatcher(watcher);
        link.setStatus(LinkStatus.ACCEPTED);
        link.setInviteCode(null);  // Code nach Einlösung löschen
        if (link.getAccessDurationHours() != null) {
            link.setExpiresAt(OffsetDateTime.now().plusHours(link.getAccessDurationHours()));
        }

        ProfileLink saved = linkRepository.save(link);

        // Consent-Journal: Einladung angenommen (aus Sicht des Owners protokolliert)
        String details = buildLinkDetails(link, watcher.getName());
        auditLogService.log(link.getOwner().getId(), watcherId, ACTION_INVITE_ACCEPTED, details);

        return saved;
    }

    // ── Link widerrufen ────────────────────────────────────────────────────

    @Transactional
    public void revokeLink(UUID linkId, String requesterId) {
        ProfileLink link = linkRepository.findById(linkId)
                .orElseThrow(() -> new EntityNotFoundException("Link nicht gefunden."));

        // Owner oder Watcher darf widerrufen
        boolean isOwner   = link.getOwner().getId().equals(requesterId);
        boolean isWatcher = link.getWatcher() != null && link.getWatcher().getId().equals(requesterId);

        if (!isOwner && !isWatcher) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Kein Zugriff auf diesen Link.");
        }

        link.setStatus(LinkStatus.REVOKED);
        linkRepository.save(link);

        // Consent-Journal: Link widerrufen (aus Sicht des Owners protokolliert)
        String watcherName = link.getWatcher() != null ? link.getWatcher().getName() : "—";
        String details = buildLinkDetails(link, watcherName) + " | widerrufen von: " + requesterId;
        auditLogService.log(link.getOwner().getId(), requesterId, ACTION_LINK_REVOKED, details);
    }

    // ── Zugriffsprüfung (für EntryController Observer-Mode) ───────────────

    /** Prüft ob watcherId LIVE_MEDICAL-Zugriff auf ownerId-Daten hat */
    public boolean hasAccess(String ownerId, String watcherId) {
        return linkRepository.findByOwnerIdAndWatcherId(ownerId, watcherId)
                .map(ProfileLink::grantsLiveMedicalAccess)
                .orElse(false);
    }

    /** Prüft ob watcherId SUMMARY_ONLY-Zugriff auf ownerId-Daten hat */
    public boolean grantsSummaryAccess(String ownerId, String watcherId) {
        return linkRepository.findByOwnerIdAndWatcherId(ownerId, watcherId)
                .map(l -> l.getStatus() == LinkStatus.ACCEPTED
                        && l.getAccessScope() == AccessScope.SUMMARY_ONLY
                        && !l.isExpired())
                .orElse(false);
    }

    /** Prüft ob watcherId LEARNING_ONLY-Zugriff auf ownerId hat */
    public boolean grantsLearningAccess(String ownerId, String watcherId) {
        return linkRepository.findByOwnerIdAndWatcherId(ownerId, watcherId)
                .map(l -> l.getStatus() == LinkStatus.ACCEPTED
                        && l.getAccessScope() == AccessScope.LEARNING_ONLY
                        && !l.isExpired())
                .orElse(false);
    }

    /** Alle aktiven Links eines Owners (alle Scopes) */
    public List<ProfileLink> getAllActiveLinks(String ownerId) {
        return linkRepository.findByOwnerIdAndStatus(ownerId, LinkStatus.ACCEPTED)
                .stream()
                .filter(link -> !link.isExpired())
                .toList();
    }

    // ── Hilfsmethoden ──────────────────────────────────────────────────────

    private String generateCode() {
        SecureRandom rng = new SecureRandom();
        StringBuilder sb = new StringBuilder(INVITE_LEN);
        for (int i = 0; i < INVITE_LEN; i++) {
            sb.append(INVITE_CHARS.charAt(rng.nextInt(INVITE_CHARS.length())));
        }
        return sb.toString();
    }

    private void validateInvite(ProfileLink link) {
        if (link.getRelationshipKind() == RelationshipKind.SCHOOL
                && link.getAccessScope() == AccessScope.LIVE_MEDICAL) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Schule und Alltag dürfen keinen Live-Medizinzugriff erhalten.");
        }
        if (link.getRelationshipKind() == RelationshipKind.LEARNING_GUEST
                && link.getAccessScope() != AccessScope.LEARNING_ONLY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Gast-Lernen darf nur einen Lernzugang erhalten.");
        }
        if (link.getAccessScope() != AccessScope.LIVE_MEDICAL && link.getRole() != LinkRole.OBSERVER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Eingeschränkte Freigaben dürfen nur lesend angelegt werden.");
        }
        if (link.getRelationshipKind() == RelationshipKind.PROFESSIONAL) {
            if (link.getRole() != LinkRole.OBSERVER) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Fachpersonen erhalten nur lesenden Zugriff.");
            }
            if (link.getProfessionalRole() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Fachpersonen brauchen eine konkrete Fachrolle.");
            }
            if (link.getAccessDurationHours() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Fachpersonen-Zugriff muss zeitlich begrenzt sein.");
            }
        } else if (link.getProfessionalRole() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Fachrollen sind nur für Fachpersonen-Freigaben erlaubt.");
        }
        if (link.getPurpose() == null || link.getPurpose().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Eine Freigabe braucht einen klaren Zweck.");
        }
    }

    private Integer normalizeAccessDuration(Integer accessDurationHours) {
        if (accessDurationHours == null) return null;
        return Math.max(ACCESS_MIN_H, Math.min(accessDurationHours, ACCESS_MAX_H));
    }

    private String normalizePurpose(String purpose) {
        return purpose == null ? "" : purpose.trim().replaceAll("\\s+", " ");
    }

    private String buildLinkDetails(ProfileLink link, String watcherName) {
        String scope    = link.getAccessScope()      != null ? link.getAccessScope().name()      : "—";
        String rel      = link.getRelationshipKind() != null ? link.getRelationshipKind().name() : "—";
        String pro      = link.getProfessionalRole() != null ? " / " + link.getProfessionalRole().name() : "";
        String purpose  = link.getPurpose()          != null ? link.getPurpose()                 : "—";
        String watcher  = watcherName                != null ? watcherName                        : "—";
        String duration = link.getAccessDurationHours() != null ? " / " + link.getAccessDurationHours() + "h" : "";
        return String.format("%s / %s%s / %s%s — %s", rel, scope, pro, purpose, duration, watcher);
    }
}
