package de.zuckerheld.domain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "food_items",
    indexes = {
        @Index(name = "idx_food_items_profile", columnList = "profile_id, source"),
        @Index(name = "idx_food_items_barcode", columnList = "barcode")
    })
public class FoodItem {

    @Id
    @Column(length = 50)
    private String id;

    /** NULL = eingebautes Lebensmittel (für alle Nutzer sichtbar) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id")
    private Profile profile;

    @NotBlank
    @Column(nullable = false, length = 255)
    private String name;

    @NotNull
    @Column(name = "kh_per_100g", nullable = false, precision = 5, scale = 1)
    private BigDecimal khPer100g;

    @Column(length = 10)
    private String emoji;

    @Column(nullable = false, length = 20)
    private String source = "builtin"; // builtin/custom/online

    @Column(length = 50)
    private String barcode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    // ── Getter/Setter ──────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Profile getProfile() { return profile; }
    public void setProfile(Profile profile) { this.profile = profile; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getKhPer100g() { return khPer100g; }
    public void setKhPer100g(BigDecimal khPer100g) { this.khPer100g = khPer100g; }

    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
}
