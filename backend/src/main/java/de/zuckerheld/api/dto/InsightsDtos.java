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
            String severity
    ) {}

    public record PatternResponse(
            int periodDays,
            List<PatternInsight> insights
    ) {}

    public record AdaptiveBolusResponse(
            BigDecimal baselineDose,
            BigDecimal adaptiveDose,
            int adjustmentPercent,
            String note,
            String confidence
    ) {}
}
