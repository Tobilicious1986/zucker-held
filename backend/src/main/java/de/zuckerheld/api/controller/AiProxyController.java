package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.FoodDtos;
import de.zuckerheld.api.dto.AiDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.AiProviderUnavailableException;
import de.zuckerheld.domain.service.AiProxyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * KI-Proxy: Leitet KH-Schätzungsanfragen an den konfigurierten KI-Provider weiter.
 */
@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "AI", description = "KI-gestützte Kohlenhydrat-Schätzung")
public class AiProxyController {

    private final AiProxyService aiProxyService;

    public AiProxyController(AiProxyService aiProxyService) {
        this.aiProxyService = aiProxyService;
    }

    // ═══════════════════════════════════════════════════════════════════════

    @Operation(summary = "KH-Gehalt einer Mahlzeit per KI schätzen lassen")
    @PostMapping("/estimate-kh")
    public ResponseEntity<FoodDtos.AiEstimateResponse> estimateKH(
            @Valid @RequestBody FoodDtos.AiEstimateRequest req,
            Authentication auth) {

        String profileId = ((Profile) auth.getPrincipal()).getId();
        FoodDtos.AiEstimateResponse response = aiProxyService.estimateKH(profileId, req.description());

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Allgemeine Diabetes-Frage an den KI-Assistenten")
    @PostMapping("/chat")
    public ResponseEntity<AiDtos.ChatResponse> chat(
            @Valid @RequestBody AiDtos.ChatRequest req,
            Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        try {
            AiDtos.ChatResponse response = aiProxyService.chat(profileId, req.question(), req.contextSnippet());
            return ResponseEntity.ok(response);
        } catch (AiProviderUnavailableException ex) {
            return ResponseEntity.ok(new AiDtos.ChatResponse(
                    ex.getUserMessage(),
                    ex.getProvider(),
                    req.contextSnippet() != null && !req.contextSnippet().isBlank(),
                    false,
                    req.contextSnippet() != null && !req.contextSnippet().isBlank()
                            ? "Persönlicher Kontext"
                            : "Allgemeine Information"
            ));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new AiDtos.ChatResponse(
                    "Der KI-Chat ist aktuell vorübergehend nicht verfügbar. Bitte versuche es später erneut.",
                    "unavailable",
                    req.contextSnippet() != null && !req.contextSnippet().isBlank(),
                    false,
                    req.contextSnippet() != null && !req.contextSnippet().isBlank()
                            ? "Persönlicher Kontext"
                            : "Allgemeine Information"
            ));
        }
    }
}
