package de.zuckerheld.api.dto;

import java.math.BigDecimal;
import java.util.List;

public class InsightsDtos {

    public record MetricsResponse(
            int periodDays,
            int totalReadings,
            BigDecimal avgBz,
            BigDecimal tirPercent,
            BigDecimal belowPercent,
            BigDecimal abovePercent,
            BigDecimal gmi,
            BigDecimal cvPercent
    ) {}

    public record PatternInsight(
            String id,
            String title,
            String description,
            String severity,
            String timeWindowLabel,
            Integer occurrences
    ) {}

    public record PatternResponse(
            int periodDays,
            List<PatternInsight> insights
    ) {}

    public record DataQualityIssue(
            String id,
            String severity,
            String title,
            String description
    ) {}

    public record DataQualityResponse(
            int periodDays,
            Integer latestGlucoseAgeMinutes,
            Integer latestCgmAgeMinutes,
            int measurementGapCount,
            boolean staleGlucose,
            boolean staleCgm,
            boolean hasRecentGlucose,
            boolean hasCgmSignal,
            List<DataQualityIssue> issues
    ) {}

    public record AdaptiveBolusResponse(
            BigDecimal baselineDose,
            BigDecimal adaptiveDose,
            int adjustmentPercent,
            String note,
            String confidence
    ) {}
}
