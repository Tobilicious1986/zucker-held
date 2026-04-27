-- Supersprint S14-S16: Invite-Ablauf und Access-Ablauf trennen.
-- expires_at bleibt der Ablauf eines akzeptierten Zugriffs.
-- invite_expires_at ist ab jetzt der Ablauf des noch nicht eingelösten Einladungscodes.

ALTER TABLE profile_links
    ADD COLUMN professional_role VARCHAR(40),
    ADD COLUMN invite_expires_at TIMESTAMPTZ,
    ADD COLUMN access_duration_hours INTEGER;

UPDATE profile_links
SET invite_expires_at = expires_at
WHERE status = 'PENDING'
  AND invite_expires_at IS NULL;

UPDATE profile_links
SET expires_at = NULL
WHERE status = 'PENDING';

UPDATE profile_links
SET expires_at = NULL
WHERE status = 'ACCEPTED'
  AND relationship_kind <> 'PROFESSIONAL'
  AND access_duration_hours IS NULL;

ALTER TABLE profile_links
    ADD CONSTRAINT chk_profile_links_professional_role
        CHECK (
            professional_role IS NULL
            OR professional_role IN ('DOCTOR', 'DIABETES_COUNSELOR', 'NURSING', 'CLINIC_ADMIN')
        ),
    ADD CONSTRAINT chk_profile_links_access_duration_hours
        CHECK (
            access_duration_hours IS NULL
            OR access_duration_hours BETWEEN 1 AND 168
        );

CREATE OR REPLACE VIEW consent_journal_v AS
SELECT
    al.id,
    al.profile_id,
    al.actor_id,
    al.action,
    al.details,
    al.created_at
FROM audit_logs al
WHERE al.action IN (
    'INVITE_CREATED',
    'INVITE_ACCEPTED',
    'LINK_REVOKED',
    'PRIVACY_EXPORT',
    'PRIVACY_DELETE_REQUEST',
    'PRIVACY_DELETE_REQUEST_REVOKE',
    'CONSENT_HISTORY_VIEWED'
)
ORDER BY al.created_at DESC;
