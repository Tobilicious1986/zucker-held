package de.zuckerheld.infrastructure.repository;

import de.zuckerheld.domain.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, String> {
    List<Profile> findAllByOrderByCreatedAtAsc();
    Optional<Profile> findByName(String name);
}
