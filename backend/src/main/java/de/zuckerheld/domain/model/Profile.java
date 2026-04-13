package de.zuckerheld.domain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    @Column(length = 50)
    private String id;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String name;

    @Size(max = 10)
    @Column(nullable = false)
    private String avatar = "🦊";

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ProfileType type = ProfileType.ERWACHSEN;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Role role = Role.PATIENT;

    /** bcrypt-Hash des PINs. NULL = kein PIN gesetzt. */
    @Column(name = "pin_hash")
    private String pinHash;

    /** PIN-Länge: 4 (Standard für Kinder) oder 6 (empfohlen für Jugendliche/Erwachsene) */
    @Column(name = "pin_length")
    private int pinLength = 4;

    /** Altersgruppe für adaptive UI: child_young, child_teen, adult */
    @Column(name = "age_group", length = 20)
    private String ageGroup = "adult";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @OneToOne(mappedBy = "profile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Settings settings;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    // ── Enums ─────────────────────────────────────────────────────────────

    public enum ProfileType {
        KIND, ERWACHSEN;

        @Override
        public String toString() {
            return name().toLowerCase();
        }
    }

    public enum Role {
        OBSERVER(0), CAREGIVER(1), PATIENT(2), ADMIN(3);

        private final int level;

        Role(int level) {
            this.level = level;
        }

        public int getLevel() {
            return level;
        }

        public boolean hasMinRole(Role required) {
            return this.level >= required.level;
        }

        @Override
        public String toString() {
            return name().toLowerCase();
        }
    }

    // ── Getter/Setter ──────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public ProfileType getType() { return type; }
    public void setType(ProfileType type) { this.type = type; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getPinHash() { return pinHash; }
    public void setPinHash(String pinHash) { this.pinHash = pinHash; }

    public int getPinLength() { return pinLength; }
    public void setPinLength(int pinLength) { this.pinLength = pinLength; }

    public String getAgeGroup() { return ageGroup; }
    public void setAgeGroup(String ageGroup) { this.ageGroup = ageGroup; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    public Settings getSettings() { return settings; }
    public void setSettings(Settings settings) { this.settings = settings; }
}
