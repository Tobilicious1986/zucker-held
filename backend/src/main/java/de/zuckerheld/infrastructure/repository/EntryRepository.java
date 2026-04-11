package de.zuckerheld.infrastructure.repository;

import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.domain.model.Entry.EntryType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EntryRepository extends JpaRepository<Entry, String> {

    Page<Entry> findByProfileIdOrderByTimestampDesc(String profileId, Pageable pageable);

    Page<Entry> findByProfileIdAndTypeOrderByTimestampDesc(String profileId, EntryType type, Pageable pageable);

    @Query("SELECT e FROM Entry e WHERE e.profile.id = :profileId " +
           "AND e.timestamp BETWEEN :from AND :to ORDER BY e.timestamp DESC")
    List<Entry> findByProfileAndTimeRange(@Param("profileId") String profileId,
                                           @Param("from") long from,
                                           @Param("to") long to);

    @Query("SELECT e FROM Entry e WHERE e.profile.id = :profileId " +
           "AND e.type = :type ORDER BY e.timestamp DESC LIMIT 1")
    Optional<Entry> findLatestByProfileAndType(@Param("profileId") String profileId,
                                               @Param("type") EntryType type);

    boolean existsByIdAndProfileId(String id, String profileId);

    /** Batch-Sync: prüfe welche IDs bereits vorhanden sind */
    @Query("SELECT e.id FROM Entry e WHERE e.id IN :ids AND e.profile.id = :profileId")
    List<String> findExistingIds(@Param("ids") List<String> ids,
                                  @Param("profileId") String profileId);

    /** Alle BZ-Einträge der letzten N Tage (für Statistik und Alerts) */
    @Query("SELECT e FROM Entry e WHERE e.profile.id = :profileId " +
           "AND e.type = 'BZ' AND e.timestamp >= :since ORDER BY e.timestamp DESC")
    List<Entry> findBzEntriesSince(@Param("profileId") String profileId,
                                    @Param("since") long since);
}
