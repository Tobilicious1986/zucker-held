package de.zuckerheld.api.dto;

import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.domain.model.MealItem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public class EntryDtos {

    public record CreateEntryRequest(
        @NotBlank String id,          // Client generiert ID (für Offline-Sync)
        @NotBlank String type,        // bz/insulin/meal/activity/ketone
        @NotNull  Long   timestamp,

        // BZ
        Integer bzValue,
        String  bzMeasureTime,

        // Insulin
        BigDecimal insulinUnits,
        String     insulinType,

        // Mahlzeit
        String  mealName,
        Integer mealKh,
        String  mealTime,
        List<MealItemDto> items,

        // Aktivität
        String activityId,
        String activityName,
        String activityEmoji,
        String activityIntensity,
        Integer durationMin,

        // Ketone
        BigDecimal ketoneValue,
        String     ketoneUnit,

        // Gemeinsam
        String note,
        String source
    ) {}

    public record MealItemDto(
        String  name,
        Integer amountG,
        Integer kh
    ) {}

    public record BatchSyncRequest(
        List<CreateEntryRequest> entries
    ) {}

    public record BatchSyncResponse(
        int created,
        int skipped,
        List<String> skippedIds
    ) {}

    public record EntryResponse(
        String id,
        String type,
        long   timestamp,
        OffsetDateTime createdAt,

        // BZ
        Integer bzValue,
        String  bzLevel,
        Boolean bzInTarget,
        String  bzMeasureTime,

        // Insulin
        BigDecimal insulinUnits,
        String     insulinType,

        // Mahlzeit
        String  mealName,
        Integer mealKh,
        String  mealTime,
        List<MealItemResponse> items,

        // Aktivität
        String  activityId,
        String  activityName,
        String  activityEmoji,
        String  activityIntensity,
        Integer durationMin,

        // Ketone
        BigDecimal ketoneValue,
        String     ketoneUnit,

        // Gemeinsam
        String note,
        String source
    ) {
        public static EntryResponse from(Entry e) {
            return new EntryResponse(
                e.getId(),
                e.getType().toString(),
                e.getTimestamp(),
                e.getCreatedAt(),
                e.getBzValue(), e.getBzLevel(), e.getBzInTarget(), e.getBzMeasureTime(),
                e.getInsulinUnits(), e.getInsulinType(),
                e.getMealName(), e.getMealKh(), e.getMealTime(),
                e.getMealItems().stream().map(MealItemResponse::from).toList(),
                e.getActivityId(), e.getActivityName(), e.getActivityEmoji(),
                e.getActivityIntensity(), e.getDurationMin(),
                e.getKetoneValue(), e.getKetoneUnit(),
                e.getNote(), e.getSource()
            );
        }
    }

    public record MealItemResponse(String name, Integer amountG, Integer kh) {
        public static MealItemResponse from(MealItem mi) {
            return new MealItemResponse(mi.getName(), mi.getAmountG(), mi.getKh());
        }
    }
}
