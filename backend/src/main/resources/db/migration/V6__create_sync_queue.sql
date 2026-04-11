-- ═══════════════════════════════════════════════════════════
-- V6: Offline-Sync-Queue
-- Für Conflict-Resolution bei Offline-Writes (IndexedDB → Backend)
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- für gen_random_uuid()

CREATE TABLE sync_queue (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id  VARCHAR(50)   NOT NULL,
    operation   VARCHAR(10)   NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
    entity_type VARCHAR(30)   NOT NULL,       -- 'entry', 'food', 'settings'
    entity_id   VARCHAR(50),
    payload     JSONB,
    device_id   VARCHAR(100),                 -- zur Deduplizierung bei Multi-Device
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    synced_at   TIMESTAMPTZ                   -- NULL = noch nicht synchronisiert
);

CREATE INDEX idx_sync_queue_profile_unsynced ON sync_queue (profile_id, synced_at)
    WHERE synced_at IS NULL;

COMMENT ON TABLE sync_queue IS 'Offline-Write-Queue für Multi-Device-Sync';
