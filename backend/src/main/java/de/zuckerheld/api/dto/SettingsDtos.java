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
        String  aiProvider,
        boolean hasOpenaiApiKey,
        boolean hasGeminiApiKey,
        BigDecimal ketoneThreshold
    ) {
        public static SettingsResponse from(Settings s) {
            return new SettingsResponse(
                s.getBzMin(), s.getBzMax(),
                s.getContacts(), s.getWidgetConfig(),
                s.getClaudeApiKeyEnc() != null,
                s.getNightscoutUrl(),
                s.getNightscoutTokenEnc() != null,
                s.getInsulinRatio(), s.getCorrectionFactor(), s.getTargetBz(),
                s.getNotificationsEnabled(),
                s.getAiProvider(),
                s.getOpenaiApiKeyEnc() != null,
                s.getGeminiApiKeyEnc() != null,
                s.getKetoneThreshold()
            );
        }
    }
}
