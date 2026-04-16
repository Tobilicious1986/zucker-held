-- Sprint 15: Index für Consent-Journal-Abfragen (performante Filterung nach action)
-- Unterstützt GET /api/v1/privacy/consent-history

CREATE INDEX IF NOT EXISTS idx_audit_logs_consent
    ON audit_logs (profile_id, action, created_at DESC);

-- View für spätere DSGVO-Auskunfts-Automatisierung (Sprint 16+)
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
    'PRIVACY_DELETE_REQUEST_REVOKE'
)
ORDER BY al.created_at DESC;
