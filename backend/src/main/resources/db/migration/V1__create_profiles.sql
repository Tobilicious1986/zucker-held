-- ═══════════════════════════════════════════════════════════
-- V1: Profile-Tabelle
-- Entspricht: src/auth/local-provider.js Profile-Schema
-- ═══════════════════════════════════════════════════════════

CREATE TABLE profiles (
    id          VARCHAR(50)  PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    avatar      VARCHAR(10)  NOT NULL DEFAULT '🦊',
    type        VARCHAR(20)  NOT NULL DEFAULT 'erwachsen'
                    CHECK (type IN ('kind', 'erwachsen')),
    role        VARCHAR(20)  NOT NULL DEFAULT 'patient'
                    CHECK (role IN ('patient', 'admin', 'caregiver', 'observer')),
    pin_hash    VARCHAR(255),        -- bcrypt-Hash (NULL = kein PIN)
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Nutzerprofile (Kind/Erwachsener) mit Rollen-basierter Zugriffskontrolle';
COMMENT ON COLUMN profiles.pin_hash IS 'bcrypt-Hash des PINs. NULL bedeutet kein PIN gesetzt.';
COMMENT ON COLUMN profiles.role IS 'observer=nur lesen, caregiver=Einträge, patient=Vollzugriff, admin=Einstellungen';
