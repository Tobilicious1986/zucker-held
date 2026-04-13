-- ═══════════════════════════════════════════════════════════
-- V9: Tageszusammenfassung als Opt-in in den Settings
-- ═══════════════════════════════════════════════════════════

ALTER TABLE settings
    ADD COLUMN daily_summary_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN settings.daily_summary_enabled IS
    'Aktiviert die tägliche Zusammenfassung um 20:00 Uhr (Europe/Berlin)';
