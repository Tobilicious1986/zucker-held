package de.zuckerheld.infrastructure.repository;

import de.zuckerheld.domain.model.Settings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SettingsRepository extends JpaRepository<Settings, String> {
    List<Settings> findAllByNotificationsEnabledTrueAndDailySummaryEnabledTrue();
    List<Settings> findAllByNotificationsEnabledTrue();
}
