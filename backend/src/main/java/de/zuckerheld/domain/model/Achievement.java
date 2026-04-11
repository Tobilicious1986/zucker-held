package de.zuckerheld.domain.model;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "achievements",
    uniqueConstraints = @UniqueConstraint(columnNames = {"profile_id", "achievement_id"}))
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;

    @Column(name = "achievement_id", nullable = false, length = 100)
    private String achievementId;

    @Column(name = "unlocked_at", nullable = false)
    private OffsetDateTime unlockedAt = OffsetDateTime.now();

    // ── Getter/Setter ──────────────────────────────────────────────────────

    public Long getId() { return id; }

    public Profile getProfile() { return profile; }
    public void setProfile(Profile profile) { this.profile = profile; }

    public String getAchievementId() { return achievementId; }
    public void setAchievementId(String achievementId) { this.achievementId = achievementId; }

    public OffsetDateTime getUnlockedAt() { return unlockedAt; }
    public void setUnlockedAt(OffsetDateTime unlockedAt) { this.unlockedAt = unlockedAt; }
}
