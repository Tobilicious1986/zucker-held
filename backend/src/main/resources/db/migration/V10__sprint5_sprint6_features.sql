-- V10: Sprint 5 + 6 Fundament (Share-Links, Audit-Log, Theme/Reminder/Guardian-Ping Settings)

ALTER TABLE settings
    ADD COLUMN theme_mode VARCHAR(10) NOT NULL DEFAULT 'light'
        CHECK (theme_mode IN ('light', 'dark', 'system')),
    ADD COLUMN guardian_ping_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN quiet_hours_start SMALLINT NOT NULL DEFAULT 21
        CHECK (quiet_hours_start BETWEEN 0 AND 23),
    ADD COLUMN quiet_hours_end SMALLINT NOT NULL DEFAULT 7
        CHECK (quiet_hours_end BETWEEN 0 AND 23),
    ADD COLUMN adaptive_bolus_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE share_links (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    VARCHAR(50) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mode        VARCHAR(20) NOT NULL CHECK (mode IN ('DOCTOR', 'MINI')),
    token       VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_share_links_owner   ON share_links(owner_id, created_at DESC);
CREATE INDEX idx_share_links_token   ON share_links(token);
CREATE INDEX idx_share_links_expiry  ON share_links(expires_at);

CREATE TABLE audit_logs (
    id          BIGSERIAL   PRIMARY KEY,
    profile_id  VARCHAR(50) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    actor_id    VARCHAR(50) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action      VARCHAR(80) NOT NULL,
    details     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_profile_ts ON audit_logs(profile_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor_ts   ON audit_logs(actor_id, created_at DESC);
