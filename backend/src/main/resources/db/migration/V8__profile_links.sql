-- V8: Familien-Rollen — Profile-Links + Altersgruppe + PIN-Länge
-- Sprint 3: Multi-User-System für Eltern, Kinder, Betreuer, Ärzte

-- Profile-Links: wer darf wessen Daten sehen?
CREATE TABLE profile_links (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    VARCHAR(50) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  watcher_id  VARCHAR(50) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('OBSERVER', 'CAREGIVER', 'ADMIN')),
  status      VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED')),
  invite_code VARCHAR(20) UNIQUE,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, watcher_id)
);

CREATE INDEX idx_profile_links_owner    ON profile_links(owner_id, status);
CREATE INDEX idx_profile_links_watcher  ON profile_links(watcher_id, status);
CREATE INDEX idx_profile_links_code     ON profile_links(invite_code) WHERE invite_code IS NOT NULL;

-- PIN-Länge (4 oder 6 Stellen) + Altersgruppe für adaptive UI
ALTER TABLE profiles ADD COLUMN pin_length SMALLINT DEFAULT 4
  CHECK (pin_length IN (4, 6));

ALTER TABLE profiles ADD COLUMN age_group VARCHAR(20) DEFAULT 'adult'
  CHECK (age_group IN ('child_young', 'child_teen', 'adult'));
