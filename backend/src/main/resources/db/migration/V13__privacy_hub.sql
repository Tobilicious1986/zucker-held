-- V13: Datenschutz-Hub Grundlagen
-- Kleine Erweiterung an profiles für Löschanfrage-Status und Zeitpunkt.

ALTER TABLE profiles
    ADD COLUMN privacy_delete_status VARCHAR(20) NOT NULL DEFAULT 'NONE'
        CHECK (privacy_delete_status IN ('NONE', 'REQUESTED', 'REVOKED')),
    ADD COLUMN privacy_delete_requested_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.privacy_delete_status IS 'Status der Datenschutz-Löschanfrage';
COMMENT ON COLUMN profiles.privacy_delete_requested_at IS 'Zeitpunkt der letzten Löschanfrage';
