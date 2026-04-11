package de.zuckerheld.api.dto;

import de.zuckerheld.domain.model.FoodItem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class FoodDtos {

    public record CreateFoodRequest(
        @NotBlank String id,          // Client generiert ID
        @NotBlank String name,
        @NotNull  BigDecimal khPer100g,
        String emoji,
        String barcode
    ) {}

    public record FoodResponse(
        String id,
        String name,
        BigDecimal khPer100g,
        String emoji,
        String source,
        String barcode
    ) {
        public static FoodResponse from(FoodItem f) {
            return new FoodResponse(
                f.getId(), f.getName(), f.getKhPer100g(),
                f.getEmoji(), f.getSource(), f.getBarcode()
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
}
