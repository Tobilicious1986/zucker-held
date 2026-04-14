package de.zuckerheld.domain.model;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
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

    public enum LinkStatus {
        PENDING, ACCEPTED, REVOKED
    }

    @Id
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private Profile owner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "watcher_id", nullable = false)
    private Profile watcher;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private LinkRole role;

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

    public LinkStatus getStatus() { return status; }
    public void setStatus(LinkStatus status) { this.status = status; }

    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
}
