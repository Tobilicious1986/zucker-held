package de.zuckerheld.domain.service;

import de.zuckerheld.api.dto.InsightsDtos;
import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.infrastructure.repository.EntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class InsightsService {

    private static final ZoneId BERLIN_ZONE = ZoneId.of("Europe/Berlin");
    private static final Set<String> CGM_SOURCES = new HashSet<>(Set.of("nightscout", "dexcom", "cgm"));
    private static final long GLUCOSE_STALE_MINUTES = 120L;
    private static final long CGM_STALE_MINUTES = 25L;
    private static final long MEASUREMENT_GAP_MINUTES = 8 * 60L;

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
        List<Entry> breakfastHighHits = findBreakfastHighHits(entries);
        List<Entry> activityLowHits = findActivityLowHits(entries);
        List<Entry> nightHighHits = findNightHighHits(entries);
        int breakfastHigh = breakfastHighHits.size();
        int activityLow = activityLowHits.size();
        int nightHigh = nightHighHits.size();
        int longGaps = countLongBzGaps(entries, MEASUREMENT_GAP_MINUTES);

        if (breakfastHigh >= 3) {
            results.add(new InsightsDtos.PatternInsight(
                    "breakfast_high",
                    "Erhöhte Werte nach Frühstück",
                    "In den letzten " + days + " Tagen gab es " + breakfastHigh + " erhöhte Werte nach Frühstück.",
                    "medium",
                    describeClockWindow(breakfastHighHits, "nach dem Frühstück"),
                    breakfastHigh
            ));
        }
        if (activityLow >= 2) {
            results.add(new InsightsDtos.PatternInsight(
                    "activity_low",
                    "Niedrige Werte nach Aktivität",
                    "Es wurden " + activityLow + " mögliche Unterzucker-Muster nach Aktivität erkannt.",
                    "high",
                    describeClockWindow(activityLowHits, "nach Aktivität"),
                    activityLow
            ));
        }
        if (nightHigh >= 3) {
            results.add(new InsightsDtos.PatternInsight(
                    "night_high",
                    "Nächtlich erhöhte BZ-Werte",
                    "Mehrfach erhöhte Nachtwerte (" + nightHigh + " Treffer) wurden erkannt.",
                    "medium",
                    describeClockWindow(nightHighHits, "nachts"),
                    nightHigh
            ));
        }
        if (longGaps >= 1) {
            results.add(new InsightsDtos.PatternInsight(
                    "measurement_gap",
                    "Messlücken im Tagesverlauf",
                    "Es wurden längere Messlücken festgestellt. Regelmäßige Messzeiten helfen bei stabileren Trends.",
                    "low",
                    "zwischen dokumentierten BZ-Messungen",
                    longGaps
            ));
        }
        if (results.isEmpty()) {
            results.add(new InsightsDtos.PatternInsight(
                    "no_pattern",
                    "Keine auffälligen Muster",
                    "Aktuell wurden keine wiederkehrenden Muster erkannt. Weiter so.",
                    "low",
                    null,
                    0
            ));
        }
        return new InsightsDtos.PatternResponse(days, results);
    }

    @Transactional(readOnly = true)
    public InsightsDtos.DataQualityResponse computeDataQuality(String profileId, int days) {
        long now = Instant.now().toEpochMilli();
        long from = Instant.now().minus(days, ChronoUnit.DAYS).toEpochMilli();
        List<Entry> entries = entryRepository.findByProfileAndTimeRange(profileId, from, now).stream()
                .sorted(Comparator.comparingLong(Entry::getTimestamp))
                .toList();

        List<Entry> bzEntries = entries.stream()
                .filter(e -> e.getType() == Entry.EntryType.BZ && e.getBzValue() != null)
                .toList();
        Entry latestGlucose = bzEntries.stream()
                .max(Comparator.comparingLong(Entry::getTimestamp))
                .orElse(null);
        Entry latestCgm = bzEntries.stream()
                .filter(this::isCgmEntry)
                .max(Comparator.comparingLong(Entry::getTimestamp))
                .orElse(null);

        Integer latestGlucoseAgeMinutes = latestGlucose != null
                ? Math.toIntExact((now - latestGlucose.getTimestamp()) / 60_000L)
                : null;
        Integer latestCgmAgeMinutes = latestCgm != null
                ? Math.toIntExact((now - latestCgm.getTimestamp()) / 60_000L)
                : null;

        boolean staleGlucose = latestGlucoseAgeMinutes == null || latestGlucoseAgeMinutes > GLUCOSE_STALE_MINUTES;
        boolean hasCgmSignal = latestCgm != null;
        boolean staleCgm = latestCgmAgeMinutes != null && latestCgmAgeMinutes > CGM_STALE_MINUTES;
        int measurementGapCount = countLongBzGaps(entries, MEASUREMENT_GAP_MINUTES);

        List<InsightsDtos.DataQualityIssue> issues = new ArrayList<>();
        if (latestGlucose == null) {
            issues.add(new InsightsDtos.DataQualityIssue(
                    "missing_glucose",
                    "high",
                    "Kein aktueller Glukosewert vorhanden",
                    "Im betrachteten Zeitraum gibt es keinen dokumentierten Glukosewert. Aussagen zu Trends sind dadurch eingeschränkt."
            ));
        } else if (staleGlucose) {
            issues.add(new InsightsDtos.DataQualityIssue(
                    "stale_glucose",
                    "medium",
                    "Letzter Glukosewert ist veraltet",
                    "Der letzte Glukosewert ist " + latestGlucoseAgeMinutes + " Minuten alt. Aktuelle Einordnung ist dadurch nur eingeschränkt möglich."
            ));
        }

        if (hasCgmSignal && staleCgm) {
            issues.add(new InsightsDtos.DataQualityIssue(
                    "cgm_gap",
                    "high",
                    "CGM-/Nightscout-Signal wirkt unterbrochen",
                    "Das letzte automatische CGM-Signal ist " + latestCgmAgeMinutes + " Minuten alt. Bitte Datenquelle oder Sensorstatus prüfen."
            ));
        }

        if (measurementGapCount > 0) {
            issues.add(new InsightsDtos.DataQualityIssue(
                    "measurement_gap",
                    measurementGapCount >= 2 ? "medium" : "low",
                    "Messlücken erkannt",
                    "Es wurden " + measurementGapCount + " längere Messlücken im Verlauf erkannt. Dadurch werden Muster und Trends unsicherer."
            ));
        }

        if (issues.isEmpty()) {
            issues.add(new InsightsDtos.DataQualityIssue(
                    "signal_ok",
                    "low",
                    "Signalqualität stabil",
                    "Es wurden aktuell keine auffälligen Daten- oder Signallücken erkannt."
            ));
        }

        return new InsightsDtos.DataQualityResponse(
                days,
                latestGlucoseAgeMinutes,
                latestCgmAgeMinutes,
                measurementGapCount,
                staleGlucose,
                staleCgm,
                !staleGlucose,
                hasCgmSignal,
                issues
        );
    }

    private List<Entry> findBreakfastHighHits(List<Entry> entries) {
        List<Entry> matches = new ArrayList<>();
        List<Entry> meals = entries.stream()
                .filter(e -> e.getType() == Entry.EntryType.MEAL
                        && e.getMealTime() != null
                        && e.getMealTime().toLowerCase(Locale.ROOT).contains("früh"))
                .toList();
        for (Entry meal : meals) {
            long windowEnd = meal.getTimestamp() + (3 * 60 * 60 * 1000L);
            Entry hit = entries.stream().filter(e ->
                    e.getType() == Entry.EntryType.BZ &&
                    e.getTimestamp() >= meal.getTimestamp() &&
                    e.getTimestamp() <= windowEnd &&
                    e.getBzValue() != null &&
                    e.getBzValue() > 180
            ).findFirst().orElse(null);
            if (hit != null) matches.add(hit);
        }
        return matches;
    }

    private List<Entry> findActivityLowHits(List<Entry> entries) {
        List<Entry> matches = new ArrayList<>();
        List<Entry> activities = entries.stream()
                .filter(e -> e.getType() == Entry.EntryType.ACTIVITY)
                .toList();
        for (Entry activity : activities) {
            long windowEnd = activity.getTimestamp() + (3 * 60 * 60 * 1000L);
            Entry hit = entries.stream().filter(e ->
                    e.getType() == Entry.EntryType.BZ &&
                    e.getTimestamp() >= activity.getTimestamp() &&
                    e.getTimestamp() <= windowEnd &&
                    e.getBzValue() != null &&
                    e.getBzValue() < 80
            ).findFirst().orElse(null);
            if (hit != null) matches.add(hit);
        }
        return matches;
    }

    private List<Entry> findNightHighHits(List<Entry> entries) {
        return entries.stream()
                .filter(e -> e.getType() == Entry.EntryType.BZ && e.getBzValue() != null)
                .filter(e -> {
                    int hour = Instant.ofEpochMilli(e.getTimestamp())
                            .atZone(BERLIN_ZONE)
                            .getHour();
                    return (hour >= 22 || hour <= 5) && e.getBzValue() > 200;
                })
                .toList();
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

    private boolean isCgmEntry(Entry entry) {
        return entry.getSource() != null && CGM_SOURCES.contains(entry.getSource().toLowerCase(Locale.ROOT));
    }

    private String describeClockWindow(List<Entry> entries, String prefix) {
        if (entries.isEmpty()) return null;
        int minHour = 23;
        int maxHour = 0;
        for (Entry entry : entries) {
            int hour = Instant.ofEpochMilli(entry.getTimestamp()).atZone(BERLIN_ZONE).getHour();
            minHour = Math.min(minHour, hour);
            maxHour = Math.max(maxHour, hour);
        }
        int fromHour = Math.max(0, minHour);
        int toHour = Math.min(23, maxHour + 1);
        return prefix + " zwischen " + formatHour(fromHour) + " und " + formatHour(toHour) + " Uhr";
    }

    private String formatHour(int hour) {
        return String.format(Locale.ROOT, "%02d:00", hour);
    }
}
