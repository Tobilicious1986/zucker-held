package de.zuckerheld.domain.service.food;

import de.zuckerheld.api.dto.FoodDtos;
import de.zuckerheld.domain.model.FoodItem;
import de.zuckerheld.infrastructure.repository.FoodItemRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
public class FoodSearchService {

    private final FoodItemRepository foodItemRepository;
    private final List<ExternalFoodProvider> externalFoodProviders;

    public FoodSearchService(FoodItemRepository foodItemRepository,
                             List<ExternalFoodProvider> externalFoodProviders) {
        this.foodItemRepository = foodItemRepository;
        this.externalFoodProviders = externalFoodProviders;
    }

    public List<FoodDtos.FoodResponse> searchFoods(String profileId, String query, String source) {
        List<FoodItem> foods = foodItemRepository.findAvailableForProfile(profileId).stream()
                .filter(food -> source == null || source.isBlank() || source.equalsIgnoreCase(food.getSource()))
                .toList();

        if (query == null || query.isBlank()) {
            return dedupe(
                    foods.stream()
                            .sorted(Comparator
                                    .comparingInt(this::defaultSourceRank)
                                    .thenComparing(FoodItem::getName, String.CASE_INSENSITIVE_ORDER))
                            .map(FoodDtos.FoodResponse::from)
                            .toList()
            );
        }

        String normalizedQuery = FoodMetadataHeuristics.normalize(query);
        List<ScoredFood> scoredFoods = foods.stream()
                .map(food -> new ScoredFood(food, score(food, normalizedQuery)))
                .filter(scored -> scored.score() > 0)
                .sorted(Comparator
                        .comparingInt(ScoredFood::score).reversed()
                        .thenComparingInt(scored -> sourcePriority(scored.food().getSource()))
                        .thenComparing(scored -> scored.food().getName(), String.CASE_INSENSITIVE_ORDER))
                .toList();

        return dedupe(scoredFoods.stream()
                .map(ScoredFood::food)
                .map(FoodDtos.FoodResponse::from)
                .toList());
    }

    public List<FoodDtos.FoodResponse> searchOnline(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        LinkedHashMap<String, FoodDtos.FoodResponse> deduped = new LinkedHashMap<>();
        for (ExternalFoodProvider provider : externalFoodProviders) {
            for (FoodDtos.FoodResponse result : provider.search(query)) {
                deduped.putIfAbsent(dedupeKey(result), result);
            }
        }
        return new ArrayList<>(deduped.values());
    }

    public Optional<FoodDtos.FoodResponse> findByBarcode(String profileId, String code) {
        String normalizedCode = normalizeBarcode(code);
        if (normalizedCode.isBlank()) {
            return Optional.empty();
        }

        Optional<FoodDtos.FoodResponse> localMatch = foodItemRepository
                .findAvailableByBarcode(profileId, normalizedCode)
                .map(FoodDtos.FoodResponse::from);
        if (localMatch.isPresent()) {
            return localMatch;
        }

        for (ExternalFoodProvider provider : externalFoodProviders) {
            Optional<FoodDtos.FoodResponse> result = provider.findByBarcode(normalizedCode);
            if (result.isPresent()) {
                return result;
            }
        }

        return Optional.empty();
    }

    private List<FoodDtos.FoodResponse> dedupe(List<FoodDtos.FoodResponse> foods) {
        Map<String, FoodDtos.FoodResponse> deduped = new LinkedHashMap<>();
        for (FoodDtos.FoodResponse food : foods) {
            deduped.putIfAbsent(dedupeKey(food), food);
        }
        return new ArrayList<>(deduped.values());
    }

    private String dedupeKey(FoodDtos.FoodResponse food) {
        return FoodMetadataHeuristics.normalize(food.name()) + "|" + food.source();
    }

    private int defaultSourceRank(FoodItem food) {
        return sourcePriority(food.getSource());
    }

    private int sourcePriority(String source) {
        return switch (source == null ? "" : source.toLowerCase(Locale.ROOT)) {
            case "builtin" -> 0;
            case "custom" -> 1;
            default -> 2;
        };
    }

    private int score(FoodItem food, String normalizedQuery) {
        String normalizedName = FoodMetadataHeuristics.normalize(food.getName());
        List<String> aliases = food.getAliases() == null ? List.of() : food.getAliases();
        String normalizedCategory = FoodMetadataHeuristics.normalize(food.getCategory());
        List<String> tokens = List.of(normalizedQuery.split(" "));

        int score = 0;
        if (Objects.equals(normalizedName, normalizedQuery)) score += 220;
        if (normalizedName.startsWith(normalizedQuery)) score += 160;
        if (normalizedName.contains(normalizedQuery)) score += 120;

        for (String alias : aliases) {
            String normalizedAlias = FoodMetadataHeuristics.normalize(alias);
            if (normalizedAlias.equals(normalizedQuery)) score += 210;
            if (normalizedAlias.startsWith(normalizedQuery)) score += 150;
            if (normalizedAlias.contains(normalizedQuery)) score += 110;
        }

        for (String token : tokens) {
            if (token.isBlank()) continue;
            if (normalizedName.contains(token)) score += 20;
            if (normalizedCategory.contains(token)) score += 8;
            for (String alias : aliases) {
                if (FoodMetadataHeuristics.normalize(alias).contains(token)) {
                    score += 16;
                }
            }
        }

        if ("custom".equalsIgnoreCase(food.getSource())) {
            score += 4;
        }

        return score;
    }

    private String normalizeBarcode(String code) {
        if (code == null) {
            return "";
        }
        return code.replaceAll("[^0-9]", "").trim();
    }

    private record ScoredFood(FoodItem food, int score) {}
}
