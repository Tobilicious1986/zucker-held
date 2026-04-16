ALTER TABLE profile_links
    ADD COLUMN relationship_kind VARCHAR(30) NOT NULL DEFAULT 'FAMILY',
    ADD COLUMN access_scope VARCHAR(30) NOT NULL DEFAULT 'LIVE_MEDICAL',
    ADD COLUMN purpose VARCHAR(120) NOT NULL DEFAULT 'Familienfreigabe';

UPDATE profile_links
SET access_scope = CASE role
    WHEN 'ADMIN' THEN 'LIVE_MEDICAL'
    WHEN 'CAREGIVER' THEN 'LIVE_MEDICAL'
    ELSE 'LIVE_MEDICAL'
END,
    purpose = CASE role
        WHEN 'ADMIN' THEN 'Familienverwaltung'
        WHEN 'CAREGIVER' THEN 'Familienbegleitung'
        ELSE 'Lesender Familienzugriff'
    END
WHERE access_scope IS NULL
   OR purpose IS NULL
   OR purpose = 'Familienfreigabe';

ALTER TABLE profile_links
    ADD CONSTRAINT chk_profile_links_relationship_kind
        CHECK (relationship_kind IN ('FAMILY', 'PROFESSIONAL', 'SCHOOL', 'LEARNING_GUEST')),
    ADD CONSTRAINT chk_profile_links_access_scope
        CHECK (access_scope IN ('LIVE_MEDICAL', 'SUMMARY_ONLY', 'LEARNING_ONLY'));
