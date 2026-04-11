package de.zuckerheld.infrastructure.repository;

import de.zuckerheld.domain.model.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FoodItemRepository extends JpaRepository<FoodItem, String> {

    /** Builtin-Foods (profile_id IS NULL) + Custom-Foods des Profils */
    @Query("SELECT f FROM FoodItem f WHERE f.profile IS NULL OR f.profile.id = :profileId ORDER BY f.source, f.name")
    List<FoodItem> findAvailableForProfile(@Param("profileId") String profileId);

    /** Volltextsuche (enthält-Suche, case-insensitiv) */
    @Query("SELECT f FROM FoodItem f WHERE (f.profile IS NULL OR f.profile.id = :profileId) " +
           "AND LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY f.source, f.name")
    List<FoodItem> searchByName(@Param("profileId") String profileId, @Param("query") String query);

    Optional<FoodItem> findByBarcode(String barcode);

    List<FoodItem> findByProfileIdOrderByCreatedAtDesc(String profileId);
}
