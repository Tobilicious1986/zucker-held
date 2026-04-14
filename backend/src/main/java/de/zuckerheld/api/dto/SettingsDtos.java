package de.zuckerheld.api.dto;

import de.zuckerheld.domain.model.Settings;

import java.math.BigDecimal;

public class SettingsDtos {

    public record UpdateSettingsRequest(
        Integer bzMin,
        Integer bzMax,
        String  contacts,       // JSON-Array als String
        String  widgetConfig,   // JSON-Objekt als String
        String  claudeApiKey,   // Klartext → wird verschlüsselt
        String  nightscoutUrl,
        String  nightscoutToken,
        Integer insulinRatio,
        Integer correctionFactor,
        Integer targetBz,
        Boolean notificationsEnabled,
        Boolean dailySummaryEnabled,
        String  themeMode,
        Boolean guardianPingEnabled,
        Integer quietHoursStart,
        Integer quietHoursEnd,
        Boolean adaptiveBolusEnabled,
        String  aiProvider,     // claude/openai/gemini
        String  openaiApiKey,
        String  geminiApiKey,
        BigDecimal ketoneThreshold
    ) {}

    public record SettingsResponse(
        Integer bzMin,
        Integer bzMax,
        String  contacts,
        String  widgetConfig,
        boolean hasClaudeApiKey,
        String  nightscoutUrl,
        boolean hasNightscoutToken,
        Integer insulinRatio,
        Integer correctionFactor,
        Integer targetBz,
        Boolean notificationsEnabled,
        Boolean dailySummaryEnabled,
        String  themeMode,
        Boolean guardianPingEnabled,
        Integer quietHoursStart,
        Integer quietHoursEnd,
        Boolean adaptiveBolusEnabled,
        String  aiProvider,
        boolean hasOpenaiApiKey,
        boolean hasGeminiApiKey,
        BigDecimal ketoneThreshold,
        boolean aiChatAvailable,
        String aiAvailabilityReason
    ) {
        public static SettingsResponse from(Settings s) {
            boolean hasClaudeApiKey = s.getClaudeApiKeyEnc() != null;
            boolean hasNightscoutToken = s.getNightscoutTokenEnc() != null;
            boolean hasOpenaiApiKey = s.getOpenaiApiKeyEnc() != null;
            boolean hasGeminiApiKey = s.getGeminiApiKeyEnc() != null;
            String aiProvider = s.getAiProvider();
            boolean aiChatAvailable = switch ((aiProvider != null ? aiProvider : "claude").toLowerCase()) {
                case "openai" -> hasOpenaiApiKey;
                case "gemini" -> hasGeminiApiKey;
                default -> hasClaudeApiKey;
            };
            String aiAvailabilityReason = aiChatAvailable
                    ? "KI-Chat verfügbar"
                    : "Für den gewählten KI-Provider ist noch kein API-Schlüssel hinterlegt.";

            return new SettingsResponse(
                s.getBzMin(), s.getBzMax(),
                s.getContacts(), s.getWidgetConfig(),
                hasClaudeApiKey,
                s.getNightscoutUrl(),
                hasNightscoutToken,
                s.getInsulinRatio(), s.getCorrectionFactor(), s.getTargetBz(),
                s.getNotificationsEnabled(),
                s.getDailySummaryEnabled(),
                s.getThemeMode(),
                s.getGuardianPingEnabled(),
                s.getQuietHoursStart(),
                s.getQuietHoursEnd(),
                s.getAdaptiveBolusEnabled(),
                aiProvider,
                hasOpenaiApiKey,
                hasGeminiApiKey,
                s.getKetoneThreshold(),
                aiChatAvailable,
                aiAvailabilityReason
            );
        }
    }
}
