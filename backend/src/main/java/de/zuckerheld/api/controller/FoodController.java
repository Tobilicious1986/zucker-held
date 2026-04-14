package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.FoodDtos;
import de.zuckerheld.domain.model.FoodItem;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.food.FoodSearchService;
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

import java.util.List;

/**
 * Lebensmittel-Datenbank: builtin + custom + Open Food Facts Proxy.
 */
@RestController
@RequestMapping("/api/v1/foods")
@Tag(name = "Foods", description = "Lebensmittel-Datenbank und KH-Suche")
public class FoodController {

    private final FoodItemRepository foodItemRepository;
    private final ProfileRepository  profileRepository;
    private final FoodSearchService  foodSearchService;

    public FoodController(FoodItemRepository foodItemRepository,
                          ProfileRepository profileRepository,
                          FoodSearchService foodSearchService) {
        this.foodItemRepository = foodItemRepository;
        this.profileRepository  = profileRepository;
        this.foodSearchService  = foodSearchService;
    }

    // ═══════════════════════════════════════════════════════════════════════

    @Operation(summary = "Lebensmittel suchen (builtin + eigene custom Foods)")
    @GetMapping
    public List<FoodDtos.FoodResponse> searchFoods(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String source,
            Authentication auth) {

        String profileId = ((Profile) auth.getPrincipal()).getId();
        return foodSearchService.searchFoods(profileId, q, source);
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
        food.setCategory(req.category());
        food.setAliases(req.aliases());
        food.setPortionPresets(req.portionPresets());
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
        return foodSearchService.searchOnline(q);
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Lebensmittel per Barcode suchen")
    @GetMapping("/barcode/{code}")
    public ResponseEntity<FoodDtos.FoodResponse> findByBarcode(@PathVariable String code, Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        return foodSearchService.findByBarcode(profileId, code)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
