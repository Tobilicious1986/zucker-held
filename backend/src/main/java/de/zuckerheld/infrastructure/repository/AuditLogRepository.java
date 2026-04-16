package de.zuckerheld.infrastructure.repository;

import de.zuckerheld.domain.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByProfileIdOrderByCreatedAtDesc(String profileId, Pageable pageable);
    Page<AuditLog> findByProfileIdAndActionInOrderByCreatedAtDesc(String profileId, List<String> actions, Pageable pageable);
}
