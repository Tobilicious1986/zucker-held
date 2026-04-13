package de.zuckerheld.infrastructure.repository;

import de.zuckerheld.domain.model.ShareLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShareLinkRepository extends JpaRepository<ShareLink, UUID> {
    List<ShareLink> findByOwnerIdOrderByCreatedAtDesc(String ownerId);
    Optional<ShareLink> findByTokenAndRevokedFalse(String token);
    Optional<ShareLink> findByIdAndOwnerId(UUID id, String ownerId);
    boolean existsByToken(String token);
}
