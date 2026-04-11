package de.zuckerheld.domain.service;

import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.ProfileLink;
import de.zuckerheld.domain.model.ProfileLink.LinkRole;
import de.zuckerheld.domain.model.ProfileLink.LinkStatus;
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

    private static final String INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int    INVITE_LEN   = 8;
    private static final int    INVITE_TTL_H = 48;

    private final ProfileLinkRepository linkRepository;
    private final ProfileRepository     profileRepository;

    public ProfileLinkService(ProfileLinkRepository linkRepository,
                               ProfileRepository profileRepository) {
        this.linkRepository  = linkRepository;
        this.profileRepository = profileRepository;
    }

    // ── Wer beobachte ich? ─────────────────────────────────────────────────

    /** Profile die dieser Watcher (watcherId) beobachten darf */
    public List<ProfileLink> getWatching(String watcherId) {
        return linkRepository.findByWatcherIdAndStatus(watcherId, LinkStatus.ACCEPTED);
    }

    /** Watcher die diesen Owner beobachten dürfen */
    public List<ProfileLink> getWatchers(String ownerId) {
        return linkRepository.findByOwnerIdAndStatus(ownerId, LinkStatus.ACCEPTED);
    }

    /** Alle ausstehenden Einladungen die dieser Owner erstellt hat */
    public List<ProfileLink> getPendingInvites(String ownerId) {
        return linkRepository.findByOwnerIdAndStatus(ownerId, LinkStatus.PENDING);
    }

    // ── Einladung erstellen ────────────────────────────────────────────────

    @Transactional
    public ProfileLink createInvite(String ownerId, LinkRole role) {
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
        link.setStatus(LinkStatus.PENDING);
        link.setInviteCode(generateCode());
        link.setExpiresAt(OffsetDateTime.now().plusHours(INVITE_TTL_H));

        return linkRepository.save(link);
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
        if (link.getExpiresAt() != null && link.getExpiresAt().isBefore(OffsetDateTime.now())) {
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

        return linkRepository.save(link);
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
    }

    // ── Zugriffsprüfung (für EntryController Observer-Mode) ───────────────

    /** Prüft ob watcherId ACCEPTED Zugriff auf ownerId-Daten hat */
    public boolean hasAccess(String ownerId, String watcherId) {
        return linkRepository.existsByOwnerIdAndWatcherIdAndStatus(
                ownerId, watcherId, LinkStatus.ACCEPTED);
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
}
