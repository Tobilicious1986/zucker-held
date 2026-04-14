package de.zuckerheld.domain.service.food;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.zuckerheld.domain.model.FoodItem;
import de.zuckerheld.infrastructure.repository.FoodItemRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component
public class FoodCatalogSynchronizer {

    private static final TypeReference<List<CatalogFoodItem>> CATALOG_TYPE = new TypeReference<>() {};
    private static final Map<String, String> LEGACY_ID_ALIASES = Map.of(
            "builtin_roggenbrot", "builtin_roggenmehl",
            "builtin_couscous_gekocht", "builtin_couscous_gek",
            "builtin_kartoffeln_gekocht", "builtin_kartoffel_gek",
            "builtin_kartoffelpueree", "builtin_kartoffelpuree",
            "builtin_pizza_margherita", "builtin_pizza_margh"
    );

    private final FoodItemRepository foodItemRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public FoodCatalogSynchronizer(FoodItemRepository foodItemRepository) {
        this.foodItemRepository = foodItemRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void synchronizeCatalog() {
        List<CatalogFoodItem> catalog = loadCatalog();
        List<FoodItem> builtins = foodItemRepository.findBuiltins();

        Map<String, FoodItem> byId = new HashMap<>();
        Map<String, List<FoodItem>> byNormalizedName = new HashMap<>();
        for (FoodItem food : builtins) {
            byId.put(food.getId(), food);
            byNormalizedName
                    .computeIfAbsent(FoodMetadataHeuristics.normalize(food.getName()), ignored -> new ArrayList<>())
                    .add(food);
        }

        Set<String> matchedIds = new HashSet<>();

        for (CatalogFoodItem item : catalog) {
            FoodItem target = resolveTarget(item, byId, byNormalizedName, matchedIds).orElseGet(FoodItem::new);
            if (target.getId() == null) {
                target.setId(item.id());
            }
            applyCatalogItem(target, item);
            foodItemRepository.save(target);
            matchedIds.add(target.getId());
        }

        for (FoodItem food : builtins) {
            if (!matchedIds.contains(food.getId())) {
                enrichLegacyBuiltin(food);
                foodItemRepository.save(food);
            }
        }
    }

    private Optional<FoodItem> resolveTarget(CatalogFoodItem item,
                                             Map<String, FoodItem> byId,
                                             Map<String, List<FoodItem>> byNormalizedName,
                                             Set<String> matchedIds) {
        FoodItem direct = byId.get(item.id());
        if (direct != null && !matchedIds.contains(direct.getId())) {
            return Optional.of(direct);
        }

        String legacyId = LEGACY_ID_ALIASES.get(item.id());
        if (legacyId != null) {
            FoodItem legacy = byId.get(legacyId);
            if (legacy != null && !matchedIds.contains(legacy.getId())) {
                return Optional.of(legacy);
            }
        }

        LinkedHashSet<String> candidateKeys = new LinkedHashSet<>();
        candidateKeys.add(FoodMetadataHeuristics.normalize(item.name()));
        item.aliases().stream()
                .map(FoodMetadataHeuristics::normalize)
                .filter(alias -> !alias.isBlank())
                .forEach(candidateKeys::add);

        for (String candidate : candidateKeys) {
            List<FoodItem> byExactName = byNormalizedName.get(candidate);
            if (byExactName == null) continue;
            for (FoodItem food : byExactName) {
                if (!matchedIds.contains(food.getId())) {
                    return Optional.of(food);
                }
            }
        }

        for (String candidate : candidateKeys) {
            for (Map.Entry<String, List<FoodItem>> entry : byNormalizedName.entrySet()) {
                if (entry.getKey().contains(candidate) || candidate.contains(entry.getKey())) {
                    for (FoodItem food : entry.getValue()) {
                        if (!matchedIds.contains(food.getId())) {
                            return Optional.of(food);
                        }
                    }
                }
            }
        }

        return Optional.empty();
    }

    private void applyCatalogItem(FoodItem target, CatalogFoodItem item) {
        String category = item.category() == null || item.category().isBlank()
                ? FoodMetadataHeuristics.inferCategory(item.name())
                : item.category();

        target.setProfile(null);
        target.setName(item.name());
        target.setKhPer100g(item.khPer100g());
        target.setCategory(category);
        target.setEmoji(item.emoji() == null || item.emoji().isBlank()
                ? FoodMetadataHeuristics.inferEmoji(category, item.name())
                : item.emoji());
        target.setAliases(mergedAliases(item.aliases(), item.name()));
        target.setPortionPresets(item.portionPresets().isEmpty()
                ? FoodMetadataHeuristics.defaultPortionPresets(category, item.name())
                : item.portionPresets());
        target.setSource(item.source() == null || item.source().isBlank() ? "builtin" : item.source());
        target.setExternalSource(null);
        target.setBarcode(null);
    }

    private void enrichLegacyBuiltin(FoodItem food) {
        String category = food.getCategory();
        if (category == null || category.isBlank()) {
            category = FoodMetadataHeuristics.inferCategory(food.getName());
            food.setCategory(category);
        }

        if (food.getEmoji() == null || food.getEmoji().isBlank()) {
            food.setEmoji(FoodMetadataHeuristics.inferEmoji(category, food.getName()));
        }

        if (food.getAliases() == null || food.getAliases().isEmpty()) {
            food.setAliases(FoodMetadataHeuristics.defaultAliases(food.getName()));
        }

        if (food.getPortionPresets() == null || food.getPortionPresets().isEmpty()) {
            food.setPortionPresets(FoodMetadataHeuristics.defaultPortionPresets(category, food.getName()));
        }

        if (food.getSource() == null || food.getSource().isBlank()) {
            food.setSource("builtin");
        }
    }

    private List<String> mergedAliases(List<String> aliases, String name) {
        LinkedHashSet<String> merged = new LinkedHashSet<>();
        if (aliases != null) {
            aliases.stream()
                    .filter(alias -> alias != null && !alias.isBlank())
                    .map(alias -> alias.toLowerCase(Locale.ROOT).trim())
                    .forEach(merged::add);
        }
        FoodMetadataHeuristics.defaultAliases(name).forEach(merged::add);
        return new ArrayList<>(merged);
    }

    private List<CatalogFoodItem> loadCatalog() {
        try (InputStream inputStream = new ClassPathResource("data/foods-catalog.json").getInputStream()) {
            return objectMapper.readValue(inputStream, CATALOG_TYPE);
        } catch (Exception e) {
            throw new IllegalStateException("Konnte foods-catalog.json nicht laden.", e);
        }
    }

    private record CatalogFoodItem(
            String id,
            String name,
            List<String> aliases,
            String category,
            BigDecimal khPer100g,
            String emoji,
            List<Integer> portionPresets,
            String source
    ) {
        private CatalogFoodItem {
            aliases = aliases == null ? List.of() : List.copyOf(aliases);
            portionPresets = portionPresets == null ? List.of() : List.copyOf(portionPresets);
        }
    }
}
