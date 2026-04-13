package de.zuckerheld.domain.model;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "share_links")
public class ShareLink {

    public enum ShareMode {
        DOCTOR, MINI
    }

    @Id
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private Profile owner;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ShareMode mode = ShareMode.DOCTOR;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(nullable = false)
    private boolean revoked = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @PrePersist
    public void onPersist() {
        if (id == null) id = UUID.randomUUID();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Profile getOwner() { return owner; }
    public void setOwner(Profile owner) { this.owner = owner; }

    public ShareMode getMode() { return mode; }
    public void setMode(ShareMode mode) { this.mode = mode; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public boolean isRevoked() { return revoked; }
    public void setRevoked(boolean revoked) { this.revoked = revoked; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
}
