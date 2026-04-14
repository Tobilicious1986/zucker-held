ALTER TABLE food_items
    ADD COLUMN IF NOT EXISTS category VARCHAR(60);

ALTER TABLE food_items
    ADD COLUMN IF NOT EXISTS aliases TEXT NOT NULL DEFAULT '[]';

ALTER TABLE food_items
    ADD COLUMN IF NOT EXISTS portion_presets TEXT NOT NULL DEFAULT '[]';

ALTER TABLE food_items
    ADD COLUMN IF NOT EXISTS external_source VARCHAR(50);

UPDATE food_items
SET aliases = '[]'
WHERE aliases IS NULL;

UPDATE food_items
SET portion_presets = '[]'
WHERE portion_presets IS NULL;
