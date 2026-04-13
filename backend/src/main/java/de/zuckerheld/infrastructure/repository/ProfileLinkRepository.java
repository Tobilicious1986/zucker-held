package de.zuckerheld.infrastructure.repository;

import de.zuckerheld.domain.model.ProfileLink;
import de.zuckerheld.domain.model.ProfileLink.LinkRole;
import de.zuckerheld.domain.model.ProfileLink.LinkStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileLinkRepository extends JpaRepository<ProfileLink, UUID> {

    /** Alle Profile die dieser Watcher beobachtet (z.B. Oma → Maltes Profil) */
    List<ProfileLink> findByWatcherIdAndStatus(String watcherId, LinkStatus status);

    /** Alle Watcher die diesen Owner beobachten (z.B. Maltes Profil → Papa, Oma, Arzt) */
    List<ProfileLink> findByOwnerIdAndStatus(String ownerId, LinkStatus status);
    List<ProfileLink> findByOwnerIdAndStatusAndRoleIn(String ownerId, LinkStatus status, List<LinkRole> roles);

    /** Einladungscode einlösen */
    Optional<ProfileLink> findByInviteCode(String inviteCode);

    /** Prüfen ob ein spezifischer Watcher bereits einen Link zum Owner hat */
    Optional<ProfileLink> findByOwnerIdAndWatcherId(String ownerId, String watcherId);

    /** Prüfen ob Watcher ACCEPTED Zugriff auf Owner-Daten hat */
    boolean existsByOwnerIdAndWatcherIdAndStatus(String ownerId, String watcherId, LinkStatus status);
}
