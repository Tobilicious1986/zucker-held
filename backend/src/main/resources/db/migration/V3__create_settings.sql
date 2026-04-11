-- ═══════════════════════════════════════════════════════════
-- V3: Einstellungen pro Profil
-- Entspricht: state.settings + neue Felder (KI-Provider, Ketone-Schwelle)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE settings (
    profile_id              VARCHAR(50)   PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

    -- BZ-Zielbereich
    bz_min                  SMALLINT      NOT NULL DEFAULT 70,    -- mg/dL
    bz_max                  SMALLINT      NOT NULL DEFAULT 180,   -- mg/dL

    -- Notfallkontakte [{name, phone}] als JSON-String
    contacts                TEXT          NOT NULL DEFAULT '[]',

    -- Dashboard-Widget-Konfiguration {order: [...], disabled: [...]} als JSON-String
    widget_config           TEXT,

    -- API-Keys (AES-verschlüsselt im Backend gespeichert)
    claude_api_key_enc      TEXT,
    nightscout_url          TEXT,
    nightscout_token_enc    TEXT,

    -- Insulin-Parameter (BL-01)
    insulin_ratio           SMALLINT      NOT NULL DEFAULT 10,    -- 1 IE pro X g KH
    correction_factor       SMALLINT      NOT NULL DEFAULT 30,    -- 1 IE senkt BZ um X mg/dL
    target_bz               SMALLINT      NOT NULL DEFAULT 120,   -- Korrektur-Zielwert mg/dL

    -- Benachrichtigungen
    notifications_enabled   BOOLEAN       NOT NULL DEFAULT FALSE,

    -- KI-Provider (BL-KI01)
    ai_provider             VARCHAR(20)   NOT NULL DEFAULT 'claude'
                                CHECK (ai_provider IN ('claude', 'openai', 'gemini')),
    openai_api_key_enc      TEXT,
    gemini_api_key_enc      TEXT,

    -- Ketone-Schwellwert (BL-H08)
    ketone_threshold        NUMERIC(3,1)  NOT NULL DEFAULT 0.6,   -- mmol/L

    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE settings IS '1:1 Einstellungen pro Profil';
COMMENT ON COLUMN settings.claude_api_key_enc IS 'AES-256 verschlüsselt — niemals im Klartext';
COMMENT ON COLUMN settings.ketone_threshold IS 'Schwellwert für DKA-Warnung in mmol/L (Standard: 0.6)';
