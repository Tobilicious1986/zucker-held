package de.zuckerheld.domain.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.zuckerheld.api.dto.AiDtos;
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

    private static final String MEAL_ANALYSIS_SYSTEM_PROMPT =
            "Du bist ein Ernährungsexperte, spezialisiert auf Typ-1-Diabetes und Kohlenhydratmanagement.\n" +
            "Analysiere die beschriebene oder abgebildete Mahlzeit.\n\n" +
            "GRUNDPRINZIP: Arbeite fast immer mit realistischen Standardannahmen und schätze direkt. Rückfragen nur in absoluten Ausnahmefällen.\n\n" +
            "STANDARDANNAHMEN (immer anwenden, nie danach fragen):\n" +
            "- Portionsgröße: normale Erwachsenenportion (z.B. 1 Teller Pasta ~250g, 2 Scheiben Brot, 1 normales Stück Fleisch ~150g)\n" +
            "- Brotsorte: Mischbrot wenn unbekannt\n" +
            "- Zubereitung: einfach (gebraten/gekocht), kein extra Fett wenn nicht erwähnt\n" +
            "- Saucen/Dressings: kleine Menge wenn nicht angegeben\n" +
            "- Getränk: ohne Zucker wenn nicht angegeben\n" +
            "- Bei Fotos: schätze anhand sichtbarer Anhaltspunkte (Teller, Besteck, Hand als Größenreferenz)\n\n" +
            "NUR in diesen seltenen Ausnahmefällen nachfragen (FORMAT A):\n" +
            "- Das Bild ist so unscharf/dunkel dass die Mahlzeit komplett unerkennbar ist\n" +
            "- Es sind mehrere völlig verschiedene Gerichte gleichzeitig sichtbar ohne erkennbaren Zusammenhang\n" +
            "- Die Eingabe ist absolut nichtssagend (z.B. nur \"Essen\")\n\n" +
            "Antworte mit einem JSON-Objekt in einem dieser zwei Formate:\n\n" +
            "FORMAT A – NUR bei absolutem Ausnahmefall:\n" +
            "{\"status\": \"fragen\", \"fragen\": [{\"id\": \"f1\", \"text\": \"Frage\", \"optionen\": [\"Option A\", \"Option B\", \"Option C\"]}], \"kontext\": \"Kurze Erklärung warum du ausnahmsweise fragst\"}\n\n" +
            "FORMAT B – Normalfall (fast immer):\n" +
            "{\"status\": \"komplett\", \"mahlzeit\": \"kurze Beschreibung inkl. getroffener Annahmen\", \"emoji\": \"passendes Emoji\", " +
            "\"zutaten\": [{\"name\": \"Zutat\", \"emoji\": \"🥖\", \"menge\": \"z.B. 2 Scheiben (80g)\", \"gramm\": 80, \"kh\": 32, \"kh_pro_100g\": 40, \"kcal\": 190, \"gi\": 55, \"gi_kategorie\": \"mittel\"}], " +
            "\"gesamt_kh\": 45, \"gesamt_kcal\": 320, \"gesamt_gi_gewichtet\": 52, " +
            "\"insulin_hinweis\": \"Einschätzung zur Insulinabgabe in 1-2 Sätzen\", " +
            "\"gi_erklaerung\": \"Patientenfreundliche GI-Erklärung in 1-2 Sätzen\", " +
            "\"hinweis\": \"Sonstiger kurzer Hinweis, ggf. getroffene Annahmen\"}\n\n" +
            "gi_kategorie ist immer: \"niedrig\" (GI<55), \"mittel\" (GI 55-69), \"hoch\" (GI>=70).\n" +
            "Alle Zahlenwerte als Zahlen ohne Einheiten. Kein Markdown, keine Erklärungen außerhalb des JSON.";

    private static final String CHAT_PROMPT =
            "Du bist ein sicherheitsorientierter Diabetes-Assistent für Familien. " +
            "Antworte auf Deutsch, klar und kurz. Gib keine exakte medizinische Verordnung. " +
            "Bei Notfallhinweisen (sehr niedriger/hoher BZ, schwere Symptome, Ketone erhöht) " +
            "weise klar auf den Notfall-Flow und ärztliche Rücksprache hin.";

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

    public AiDtos.MealAnalysisResponse analyzeMeal(
            String profileId,
            List<AiDtos.MealMessageDto> messages,
            String imageBase64,
            String imageMimeType) {

        Settings settings = settingsRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profil nicht gefunden: " + profileId));

        String provider = settings.getAiProvider() != null ? settings.getAiProvider() : "claude";

        String rawJson = switch (provider.toLowerCase()) {
            case "openai" -> {
                String key = decryptKey(settings.getOpenaiApiKeyEnc(), "OpenAI");
                yield callOpenAIMealAnalysis(key, messages, imageBase64, imageMimeType);
            }
            case "gemini" -> {
                String key = decryptKey(settings.getGeminiApiKeyEnc(), "Gemini");
                yield callGeminiMealAnalysis(key, messages, imageBase64, imageMimeType);
            }
            default -> {
                String key = decryptKey(settings.getClaudeApiKeyEnc(), "Claude");
                yield callClaudeMealAnalysis(key, messages, imageBase64, imageMimeType);
            }
        };

        return new AiDtos.MealAnalysisResponse(rawJson, provider.toLowerCase(), true, null);
    }

    public AiDtos.ChatResponse chat(String profileId, String question, String contextSnippet) {
        Settings settings = settingsRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profil nicht gefunden: " + profileId));

        String provider = settings.getAiProvider() != null ? settings.getAiProvider() : "claude";
        String contextualQuestion = (contextSnippet != null && !contextSnippet.isBlank())
                ? "Kontext aus persönlichen Unterlagen:\n" + contextSnippet + "\n\nFrage:\n" + question
                : question;

        String answer = switch (provider.toLowerCase()) {
            case "openai" -> callOpenAIChat(decryptKey(settings.getOpenaiApiKeyEnc(), "OpenAI"), contextualQuestion);
            case "gemini" -> callGeminiChat(decryptKey(settings.getGeminiApiKeyEnc(), "Gemini"), contextualQuestion);
            default -> callClaudeChat(decryptKey(settings.getClaudeApiKeyEnc(), "Claude"), contextualQuestion);
        };

        return new AiDtos.ChatResponse(
                answer,
                provider.toLowerCase(),
                contextSnippet != null && !contextSnippet.isBlank(),
                true,
                contextSnippet != null && !contextSnippet.isBlank()
                        ? "Persönlicher Kontext"
                        : "Allgemeine Information"
        );
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

    private String callClaudeChat(String apiKey, String prompt) {
        Map<String, Object> requestBody = Map.of(
                "model", "claude-haiku-20240307",
                "max_tokens", 700,
                "system", CHAT_PROMPT,
                "messages", List.of(Map.of("role", "user", "content", prompt))
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
            JsonNode root = objectMapper.readTree(rawResponse);
            return root.path("content").get(0).path("text").asText("Keine Antwort erhalten.");
        } catch (Exception e) {
            throw new RuntimeException("Claude-Chatantwort konnte nicht verarbeitet werden.", e);
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

    private String callOpenAIChat(String apiKey, String prompt) {
        Map<String, Object> requestBody = Map.of(
                "model", "gpt-4o-mini",
                "max_tokens", 700,
                "messages", List.of(
                        Map.of("role", "system", "content", CHAT_PROMPT),
                        Map.of("role", "user", "content", prompt)
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
            JsonNode root = objectMapper.readTree(rawResponse);
            return root.path("choices").get(0).path("message").path("content").asText("Keine Antwort erhalten.");
        } catch (Exception e) {
            throw new RuntimeException("OpenAI-Chatantwort konnte nicht verarbeitet werden.", e);
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

    private String callGeminiChat(String apiKey, String prompt) {
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", CHAT_PROMPT + "\n\n" + prompt))
                ))
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
            JsonNode root = objectMapper.readTree(rawResponse);
            return root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText("Keine Antwort erhalten.");
        } catch (Exception e) {
            throw new RuntimeException("Gemini-Chatantwort konnte nicht verarbeitet werden.", e);
        }
    }

    private String callClaudeMealAnalysis(String apiKey, List<AiDtos.MealMessageDto> messages,
                                          String imageBase64, String imageMimeType) {
        List<Map<String, Object>> anthropicMessages = buildAnthropicMessages(messages, imageBase64, imageMimeType);

        Map<String, Object> requestBody = Map.of(
                "model", "claude-sonnet-4-20250514",
                "max_tokens", 1500,
                "system", MEAL_ANALYSIS_SYSTEM_PROMPT,
                "messages", anthropicMessages
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
                .timeout(Duration.ofSeconds(25))
                .block();

        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            return root.path("content").get(0).path("text").asText();
        } catch (Exception e) {
            throw new RuntimeException("Claude Mahlzeit-Analyse fehlgeschlagen: " + e.getMessage(), e);
        }
    }

    private String callOpenAIMealAnalysis(String apiKey, List<AiDtos.MealMessageDto> messages,
                                          String imageBase64, String imageMimeType) {
        List<Map<String, Object>> openAiMessages = new java.util.ArrayList<>();
        openAiMessages.add(Map.of("role", "system", "content", MEAL_ANALYSIS_SYSTEM_PROMPT));

        for (int i = 0; i < messages.size(); i++) {
            AiDtos.MealMessageDto msg = messages.get(i);
            if (i == 0 && imageBase64 != null && !imageBase64.isBlank()) {
                String mime = imageMimeType != null ? imageMimeType : "image/jpeg";
                openAiMessages.add(Map.of("role", msg.role(), "content", List.of(
                        Map.of("type", "image_url", "image_url", Map.of("url", "data:" + mime + ";base64," + imageBase64)),
                        Map.of("type", "text", "text", msg.content())
                )));
            } else {
                openAiMessages.add(Map.of("role", msg.role(), "content", msg.content()));
            }
        }

        Map<String, Object> requestBody = Map.of(
                "model", "gpt-4o",
                "max_tokens", 1500,
                "messages", openAiMessages
        );

        String rawResponse = webClientBuilder.build()
                .post()
                .uri("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(25))
                .block();

        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            throw new RuntimeException("OpenAI Mahlzeit-Analyse fehlgeschlagen: " + e.getMessage(), e);
        }
    }

    private String callGeminiMealAnalysis(String apiKey,
                                          List<AiDtos.MealMessageDto> messages,
                                          String imageBase64,
                                          String imageMimeType) {
        List<Map<String, Object>> contents = new java.util.ArrayList<>();
        for (int i = 0; i < messages.size(); i++) {
            AiDtos.MealMessageDto msg = messages.get(i);
            List<Map<String, Object>> parts = new java.util.ArrayList<>();
            parts.add(Map.of("text", msg.content()));
            if (i == 0 && imageBase64 != null && !imageBase64.isBlank()) {
                parts.add(Map.of("inline_data", Map.of(
                        "mime_type", imageMimeType != null ? imageMimeType : "image/jpeg",
                        "data", imageBase64
                )));
            }
            contents.add(Map.of(
                    "role", msg.role().equals("assistant") ? "model" : msg.role(),
                    "parts", parts
            ));
        }

        Map<String, Object> systemInstruction = Map.of(
                "parts", List.of(Map.of("text", MEAL_ANALYSIS_SYSTEM_PROMPT))
        );

        Map<String, Object> requestBody = Map.of(
                "contents", contents,
                "systemInstruction", systemInstruction
        );

        String uri = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        String rawResponse = webClientBuilder.build()
                .post()
                .uri(uri)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(25))
                .block();

        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        } catch (Exception e) {
            throw new RuntimeException("Gemini Mahlzeit-Analyse fehlgeschlagen: " + e.getMessage(), e);
        }
    }

    private List<Map<String, Object>> buildAnthropicMessages(
            List<AiDtos.MealMessageDto> messages, String imageBase64, String imageMimeType) {

        List<Map<String, Object>> result = new java.util.ArrayList<>();

        for (int i = 0; i < messages.size(); i++) {
            AiDtos.MealMessageDto msg = messages.get(i);
            if (i == 0 && imageBase64 != null && !imageBase64.isBlank()) {
                String mime = imageMimeType != null ? imageMimeType : "image/jpeg";
                result.add(Map.of("role", msg.role(), "content", List.of(
                        Map.of("type", "image", "source",
                                Map.of("type", "base64", "media_type", mime, "data", imageBase64)),
                        Map.of("type", "text", "text", msg.content())
                )));
            } else {
                result.add(Map.of("role", msg.role(), "content", msg.content()));
            }
        }
        return result;
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
            throw new AiProviderUnavailableException(
                    providerName.toLowerCase(),
                    "Der KI-Chat ist für " + providerName + " noch nicht konfiguriert. Bitte hinterlege zuerst einen API-Schlüssel in den Einstellungen."
            );
        }
        return encryptionService.decrypt(encryptedKey);
    }
}
