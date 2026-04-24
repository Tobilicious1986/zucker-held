package de.zuckerheld.domain.model;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

/**
 * Verknüpfung zwischen zwei Profilen: Owner (Diabetespatient) und Watcher (Elternteil, Betreuer, Arzt).
 * Ein Watcher darf je nach Rolle die Daten des Owners einsehen oder bearbeiten.
 */
@Entity
@Table(name = "profile_links")
public class ProfileLink {

    public enum LinkRole {
        OBSERVER, CAREGIVER, ADMIN
    }

    public enum RelationshipKind {
        FAMILY, PROFESSIONAL, SCHOOL, LEARNING_GUEST
    }

    public enum AccessScope {
        LIVE_MEDICAL, SUMMARY_ONLY, LEARNING_ONLY
    }

    public enum LinkStatus {
        PENDING, ACCEPTED, REVOKED
    }

    @Id
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private Profile owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "watcher_id")
    private Profile watcher;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private LinkRole role;

    @Column(name = "relationship_kind", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private RelationshipKind relationshipKind = RelationshipKind.FAMILY;

    @Column(name = "access_scope", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private AccessScope accessScope = AccessScope.LIVE_MEDICAL;

    @Column(nullable = false, length = 120)
    private String purpose = "Familienfreigabe";

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private LinkStatus status = LinkStatus.PENDING;

    @Column(name = "invite_code", length = 20, unique = true)
    private String inviteCode;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @PrePersist
    public void onPersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }

    // ── Getter/Setter ──────────────────────────────────────────────────────

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Profile getOwner() { return owner; }
    public void setOwner(Profile owner) { this.owner = owner; }

    public Profile getWatcher() { return watcher; }
    public void setWatcher(Profile watcher) { this.watcher = watcher; }

    public LinkRole getRole() { return role; }
    public void setRole(LinkRole role) { this.role = role; }

    public RelationshipKind getRelationshipKind() { return relationshipKind; }
    public void setRelationshipKind(RelationshipKind relationshipKind) { this.relationshipKind = relationshipKind; }

    public AccessScope getAccessScope() { return accessScope; }
    public void setAccessScope(AccessScope accessScope) { this.accessScope = accessScope; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public LinkStatus getStatus() { return status; }
    public void setStatus(LinkStatus status) { this.status = status; }

    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }

    /** Ob der Link abgelaufen ist (expiresAt gesetzt und in der Vergangenheit) */
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(OffsetDateTime.now(ZoneOffset.UTC));
    }

    public boolean grantsLiveMedicalAccess() {
        return status == LinkStatus.ACCEPTED
                && accessScope == AccessScope.LIVE_MEDICAL
                && !isExpired();
    }
}
