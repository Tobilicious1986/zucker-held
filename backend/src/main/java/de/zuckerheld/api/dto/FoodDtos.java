package de.zuckerheld.api.dto;

import de.zuckerheld.domain.model.FoodItem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public class FoodDtos {

    public record CreateFoodRequest(
        @NotBlank String id,          // Client generiert ID
        @NotBlank String name,
        @NotNull  BigDecimal khPer100g,
        String emoji,
        String barcode,
        String category,
        List<String> aliases,
        List<Integer> portionPresets
    ) {}

    public record FoodResponse(
        String id,
        String name,
        BigDecimal khPer100g,
        String emoji,
        String source,
        String barcode,
        String category,
        List<String> aliases,
        List<Integer> portionPresets,
        String externalSource
    ) {
        public static FoodResponse from(FoodItem f) {
            return new FoodResponse(
                f.getId(), f.getName(), f.getKhPer100g(),
                f.getEmoji(), f.getSource(), f.getBarcode(),
                f.getCategory(), FoodDtos.safeList(f.getAliases()),
                FoodDtos.safeIntList(f.getPortionPresets()), f.getExternalSource()
            );
        }

        public static FoodResponse online(
                String id,
                String name,
                BigDecimal khPer100g,
                String emoji,
                String barcode,
                String category,
                List<String> aliases,
                List<Integer> portionPresets,
                String externalSource
        ) {
            return new FoodResponse(
                id, name, khPer100g, emoji, "online", barcode,
                category, FoodDtos.safeList(aliases), FoodDtos.safeIntList(portionPresets), externalSource
            );
        }
    }

    public record AiEstimateRequest(
        @NotBlank String description
    ) {}

    public record AiEstimateResponse(
        int    khMin,
        int    khMax,
        int    khMid,
        String note
    ) {}

    private static List<String> safeList(List<String> values) {
        return values == null ? List.of() : List.copyOf(values);
    }

    private static List<Integer> safeIntList(List<Integer> values) {
        return values == null ? List.of() : List.copyOf(values);
    }
}
