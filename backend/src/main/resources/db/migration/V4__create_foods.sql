-- ═══════════════════════════════════════════════════════════
-- V4: Lebensmittel-Datenbank
-- Entspricht: data/foods.js (builtin) + state.foodDB (custom/online)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE food_items (
    id              VARCHAR(50)   PRIMARY KEY,
    profile_id      VARCHAR(50)   REFERENCES profiles(id) ON DELETE CASCADE,
                                  -- NULL = eingebautes Lebensmittel (für alle Nutzer)
    name            VARCHAR(255)  NOT NULL,
    kh_per_100g     NUMERIC(5,1)  NOT NULL,
    emoji           VARCHAR(10),
    source          VARCHAR(20)   NOT NULL DEFAULT 'builtin'
                        CHECK (source IN ('builtin', 'custom', 'online')),
    barcode         VARCHAR(50),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_food_items_profile ON food_items (profile_id, source);
CREATE INDEX idx_food_items_name ON food_items USING gin (to_tsvector('german', name));
CREATE INDEX idx_food_items_barcode ON food_items (barcode) WHERE barcode IS NOT NULL;

-- Zuletzt verwendete Lebensmittel pro Profil (max 8)
CREATE TABLE recent_food_ids (
    profile_id  VARCHAR(50)  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    food_id     VARCHAR(50)  NOT NULL,
    used_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (profile_id, food_id)
);

-- ── Eingebaute Lebensmittel (portiert aus data/foods.js) ──────────────────

INSERT INTO food_items (id, profile_id, name, kh_per_100g, emoji, source) VALUES
-- Brot & Getreide
('builtin_weissbrot',        NULL, 'Weißbrot',                  49.0, '🍞', 'builtin'),
('builtin_vollkornbrot',     NULL, 'Vollkornbrot',              41.0, '🍞', 'builtin'),
('builtin_toastbrot',        NULL, 'Toastbrot',                 48.0, '🍞', 'builtin'),
('builtin_broetchen',        NULL, 'Brötchen (Semmel)',         55.0, '🥖', 'builtin'),
('builtin_laugenbrezel',     NULL, 'Laugenbrezel',              65.0, '🥨', 'builtin'),
('builtin_knaeckebrot',      NULL, 'Knäckebrot',               70.0, '🍞', 'builtin'),
('builtin_roggenmehl',       NULL, 'Roggenbrot',                40.0, '🍞', 'builtin'),
('builtin_croissant',        NULL, 'Croissant',                 45.0, '🥐', 'builtin'),

-- Nudeln & Reis
('builtin_nudeln_roh',       NULL, 'Nudeln (roh)',              72.0, '🍝', 'builtin'),
('builtin_nudeln_gekocht',   NULL, 'Nudeln (gekocht)',          25.0, '🍝', 'builtin'),
('builtin_reis_roh',         NULL, 'Reis (roh)',                76.0, '🍚', 'builtin'),
('builtin_reis_gekocht',     NULL, 'Reis (gekocht)',            26.0, '🍚', 'builtin'),
('builtin_couscous_roh',     NULL, 'Couscous (roh)',            73.0, '🍚', 'builtin'),
('builtin_couscous_gek',     NULL, 'Couscous (gekocht)',        23.0, '🍚', 'builtin'),

-- Kartoffeln
('builtin_kartoffel_roh',    NULL, 'Kartoffel (roh)',           15.0, '🥔', 'builtin'),
('builtin_kartoffel_gek',    NULL, 'Kartoffel (gekocht)',       14.0, '🥔', 'builtin'),
('builtin_pommes',           NULL, 'Pommes Frites',             35.0, '🍟', 'builtin'),
('builtin_kartoffelpuree',   NULL, 'Kartoffelpüree',           14.0, '🥔', 'builtin'),

-- Milchprodukte
('builtin_vollmilch',        NULL, 'Vollmilch (3,5%)',           4.7, '🥛', 'builtin'),
('builtin_magermilch',       NULL, 'Magermilch (0,1%)',          4.9, '🥛', 'builtin'),
('builtin_naturjoghurt',     NULL, 'Naturjoghurt (3,5%)',        3.8, '🥛', 'builtin'),
('builtin_fruchtjoghurt',    NULL, 'Fruchtjoghurt',             13.0, '🥛', 'builtin'),
('builtin_quark',            NULL, 'Magerquark',                 3.5, '🥛', 'builtin'),
('builtin_kaese_gouda',      NULL, 'Gouda',                      0.5, '🧀', 'builtin'),

-- Obst
('builtin_apfel',            NULL, 'Apfel',                     12.0, '🍎', 'builtin'),
('builtin_banane',           NULL, 'Banane',                    20.0, '🍌', 'builtin'),
('builtin_orange',           NULL, 'Orange',                     9.0, '🍊', 'builtin'),
('builtin_erdbeere',         NULL, 'Erdbeeren',                  6.0, '🍓', 'builtin'),
('builtin_trauben',          NULL, 'Weintrauben',               16.0, '🍇', 'builtin'),
('builtin_kirsche',          NULL, 'Kirschen',                  12.0, '🍒', 'builtin'),
('builtin_pfirsich',         NULL, 'Pfirsich',                   9.0, '🍑', 'builtin'),
('builtin_wassermelone',     NULL, 'Wassermelone',               8.0, '🍉', 'builtin'),
('builtin_mango',            NULL, 'Mango',                     14.0, '🥭', 'builtin'),
('builtin_ananas',           NULL, 'Ananas',                    11.0, '🍍', 'builtin'),

-- Gemüse
('builtin_karotte',          NULL, 'Karotte',                    7.0, '🥕', 'builtin'),
('builtin_gurke',            NULL, 'Gurke',                      2.0, '🥒', 'builtin'),
('builtin_tomate',           NULL, 'Tomate',                     3.5, '🍅', 'builtin'),
('builtin_mais',             NULL, 'Mais (Dose)',               14.0, '🌽', 'builtin'),
('builtin_erbsen',           NULL, 'Erbsen (TK)',               10.0, '🟢', 'builtin'),

-- Getränke
('builtin_orangensaft',      NULL, 'Orangensaft',               10.0, '🥤', 'builtin'),
('builtin_apfelsaft',        NULL, 'Apfelsaft',                 12.0, '🥤', 'builtin'),
('builtin_cola',             NULL, 'Cola',                       10.6, '🥤', 'builtin'),
('builtin_cola_light',       NULL, 'Cola Light / Zero',          0.0, '🥤', 'builtin'),
('builtin_traubenzucker',    NULL, 'Traubenzucker (1 Plättchen)', 5.0, '💊', 'builtin'),

-- Süßes & Snacks
('builtin_schokolade',       NULL, 'Schokolade (Vollmilch)',    56.0, '🍫', 'builtin'),
('builtin_chips',            NULL, 'Kartoffelchips',            50.0, '🥔', 'builtin'),
('builtin_gummibear',        NULL, 'Gummibärchen',              77.0, '🐻', 'builtin'),
('builtin_keks',             NULL, 'Butterkeks',                72.0, '🍪', 'builtin'),
('builtin_waffel',           NULL, 'Waffel (ohne Füllung)',     60.0, '🧇', 'builtin'),

-- Aufstriche & Sonstiges
('builtin_marmelade',        NULL, 'Marmelade/Konfitüre',      60.0, '🍓', 'builtin'),
('builtin_honig',            NULL, 'Honig',                     80.0, '🍯', 'builtin'),
('builtin_nutella',          NULL, 'Nuss-Nougat-Creme',        57.0, '🫙', 'builtin'),
('builtin_weisszucker',      NULL, 'Weißzucker',              100.0, '🍬', 'builtin'),
('builtin_pizza_margh',      NULL, 'Pizza Margherita',          30.0, '🍕', 'builtin'),
('builtin_hamburger',        NULL, 'Hamburger',                 25.0, '🍔', 'builtin');
