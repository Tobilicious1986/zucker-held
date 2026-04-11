package de.zuckerheld.domain.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.zuckerheld.api.dto.FoodDtos;
import de.zuckerheld.domain.model.Settings;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import de.zuckerheld.infrastructure.security.EncryptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Proxy-Service für KI-gestützte KH-Schätzungen.
 * Unterstützt Claude (Anthropic), OpenAI GPT und Google Gemini.
 * Der API-Key wird aus den verschlüsselten Settings geladen.
 */
@Service
public class AiProxyService {

    private static final Logger log = LoggerFactory.getLogger(AiProxyService.class);
    private static final Duration TIMEOUT = Duration.ofSeconds(15);

    private static final String SYSTEM_PROMPT =
            "Du bist ein Diabetes-Ernährungsassistent. Schätze die Kohlenhydrate " +
            "der beschriebenen Mahlzeit. Antworte NUR mit validem JSON: " +
            "{\"khMin\": <int>, \"khMax\": <int>, \"khMid\": <int>, \"note\": \"<kurze Erklärung auf Deutsch>\"}. " +
            "Keine weiteren Texte oder Erklärungen außerhalb des JSON.";

    private final WebClient.Builder   webClientBuilder;
    private final SettingsRepository  settingsRepository;
    private final EncryptionService   encryptionService;
    private final ObjectMapper        objectMapper;

    public AiProxyService(WebClient.Builder webClientBuilder,
                          SettingsRepository settingsRepository,
                          EncryptionService encryptionService) {
        this.webClientBuilder  = webClientBuilder;
        this.settingsRepository = settingsRepository;
        this.encryptionService  = encryptionService;
        this.objectMapper       = new ObjectMapper();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Öffentliche API
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Schätzt Kohlenhydrate basierend auf einer Mahlzeit-Beschreibung.
     * Provider wird aus den Profil-Settings gelesen.
     */
    public FoodDtos.AiEstimateResponse estimateKH(String profileId, String description) {
        Settings settings = settingsRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profil nicht gefunden: " + profileId));

        String provider = settings.getAiProvider() != null ? settings.getAiProvider() : "claude";

        return switch (provider.toLowerCase()) {
            case "openai"  -> {
                String key = decryptKey(settings.getOpenaiApiKeyEnc(), "OpenAI");
                yield callOpenAI(key, description);
            }
            case "gemini"  -> {
                String key = decryptKey(settings.getGeminiApiKeyEnc(), "Gemini");
                yield callGemini(key, description);
            }
            default -> {
                // claude ist Standard
                String key = decryptKey(settings.getClaudeApiKeyEnc(), "Claude");
                yield callClaude(key, description);
            }
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Provider-Implementierungen
    // ═══════════════════════════════════════════════════════════════════════

    private FoodDtos.AiEstimateResponse callClaude(String apiKey, String description) {
        log.debug("KH-Schätzung via Claude Haiku für: {}", description);

        Map<String, Object> requestBody = Map.of(
                "model", "claude-haiku-20240307",
                "max_tokens", 256,
                "system", SYSTEM_PROMPT,
                "messages", List.of(
                        Map.of("role", "user", "content",
                                "Mahlzeit: " + description)
                )
        );

        String rawResponse = webClientBuilder.build()
                .post()
                .uri("https://api.anthropic.com/v1/messages")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(TIMEOUT)
                .block();

        try {
            JsonNode root    = objectMapper.readTree(rawResponse);
            String   content = root.path("content").get(0).path("text").asText();
            return parseKhResponse(content);
        } catch (Exception e) {
            throw new RuntimeException("Claude-Antwort konnte nicht verarbeitet werden: " + e.getMessage(), e);
        }
    }

    private FoodDtos.AiEstimateResponse callOpenAI(String apiKey, String description) {
        log.debug("KH-Schätzung via OpenAI GPT-4o-mini für: {}", description);

        Map<String, Object> requestBody = Map.of(
                "model", "gpt-4o-mini",
                "max_tokens", 256,
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user",   "content", "Mahlzeit: " + description)
                )
        );

        String rawResponse = webClientBuilder.build()
                .post()
                .uri("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(TIMEOUT)
                .block();

        try {
            JsonNode root    = objectMapper.readTree(rawResponse);
            String   content = root.path("choices").get(0).path("message").path("content").asText();
            return parseKhResponse(content);
        } catch (Exception e) {
            throw new RuntimeException("OpenAI-Antwort konnte nicht verarbeitet werden: " + e.getMessage(), e);
        }
    }

    private FoodDtos.AiEstimateResponse callGemini(String apiKey, String description) {
        log.debug("KH-Schätzung via Gemini 1.5 Flash für: {}", description);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", SYSTEM_PROMPT + "\n\nMahlzeit: " + description)
                        ))
                )
        );

        String uri = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        String rawResponse = webClientBuilder.build()
                .post()
                .uri(uri)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(TIMEOUT)
                .block();

        try {
            JsonNode root    = objectMapper.readTree(rawResponse);
            String   content = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();
            return parseKhResponse(content);
        } catch (Exception e) {
            throw new RuntimeException("Gemini-Antwort konnte nicht verarbeitet werden: " + e.getMessage(), e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Hilfsmethoden
    // ═══════════════════════════════════════════════════════════════════════

    private FoodDtos.AiEstimateResponse parseKhResponse(String jsonText) {
        // Extrahiere JSON aus der Antwort (KI gibt manchmal Markdown-Blöcke zurück)
        String cleaned = jsonText.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("```(?:json)?", "").trim();
        }
        try {
            JsonNode node = objectMapper.readTree(cleaned);
            return new FoodDtos.AiEstimateResponse(
                    node.path("khMin").asInt(),
                    node.path("khMax").asInt(),
                    node.path("khMid").asInt(),
                    node.path("note").asText("Keine Anmerkung")
            );
        } catch (JsonProcessingException e) {
            throw new RuntimeException("KI-Antwort ist kein gültiges JSON: " + jsonText, e);
        }
    }

    private String decryptKey(String encryptedKey, String providerName) {
        if (encryptedKey == null || encryptedKey.isBlank()) {
            throw new RuntimeException(providerName + "-API-Key ist nicht konfiguriert. " +
                    "Bitte in den Einstellungen hinterlegen.");
        }
        return encryptionService.decrypt(encryptedKey);
    }
}
