-- V11: Pending-Invites ohne Watcher erlauben
-- Für Einladungen wird watcher_id erst beim Accept gesetzt.

ALTER TABLE profile_links
  ALTER COLUMN watcher_id DROP NOT NULL;
