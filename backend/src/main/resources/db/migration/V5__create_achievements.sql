-- ═══════════════════════════════════════════════════════════
-- V5: Errungenschaften (Achievements/Badges)
-- Entspricht: state.unlockedAchievements[] Array
-- ═══════════════════════════════════════════════════════════

CREATE TABLE achievements (
    id              BIGSERIAL     PRIMARY KEY,
    profile_id      VARCHAR(50)   NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id  VARCHAR(100)  NOT NULL,   -- z.B. 'first_bz', 'streak_7', 'bz_100'
    unlocked_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (profile_id, achievement_id)       -- kein doppeltes Freischalten
);

CREATE INDEX idx_achievements_profile ON achievements (profile_id);

COMMENT ON TABLE achievements IS 'Freigeschaltete Badges pro Profil';
COMMENT ON COLUMN achievements.achievement_id IS 'ID aus ACHIEVEMENTS-Config (src/config.js)';
