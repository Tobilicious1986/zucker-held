package de.zuckerheld.domain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "entries",
    indexes = {
        @Index(name = "idx_entries_profile_type_ts", columnList = "profile_id, type, timestamp DESC"),
        @Index(name = "idx_entries_timestamp",       columnList = "profile_id, timestamp DESC")
    })
public class Entry {

    @Id
    @Column(length = 50)
    private String id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;

    @NotNull
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private EntryType type;

    /** Unix-Millisekunden (kompatibel mit Frontend Date.now()) */
    @NotNull
    @Column(nullable = false)
    private Long timestamp;

    // ── BZ-Messung ────────────────────────────────────────────────────────

    @Column(name = "bz_value")
    private Integer bzValue;          // mg/dL

    @Column(name = "bz_level", length = 20)
    private String bzLevel;           // critical/low/ok/high/veryhigh

    @Column(name = "bz_in_target")
    private Boolean bzInTarget;

    @Column(name = "bz_measure_time", length = 30)
    private String bzMeasureTime;     // nuechtern/vor_mahlzeit/nach_mahlzeit/...

    // ── Insulin ───────────────────────────────────────────────────────────

    @Column(name = "insulin_units", precision = 4, scale = 1)
    private BigDecimal insulinUnits;  // z.B. 8.5 IE

    @Column(name = "insulin_type", length = 20)
    private String insulinType;       // kurz/lang/basal

    // ── Mahlzeit ──────────────────────────────────────────────────────────

    @Column(name = "meal_name", length = 255)
    private String mealName;

    @Column(name = "meal_kh")
    private Integer mealKh;           // gesamt Kohlenhydrate in g

    @Column(name = "meal_time", length = 30)
    private String mealTime;

    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<MealItem> mealItems = new ArrayList<>();

    // ── Aktivität ─────────────────────────────────────────────────────────

    @Column(name = "activity_id", length = 50)
    private String activityId;

    @Column(name = "activity_name", length = 100)
    private String activityName;

    @Column(name = "activity_emoji", length = 10)
    private String activityEmoji;

    @Column(name = "activity_intensity", length = 20)
    private String activityIntensity; // leicht/mittel/intensiv

    @Column(name = "duration_min")
    private Integer durationMin;

    // ── Ketone (BL-H08) ───────────────────────────────────────────────────

    @Column(name = "ketone_value", precision = 4, scale = 2)
    private BigDecimal ketoneValue;   // mmol/L

    @Column(name = "ketone_unit", length = 10)
    private String ketoneUnit;        // 'mmol' oder 'mg'

    // ── Gemeinsam ─────────────────────────────────────────────────────────

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false, length = 30)
    private String source = "manual"; // manual/nightscout/dexcom/cgm

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    // ── Enum ──────────────────────────────────────────────────────────────

    public enum EntryType {
        BZ, INSULIN, MEAL, ACTIVITY, KETONE;

        @Override
        public String toString() {
            return name().toLowerCase();
        }
    }

    // ── Getter/Setter ──────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Profile getProfile() { return profile; }
    public void setProfile(Profile profile) { this.profile = profile; }

    public EntryType getType() { return type; }
    public void setType(EntryType type) { this.type = type; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }

    public Integer getBzValue() { return bzValue; }
    public void setBzValue(Integer bzValue) { this.bzValue = bzValue; }

    public String getBzLevel() { return bzLevel; }
    public void setBzLevel(String bzLevel) { this.bzLevel = bzLevel; }

    public Boolean getBzInTarget() { return bzInTarget; }
    public void setBzInTarget(Boolean bzInTarget) { this.bzInTarget = bzInTarget; }

    public String getBzMeasureTime() { return bzMeasureTime; }
    public void setBzMeasureTime(String bzMeasureTime) { this.bzMeasureTime = bzMeasureTime; }

    public BigDecimal getInsulinUnits() { return insulinUnits; }
    public void setInsulinUnits(BigDecimal insulinUnits) { this.insulinUnits = insulinUnits; }

    public String getInsulinType() { return insulinType; }
    public void setInsulinType(String insulinType) { this.insulinType = insulinType; }

    public String getMealName() { return mealName; }
    public void setMealName(String mealName) { this.mealName = mealName; }

    public Integer getMealKh() { return mealKh; }
    public void setMealKh(Integer mealKh) { this.mealKh = mealKh; }

    public String getMealTime() { return mealTime; }
    public void setMealTime(String mealTime) { this.mealTime = mealTime; }

    public List<MealItem> getMealItems() { return mealItems; }
    public void setMealItems(List<MealItem> mealItems) { this.mealItems = mealItems; }

    public String getActivityId() { return activityId; }
    public void setActivityId(String activityId) { this.activityId = activityId; }

    public String getActivityName() { return activityName; }
    public void setActivityName(String activityName) { this.activityName = activityName; }

    public String getActivityEmoji() { return activityEmoji; }
    public void setActivityEmoji(String activityEmoji) { this.activityEmoji = activityEmoji; }

    public String getActivityIntensity() { return activityIntensity; }
    public void setActivityIntensity(String activityIntensity) { this.activityIntensity = activityIntensity; }

    public Integer getDurationMin() { return durationMin; }
    public void setDurationMin(Integer durationMin) { this.durationMin = durationMin; }

    public BigDecimal getKetoneValue() { return ketoneValue; }
    public void setKetoneValue(BigDecimal ketoneValue) { this.ketoneValue = ketoneValue; }

    public String getKetoneUnit() { return ketoneUnit; }
    public void setKetoneUnit(String ketoneUnit) { this.ketoneUnit = ketoneUnit; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
}
