-- ═══════════════════════════════════════════════════════════
-- V2: Eintrags-Tabellen (BZ, Insulin, Mahlzeit, Aktivität, Ketone)
-- Entspricht: state.entries[] Array mit type-Diskriminator
-- ═══════════════════════════════════════════════════════════

CREATE TABLE entries (
    id                  VARCHAR(50)   PRIMARY KEY,
    profile_id          VARCHAR(50)   NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type                VARCHAR(20)   NOT NULL
                            CHECK (type IN ('bz', 'insulin', 'meal', 'activity', 'ketone')),
    timestamp           BIGINT        NOT NULL,    -- Unix-Millisekunden (wie im Frontend)

    -- BZ-Messung (type='bz')
    bz_value            SMALLINT,                  -- mg/dL
    bz_level            VARCHAR(20),               -- critical/low/ok/high/veryhigh
    bz_in_target        BOOLEAN,
    bz_measure_time     VARCHAR(30),               -- nuechtern/vor_mahlzeit/nach_mahlzeit/...

    -- Insulin (type='insulin')
    insulin_units       NUMERIC(4,1),              -- z.B. 8.5 IE
    insulin_type        VARCHAR(20),               -- kurz/lang/basal

    -- Mahlzeit (type='meal')
    meal_name           VARCHAR(255),
    meal_kh             SMALLINT,                  -- gesamt Kohlenhydrate in g
    meal_time           VARCHAR(30),               -- fruehstueck/mittagessen/...

    -- Aktivität (type='activity')
    activity_id         VARCHAR(50),
    activity_name       VARCHAR(100),
    activity_emoji      VARCHAR(10),
    activity_intensity  VARCHAR(20),               -- leicht/mittel/intensiv
    duration_min        SMALLINT,

    -- Ketone (type='ketone', BL-H08)
    ketone_value        NUMERIC(4,2),              -- mmol/L
    ketone_unit         VARCHAR(10),               -- 'mmol' oder 'mg'

    -- Gemeinsam
    note                TEXT,
    source              VARCHAR(30)   NOT NULL DEFAULT 'manual',  -- manual/nightscout/dexcom/cgm
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index für häufigste Abfrage: Einträge pro Profil nach Zeitstempel
CREATE INDEX idx_entries_profile_type_ts ON entries (profile_id, type, timestamp DESC);
-- Index für Zeitbereichsabfragen
CREATE INDEX idx_entries_timestamp ON entries (profile_id, timestamp DESC);

-- Mahlzeit-Einzelpositionen (items in state.entries[].items[])
CREATE TABLE meal_items (
    id          BIGSERIAL    PRIMARY KEY,
    entry_id    VARCHAR(50)  NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    name        VARCHAR(255),
    amount_g    SMALLINT,    -- Menge in Gramm
    kh          SMALLINT     -- Kohlenhydrate dieser Portion in g
);

COMMENT ON TABLE entries IS 'Alle Tagebuch-Einträge: BZ, Insulin, Mahlzeit, Aktivität, Ketone';
COMMENT ON COLUMN entries.timestamp IS 'Unix-Millisekunden (kompatibel mit Frontend Date.now())';
COMMENT ON COLUMN entries.source IS 'manual=Nutzer, nightscout=CGM-Sync, dexcom=CSV-Import';
