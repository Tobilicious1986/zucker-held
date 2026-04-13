package de.zuckerheld.domain.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "settings")
public class Settings {

    @Id
    @Column(name = "profile_id", length = 50)
    private String profileId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "profile_id")
    private Profile profile;

    // BZ-Zielbereich
    @Column(name = "bz_min", nullable = false)
    private Integer bzMin = 70;

    @Column(name = "bz_max", nullable = false)
    private Integer bzMax = 180;

    // Notfallkontakte [{name, phone}] als JSON
    @Column(columnDefinition = "text", nullable = false)
    private String contacts = "[]";

    // Widget-Konfiguration {order: [...], disabled: [...]} als JSON
    @Column(name = "widget_config", columnDefinition = "text")
    private String widgetConfig;

    // API-Keys (AES-verschlüsselt)
    @Column(name = "claude_api_key_enc")
    private String claudeApiKeyEnc;

    @Column(name = "nightscout_url")
    private String nightscoutUrl;

    @Column(name = "nightscout_token_enc")
    private String nightscoutTokenEnc;

    // Insulin-Parameter (BL-01)
    @Column(name = "insulin_ratio", nullable = false)
    private Integer insulinRatio = 10;

    @Column(name = "correction_factor", nullable = false)
    private Integer correctionFactor = 30;

    @Column(name = "target_bz", nullable = false)
    private Integer targetBz = 120;

    // Benachrichtigungen
    @Column(name = "notifications_enabled", nullable = false)
    private Boolean notificationsEnabled = false;

    @Column(name = "daily_summary_enabled", nullable = false)
    private Boolean dailySummaryEnabled = false;

    @Column(name = "theme_mode", nullable = false, length = 10)
    private String themeMode = "light";

    @Column(name = "guardian_ping_enabled", nullable = false)
    private Boolean guardianPingEnabled = true;

    @Column(name = "quiet_hours_start", nullable = false)
    private Integer quietHoursStart = 21;

    @Column(name = "quiet_hours_end", nullable = false)
    private Integer quietHoursEnd = 7;

    @Column(name = "adaptive_bolus_enabled", nullable = false)
    private Boolean adaptiveBolusEnabled = false;

    // KI-Provider (BL-KI01)
    @Column(name = "ai_provider", nullable = false, length = 20)
    private String aiProvider = "claude";

    @Column(name = "openai_api_key_enc")
    private String openaiApiKeyEnc;

    @Column(name = "gemini_api_key_enc")
    private String geminiApiKeyEnc;

    // Ketone-Schwellwert (BL-H08)
    @Column(name = "ketone_threshold", nullable = false, precision = 3, scale = 1)
    private BigDecimal ketoneThreshold = new BigDecimal("0.6");

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    // ── Getter/Setter ──────────────────────────────────────────────────────

    public String getProfileId() { return profileId; }
    public void setProfileId(String profileId) { this.profileId = profileId; }

    public Profile getProfile() { return profile; }
    public void setProfile(Profile profile) { this.profile = profile; }

    public Integer getBzMin() { return bzMin; }
    public void setBzMin(Integer bzMin) { this.bzMin = bzMin; }

    public Integer getBzMax() { return bzMax; }
    public void setBzMax(Integer bzMax) { this.bzMax = bzMax; }

    public String getContacts() { return contacts; }
    public void setContacts(String contacts) { this.contacts = contacts; }

    public String getWidgetConfig() { return widgetConfig; }
    public void setWidgetConfig(String widgetConfig) { this.widgetConfig = widgetConfig; }

    public String getClaudeApiKeyEnc() { return claudeApiKeyEnc; }
    public void setClaudeApiKeyEnc(String claudeApiKeyEnc) { this.claudeApiKeyEnc = claudeApiKeyEnc; }

    public String getNightscoutUrl() { return nightscoutUrl; }
    public void setNightscoutUrl(String nightscoutUrl) { this.nightscoutUrl = nightscoutUrl; }

    public String getNightscoutTokenEnc() { return nightscoutTokenEnc; }
    public void setNightscoutTokenEnc(String nightscoutTokenEnc) { this.nightscoutTokenEnc = nightscoutTokenEnc; }

    public Integer getInsulinRatio() { return insulinRatio; }
    public void setInsulinRatio(Integer insulinRatio) { this.insulinRatio = insulinRatio; }

    public Integer getCorrectionFactor() { return correctionFactor; }
    public void setCorrectionFactor(Integer correctionFactor) { this.correctionFactor = correctionFactor; }

    public Integer getTargetBz() { return targetBz; }
    public void setTargetBz(Integer targetBz) { this.targetBz = targetBz; }

    public Boolean getNotificationsEnabled() { return notificationsEnabled; }
    public void setNotificationsEnabled(Boolean notificationsEnabled) { this.notificationsEnabled = notificationsEnabled; }

    public Boolean getDailySummaryEnabled() { return dailySummaryEnabled; }
    public void setDailySummaryEnabled(Boolean dailySummaryEnabled) { this.dailySummaryEnabled = dailySummaryEnabled; }

    public String getThemeMode() { return themeMode; }
    public void setThemeMode(String themeMode) { this.themeMode = themeMode; }

    public Boolean getGuardianPingEnabled() { return guardianPingEnabled; }
    public void setGuardianPingEnabled(Boolean guardianPingEnabled) { this.guardianPingEnabled = guardianPingEnabled; }

    public Integer getQuietHoursStart() { return quietHoursStart; }
    public void setQuietHoursStart(Integer quietHoursStart) { this.quietHoursStart = quietHoursStart; }

    public Integer getQuietHoursEnd() { return quietHoursEnd; }
    public void setQuietHoursEnd(Integer quietHoursEnd) { this.quietHoursEnd = quietHoursEnd; }

    public Boolean getAdaptiveBolusEnabled() { return adaptiveBolusEnabled; }
    public void setAdaptiveBolusEnabled(Boolean adaptiveBolusEnabled) { this.adaptiveBolusEnabled = adaptiveBolusEnabled; }

    public String getAiProvider() { return aiProvider; }
    public void setAiProvider(String aiProvider) { this.aiProvider = aiProvider; }

    public String getOpenaiApiKeyEnc() { return openaiApiKeyEnc; }
    public void setOpenaiApiKeyEnc(String openaiApiKeyEnc) { this.openaiApiKeyEnc = openaiApiKeyEnc; }

    public String getGeminiApiKeyEnc() { return geminiApiKeyEnc; }
    public void setGeminiApiKeyEnc(String geminiApiKeyEnc) { this.geminiApiKeyEnc = geminiApiKeyEnc; }

    public BigDecimal getKetoneThreshold() { return ketoneThreshold; }
    public void setKetoneThreshold(BigDecimal ketoneThreshold) { this.ketoneThreshold = ketoneThreshold; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
