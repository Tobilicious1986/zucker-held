package de.zuckerheld.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import de.zuckerheld.api.dto.FoodDtos;
import de.zuckerheld.domain.model.FoodItem;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.infrastructure.repository.FoodItemRepository;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Lebensmittel-Datenbank: builtin + custom + Open Food Facts Proxy.
 */
@RestController
@RequestMapping("/api/v1/foods")
@Tag(name = "Foods", description = "Lebensmittel-Datenbank und KH-Suche")
public class FoodController {

    private static final Duration OPENFOODFACTS_TIMEOUT = Duration.ofSeconds(10);
    private static final String   OFF_BASE_URL          = "https://world.openfoodfacts.org";

    private final FoodItemRepository foodItemRepository;
    private final ProfileRepository  profileRepository;
    private final WebClient.Builder  webClientBuilder;

    public FoodController(FoodItemRepository foodItemRepository,
                          ProfileRepository profileRepository,
                          WebClient.Builder webClientBuilder) {
        this.foodItemRepository = foodItemRepository;
        this.profileRepository  = profileRepository;
        this.webClientBuilder   = webClientBuilder;
    }

    // ═══════════════════════════════════════════════════════════════════════

    @Operation(summary = "Lebensmittel suchen (builtin + eigene custom Foods)")
    @GetMapping
    public List<FoodDtos.FoodResponse> searchFoods(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String source,
            Authentication auth) {

        String profileId = ((Profile) auth.getPrincipal()).getId();

        List<FoodItem> foods = (q != null && !q.isBlank())
                ? foodItemRepository.searchByName(profileId, q)
                : foodItemRepository.findAvailableForProfile(profileId);

        return foods.stream()
                .filter(f -> source == null || source.isBlank() || source.equals(f.getSource()))
                .map(FoodDtos.FoodResponse::from)
                .toList();
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Eigenes Lebensmittel hinzufügen")
    @PostMapping
    public ResponseEntity<FoodDtos.FoodResponse> createFood(
            @Valid @RequestBody FoodDtos.CreateFoodRequest req,
            Authentication auth) {

        String  profileId = ((Profile) auth.getPrincipal()).getId();
        Profile profile   = profileRepository.findById(profileId)
                .orElseThrow(() -> new EntityNotFoundException("Profil nicht gefunden: " + profileId));

        FoodItem food = new FoodItem();
        food.setId(req.id());
        food.setProfile(profile);
        food.setName(req.name());
        food.setKhPer100g(req.khPer100g());
        food.setEmoji(req.emoji());
        food.setBarcode(req.barcode());
        food.setSource("custom");

        FoodItem saved = foodItemRepository.save(food);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(FoodDtos.FoodResponse.from(saved));
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Eigenes Lebensmittel löschen (nur eigene custom Foods)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFood(@PathVariable String id, Authentication auth) {
        String   profileId = ((Profile) auth.getPrincipal()).getId();
        FoodItem food      = foodItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lebensmittel nicht gefunden: " + id));

        if (food.getProfile() == null || !food.getProfile().getId().equals(profileId)) {
            throw new AccessDeniedException("Du kannst nur eigene Lebensmittel löschen.");
        }

        foodItemRepository.delete(food);
        return ResponseEntity.noContent().build();
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Open Food Facts Proxy: Online-Suche nach Lebensmitteln")
    @GetMapping("/search-online")
    public List<FoodDtos.FoodResponse> searchOnline(@RequestParam String q) {
        if (q == null || q.isBlank()) return List.of();

        try {
            String url = OFF_BASE_URL + "/cgi/search.pl?search_terms=" +
                    q + "&json=true&fields=id,product_name,nutriments,image_url&page_size=20";

            JsonNode response = webClientBuilder.build()
                    .get()
                    .uri(url)
                    .header("User-Agent", "ZuckerHeld/1.0 (contact@zuckerheld.de)")
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(OPENFOODFACTS_TIMEOUT)
                    .block();

            if (response == null || !response.has("products")) return List.of();

            List<FoodDtos.FoodResponse> results = new ArrayList<>();
            for (JsonNode product : response.get("products")) {
                FoodDtos.FoodResponse foodResponse = parseOffProduct(product);
                if (foodResponse != null) results.add(foodResponse);
            }
            return results;

        } catch (Exception e) {
            throw new RuntimeException("Open Food Facts Suche fehlgeschlagen: " + e.getMessage(), e);
        }
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Lebensmittel per Barcode suchen")
    @GetMapping("/barcode/{code}")
    public ResponseEntity<FoodDtos.FoodResponse> findByBarcode(@PathVariable String code) {
        // Zuerst lokale DB durchsuchen
        return foodItemRepository.findByBarcode(code)
                .map(f -> ResponseEntity.ok(FoodDtos.FoodResponse.from(f)))
                .orElseGet(() -> fetchFromOffByBarcode(code));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Hilfsmethoden
    // ═══════════════════════════════════════════════════════════════════════

    private ResponseEntity<FoodDtos.FoodResponse> fetchFromOffByBarcode(String barcode) {
        try {
            String url = OFF_BASE_URL + "/api/v0/product/" + barcode + ".json";

            JsonNode response = webClientBuilder.build()
                    .get()
                    .uri(url)
                    .header("User-Agent", "ZuckerHeld/1.0 (contact@zuckerheld.de)")
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(OPENFOODFACTS_TIMEOUT)
                    .block();

            if (response == null || response.path("status").asInt(0) != 1) {
                return ResponseEntity.notFound().build();
            }

            FoodDtos.FoodResponse foodResponse = parseOffProduct(response.path("product"));
            if (foodResponse == null) return ResponseEntity.notFound().build();

            return ResponseEntity.ok(foodResponse);

        } catch (Exception e) {
            throw new RuntimeException("Open Food Facts Barcode-Suche fehlgeschlagen: " + e.getMessage(), e);
        }
    }

    private FoodDtos.FoodResponse parseOffProduct(JsonNode product) {
        if (product == null || product.isMissingNode()) return null;

        String name = product.path("product_name").asText("");
        if (name.isBlank()) return null;

        JsonNode nutriments = product.path("nutriments");
        double khRaw = nutriments.path("carbohydrates_100g").asDouble(-1);
        if (khRaw < 0) return null;

        BigDecimal khPer100g = BigDecimal.valueOf(khRaw);
        String     id        = "off_" + product.path("id").asText(product.path("_id").asText("unknown"));
        String     barcode   = product.path("id").asText(product.path("_id").asText(null));

        return new FoodDtos.FoodResponse(id, name, khPer100g, null, "online", barcode);
    }
}
