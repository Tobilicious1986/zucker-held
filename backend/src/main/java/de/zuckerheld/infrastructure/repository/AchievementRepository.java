package de.zuckerheld.infrastructure.repository;

import de.zuckerheld.domain.model.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {

    List<Achievement> findByProfileIdOrderByUnlockedAtDesc(String profileId);

    boolean existsByProfileIdAndAchievementId(String profileId, String achievementId);

    default Set<String> findUnlockedIds(String profileId) {
        return findByProfileIdOrderByUnlockedAtDesc(profileId)
                .stream()
                .map(Achievement::getAchievementId)
                .collect(Collectors.toSet());
    }
}
