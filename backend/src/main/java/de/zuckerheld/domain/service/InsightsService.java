package de.zuckerheld.domain.service;

import de.zuckerheld.api.dto.InsightsDtos;
import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.infrastructure.repository.EntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class InsightsService {

    private final EntryRepository entryRepository;

    public InsightsService(EntryRepository entryRepository) {
        this.entryRepository = entryRepository;
    }

    @Transactional(readOnly = true)
    public InsightsDtos.MetricsResponse computeMetrics(String profileId, int days) {
        long to = Instant.now().toEpochMilli();
        long from = Instant.now().minus(days, ChronoUnit.DAYS).toEpochMilli();
        List<Entry> entries = entryRepository.findByProfileAndTimeRange(profileId, from, to);
        List<Integer> bzValues = entries.stream()
                .filter(e -> e.getType() == Entry.EntryType.BZ && e.getBzValue() != null)
                .map(Entry::getBzValue)
                .toList();

        int total = bzValues.size();
        if (total == 0) {
            return new InsightsDtos.MetricsResponse(
                    days, 0, dec(0), dec(0), dec(0), dec(0), dec(0), dec(0)
            );
        }

        long inRange = bzValues.stream().filter(v -> v >= 70 && v <= 180).count();
        long below = bzValues.stream().filter(v -> v < 70).count();
        long above = bzValues.stream().filter(v -> v > 180).count();

        double mean = bzValues.stream().mapToInt(Integer::intValue).average().orElse(0);
        double variance = bzValues.stream()
                .mapToDouble(v -> Math.pow(v - mean, 2))
                .average()
                .orElse(0);
        double sd = Math.sqrt(variance);
        double cv = mean > 0 ? (sd / mean) * 100 : 0;
        double gmi = 3.31 + 0.02392 * mean;

        return new InsightsDtos.MetricsResponse(
                days,
                total,
                dec(mean),
                dec((inRange * 100.0) / total),
                dec((below * 100.0) / total),
                dec((above * 100.0) / total),
                dec(gmi),
                dec(cv)
        );
    }

    @Transactional(readOnly = true)
    public InsightsDtos.PatternResponse detectPatterns(String profileId, int days) {
        long to = Instant.now().toEpochMilli();
        long from = Instant.now().minus(days, ChronoUnit.DAYS).toEpochMilli();
        List<Entry> entries = entryRepository.findByProfileAndTimeRange(profileId, from, to).stream()
                .sorted(Comparator.comparingLong(Entry::getTimestamp))
                .toList();

        List<InsightsDtos.PatternInsight> results = new ArrayList<>();
        int breakfastHigh = countBreakfastHigh(entries);
        int activityLow = countActivityLow(entries);
        int nightHigh = countNightHigh(entries);
        int longGaps = countLongBzGaps(entries, 8 * 60L);

        if (breakfastHigh >= 3) {
            results.add(new InsightsDtos.PatternInsight(
                    "breakfast_high",
                    "Erhöhte Werte nach Frühstück",
                    "In den letzten " + days + " Tagen gab es " + breakfastHigh + " erhöhte Werte nach Frühstück.",
                    "medium"
            ));
        }
        if (activityLow >= 2) {
            results.add(new InsightsDtos.PatternInsight(
                    "activity_low",
                    "Niedrige Werte nach Aktivität",
                    "Es wurden " + activityLow + " mögliche Unterzucker-Muster nach Aktivität erkannt.",
                    "high"
            ));
        }
        if (nightHigh >= 3) {
            results.add(new InsightsDtos.PatternInsight(
                    "night_high",
                    "Nächtlich erhöhte BZ-Werte",
                    "Mehrfach erhöhte Nachtwerte (" + nightHigh + " Treffer) wurden erkannt.",
                    "medium"
            ));
        }
        if (longGaps >= 1) {
            results.add(new InsightsDtos.PatternInsight(
                    "measurement_gap",
                    "Messlücken im Tagesverlauf",
                    "Es wurden längere Messlücken festgestellt. Regelmäßige Messzeiten helfen bei stabileren Trends.",
                    "low"
            ));
        }
        if (results.isEmpty()) {
            results.add(new InsightsDtos.PatternInsight(
                    "no_pattern",
                    "Keine auffälligen Muster",
                    "Aktuell wurden keine wiederkehrenden Muster erkannt. Weiter so.",
                    "low"
            ));
        }
        return new InsightsDtos.PatternResponse(days, results);
    }

    private int countBreakfastHigh(List<Entry> entries) {
        int matches = 0;
        List<Entry> meals = entries.stream()
                .filter(e -> e.getType() == Entry.EntryType.MEAL
                        && e.getMealTime() != null
                        && e.getMealTime().toLowerCase(Locale.ROOT).contains("früh"))
                .toList();
        for (Entry meal : meals) {
            long windowEnd = meal.getTimestamp() + (3 * 60 * 60 * 1000L);
            boolean hit = entries.stream().anyMatch(e ->
                    e.getType() == Entry.EntryType.BZ &&
                    e.getTimestamp() >= meal.getTimestamp() &&
                    e.getTimestamp() <= windowEnd &&
                    e.getBzValue() != null &&
                    e.getBzValue() > 180
            );
            if (hit) matches++;
        }
        return matches;
    }

    private int countActivityLow(List<Entry> entries) {
        int matches = 0;
        List<Entry> activities = entries.stream()
                .filter(e -> e.getType() == Entry.EntryType.ACTIVITY)
                .toList();
        for (Entry activity : activities) {
            long windowEnd = activity.getTimestamp() + (3 * 60 * 60 * 1000L);
            boolean hit = entries.stream().anyMatch(e ->
                    e.getType() == Entry.EntryType.BZ &&
                    e.getTimestamp() >= activity.getTimestamp() &&
                    e.getTimestamp() <= windowEnd &&
                    e.getBzValue() != null &&
                    e.getBzValue() < 80
            );
            if (hit) matches++;
        }
        return matches;
    }

    private int countNightHigh(List<Entry> entries) {
        return (int) entries.stream()
                .filter(e -> e.getType() == Entry.EntryType.BZ && e.getBzValue() != null)
                .filter(e -> {
                    int hour = Instant.ofEpochMilli(e.getTimestamp())
                            .atZone(java.time.ZoneId.of("Europe/Berlin"))
                            .getHour();
                    return (hour >= 22 || hour <= 5) && e.getBzValue() > 200;
                })
                .count();
    }

    private int countLongBzGaps(List<Entry> entries, long minGapMinutes) {
        List<Entry> bz = entries.stream()
                .filter(e -> e.getType() == Entry.EntryType.BZ && e.getBzValue() != null)
                .sorted(Comparator.comparingLong(Entry::getTimestamp))
                .collect(Collectors.toList());
        if (bz.size() < 2) return 0;
        int gaps = 0;
        for (int i = 1; i < bz.size(); i++) {
            long diffMin = (bz.get(i).getTimestamp() - bz.get(i - 1).getTimestamp()) / 60_000L;
            if (diffMin >= minGapMinutes) gaps++;
        }
        return gaps;
    }

    private BigDecimal dec(double value) {
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP);
    }
}
