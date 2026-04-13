package de.zuckerheld.domain.service;

import de.zuckerheld.api.dto.InsightsDtos;
import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.domain.model.Settings;
import de.zuckerheld.infrastructure.repository.EntryRepository;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class InsulinSupportService {

    private final SettingsRepository settingsRepository;
    private final EntryRepository entryRepository;

    public InsulinSupportService(SettingsRepository settingsRepository,
                                 EntryRepository entryRepository) {
        this.settingsRepository = settingsRepository;
        this.entryRepository = entryRepository;
    }

    @Transactional(readOnly = true)
    public InsightsDtos.AdaptiveBolusResponse adaptiveSuggestion(String profileId, int currentBz, int kh) {
        Settings settings = settingsRepository.findById(profileId)
                .orElseThrow(() -> new EntityNotFoundException("Settings nicht gefunden: " + profileId));

        BigDecimal baseline = calculateDose(
                currentBz,
                settings.getTargetBz() != null ? settings.getTargetBz() : 120,
                kh,
                settings.getInsulinRatio() != null ? settings.getInsulinRatio() : 10,
                settings.getCorrectionFactor() != null ? settings.getCorrectionFactor() : 30
        );

        if (Boolean.FALSE.equals(settings.getAdaptiveBolusEnabled())) {
            return new InsightsDtos.AdaptiveBolusResponse(
                    baseline,
                    baseline,
                    0,
                    "Adaptiver Modus ist deaktiviert. Es wird die Standarddosis gezeigt.",
                    "low"
            );
        }

        long now = Instant.now().toEpochMilli();
        long from = Instant.now().minus(14, ChronoUnit.DAYS).toEpochMilli();
        List<Entry> history = entryRepository.findByProfileAndTimeRange(profileId, from, now);

        int highAfterMeal = 0;
        int lowAfterMeal = 0;
        for (Entry meal : history) {
            if (meal.getType() != Entry.EntryType.MEAL) continue;
            long end = meal.getTimestamp() + (4 * 60 * 60 * 1000L);
            Integer followUp = history.stream()
                    .filter(e -> e.getType() == Entry.EntryType.BZ && e.getBzValue() != null)
                    .filter(e -> e.getTimestamp() >= meal.getTimestamp() + (2 * 60 * 60 * 1000L))
                    .filter(e -> e.getTimestamp() <= end)
                    .map(Entry::getBzValue)
                    .findFirst()
                    .orElse(null);
            if (followUp == null) continue;
            if (followUp > 200) highAfterMeal++;
            if (followUp < 80) lowAfterMeal++;
        }

        int adjustmentPercent = 0;
        String confidence = "low";
        String note = "Keine klare Historie für eine adaptive Korrektur gefunden.";

        if (highAfterMeal >= 3 && highAfterMeal > lowAfterMeal) {
            adjustmentPercent = 10;
            confidence = highAfterMeal >= 5 ? "medium" : "low";
            note = "Mehrfach erhöhte Nachmahlzeit-Werte erkannt. Vorsichtige Erhöhung als Hinweis.";
        } else if (lowAfterMeal >= 2 && lowAfterMeal >= highAfterMeal) {
            adjustmentPercent = -10;
            confidence = lowAfterMeal >= 4 ? "medium" : "low";
            note = "Mehrfach niedrige Nachmahlzeit-Werte erkannt. Vorsichtige Reduktion als Hinweis.";
        }

        BigDecimal adaptive = baseline
                .multiply(BigDecimal.valueOf(1 + (adjustmentPercent / 100.0)))
                .setScale(1, RoundingMode.HALF_UP);
        adaptive = roundToHalf(adaptive);

        return new InsightsDtos.AdaptiveBolusResponse(
                baseline,
                adaptive,
                adjustmentPercent,
                note,
                confidence
        );
    }

    private BigDecimal calculateDose(int currentBz, int targetBz, int kh, int ratio, int correction) {
        double mealDose = kh / (double) Math.max(1, ratio);
        int diff = currentBz - targetBz;
        double correctionDose = Math.abs(diff) > 30 ? diff / (double) Math.max(1, correction) : 0;
        return roundToHalf(BigDecimal.valueOf(Math.max(0, mealDose + correctionDose)));
    }

    private BigDecimal roundToHalf(BigDecimal value) {
        return value.multiply(BigDecimal.valueOf(2))
                .setScale(0, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(2), 1, RoundingMode.HALF_UP);
    }
}
