-- ═══════════════════════════════════════════════════════════
-- V7: Enum-Constraints auf Großschreibung korrigieren
-- Java @Enumerated(EnumType.STRING) speichert den Enum-Namen als Großbuchstaben
-- V1 hatte Kleinbuchstaben-Constraints → ConstraintViolationException beim INSERT
-- ═══════════════════════════════════════════════════════════

ALTER TABLE profiles
    DROP CONSTRAINT profiles_type_check,
    ADD CONSTRAINT profiles_type_check CHECK (type IN ('KIND', 'ERWACHSEN'));

ALTER TABLE profiles
    DROP CONSTRAINT profiles_role_check,
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('OBSERVER', 'CAREGIVER', 'PATIENT', 'ADMIN'));

ALTER TABLE entries
    DROP CONSTRAINT entries_type_check,
    ADD CONSTRAINT entries_type_check CHECK (type IN ('BZ', 'INSULIN', 'MEAL', 'ACTIVITY', 'KETONE'));
