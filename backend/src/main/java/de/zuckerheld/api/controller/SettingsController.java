package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.SettingsDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.Settings;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import de.zuckerheld.infrastructure.security.EncryptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Profil-Einstellungen: Zielbereich, Insulin-Parameter, API-Keys, Benachrichtigungen.
 */
@RestController
@RequestMapping("/api/v1/settings")
@Tag(name = "Settings", description = "Profileinstellungen verwalten")
public class SettingsController {

    private final SettingsRepository settingsRepository;
    private final EncryptionService  encryptionService;

    public SettingsController(SettingsRepository settingsRepository,
                              EncryptionService encryptionService) {
        this.settingsRepository = settingsRepository;
        this.encryptionService  = encryptionService;
    }

    // ═══════════════════════════════════════════════════════════════════════

    @Operation(summary = "Eigene Einstellungen abrufen")
    @GetMapping
    public ResponseEntity<SettingsDtos.SettingsResponse> getSettings(Authentication auth) {
        String   profileId = ((Profile) auth.getPrincipal()).getId();
        Settings settings  = settingsRepository.findById(profileId)
                .orElseThrow(() -> new EntityNotFoundException("Settings nicht gefunden für Profil: " + profileId));
        return ResponseEntity.ok(SettingsDtos.SettingsResponse.from(settings));
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Einstellungen aktualisieren (mind. Patient-Rolle erforderlich)")
    @PutMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<SettingsDtos.SettingsResponse> updateSettings(
            @RequestBody SettingsDtos.UpdateSettingsRequest req,
            Authentication auth) {

        String   profileId = ((Profile) auth.getPrincipal()).getId();
        Settings settings  = settingsRepository.findById(profileId)
                .orElseThrow(() -> new EntityNotFoundException("Settings nicht gefunden für Profil: " + profileId));

        // BZ-Zielbereich
        if (req.bzMin() != null)          settings.setBzMin(req.bzMin());
        if (req.bzMax() != null)          settings.setBzMax(req.bzMax());

        // Notfallkontakte und Widget-Konfiguration
        if (req.contacts() != null)       settings.setContacts(req.contacts());
        if (req.widgetConfig() != null)   settings.setWidgetConfig(req.widgetConfig());

        // Insulin-Parameter
        if (req.insulinRatio() != null)      settings.setInsulinRatio(req.insulinRatio());
        if (req.correctionFactor() != null)  settings.setCorrectionFactor(req.correctionFactor());
        if (req.targetBz() != null)          settings.setTargetBz(req.targetBz());

        // Benachrichtigungen
        if (req.notificationsEnabled() != null)
            settings.setNotificationsEnabled(req.notificationsEnabled());
        if (req.dailySummaryEnabled() != null)
            settings.setDailySummaryEnabled(req.dailySummaryEnabled());

        // Nightscout
        if (req.nightscoutUrl() != null)
            settings.setNightscoutUrl(req.nightscoutUrl());
        if (req.nightscoutToken() != null && !req.nightscoutToken().isBlank())
            settings.setNightscoutTokenEnc(encryptionService.encrypt(req.nightscoutToken()));

        // KI-Provider
        if (req.aiProvider() != null)
            settings.setAiProvider(req.aiProvider());

        // API-Keys verschlüsselt speichern
        if (req.claudeApiKey() != null && !req.claudeApiKey().isBlank())
            settings.setClaudeApiKeyEnc(encryptionService.encrypt(req.claudeApiKey()));
        if (req.openaiApiKey() != null && !req.openaiApiKey().isBlank())
            settings.setOpenaiApiKeyEnc(encryptionService.encrypt(req.openaiApiKey()));
        if (req.geminiApiKey() != null && !req.geminiApiKey().isBlank())
            settings.setGeminiApiKeyEnc(encryptionService.encrypt(req.geminiApiKey()));

        // Ketone-Schwellwert
        if (req.ketoneThreshold() != null)
            settings.setKetoneThreshold(req.ketoneThreshold());

        Settings saved = settingsRepository.save(settings);
        return ResponseEntity.ok(SettingsDtos.SettingsResponse.from(saved));
    }
}
