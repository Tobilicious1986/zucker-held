package de.zuckerheld.domain.service;

import de.zuckerheld.api.dto.InsightsDtos;
import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.infrastructure.repository.EntryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InsightsServiceTest {

    @Mock
    private EntryRepository entryRepository;

    @InjectMocks
    private InsightsService insightsService;

    @Test
    void computesConsensusMetricsFromBzReadings() {
        when(entryRepository.findByProfileAndTimeRange(eq("profil-1"), anyLong(), anyLong()))
                .thenReturn(List.of(
                        bzEntry("1", 90, berlinTime(2026, 4, 10, 8, 0)),
                        bzEntry("2", 180, berlinTime(2026, 4, 11, 8, 0)),
                        bzEntry("3", 220, berlinTime(2026, 4, 12, 8, 0)),
                        bzEntry("4", 60, berlinTime(2026, 4, 13, 8, 0))
                ));

        InsightsDtos.MetricsResponse response = insightsService.computeMetrics("profil-1", 14);

        assertThat(response.totalReadings()).isEqualTo(4);
        assertThat(response.avgBz().doubleValue()).isEqualTo(137.5);
        assertThat(response.tirPercent().doubleValue()).isEqualTo(50.0);
        assertThat(response.belowPercent().doubleValue()).isEqualTo(25.0);
        assertThat(response.abovePercent().doubleValue()).isEqualTo(25.0);
        assertThat(response.gmi().doubleValue()).isPositive();
        assertThat(response.cvPercent().doubleValue()).isPositive();
    }

    @Test
    void detectsRecurringPatternsForBreakfastActivityAndNight() {
        when(entryRepository.findByProfileAndTimeRange(eq("profil-1"), anyLong(), anyLong()))
                .thenReturn(List.of(
                        mealEntry("m1", "Frühstück", berlinTime(2026, 4, 10, 7, 30)),
                        bzEntry("b1", 210, berlinTime(2026, 4, 10, 9, 0)),
                        mealEntry("m2", "Frühstück", berlinTime(2026, 4, 11, 7, 40)),
                        bzEntry("b2", 205, berlinTime(2026, 4, 11, 9, 10)),
                        mealEntry("m3", "Frühstück", berlinTime(2026, 4, 12, 7, 20)),
                        bzEntry("b3", 215, berlinTime(2026, 4, 12, 8, 50)),
                        activityEntry("a1", berlinTime(2026, 4, 12, 15, 0)),
                        bzEntry("b4", 75, berlinTime(2026, 4, 12, 16, 30)),
                        activityEntry("a2", berlinTime(2026, 4, 13, 15, 0)),
                        bzEntry("b5", 72, berlinTime(2026, 4, 13, 16, 15)),
                        bzEntry("n1", 230, berlinTime(2026, 4, 10, 23, 15)),
                        bzEntry("n2", 240, berlinTime(2026, 4, 11, 22, 45)),
                        bzEntry("n3", 225, berlinTime(2026, 4, 12, 23, 5))
                ));

        InsightsDtos.PatternResponse response = insightsService.detectPatterns("profil-1", 14);

        assertThat(response.insights()).extracting(InsightsDtos.PatternInsight::id)
                .contains("breakfast_high", "activity_low", "night_high");
        assertThat(response.insights())
                .filteredOn(insight -> "breakfast_high".equals(insight.id()))
                .extracting(InsightsDtos.PatternInsight::timeWindowLabel)
                .contains("nach dem Frühstück zwischen 08:00 und 10:00 Uhr");
    }

    @Test
    void computesDataQualityForStaleCgmAndMeasurementGaps() {
        when(entryRepository.findByProfileAndTimeRange(eq("profil-1"), anyLong(), anyLong()))
                .thenReturn(List.of(
                        bzEntryWithSource("cgm-1", 132, berlinTime(2026, 4, 13, 6, 0), "nightscout"),
                        bzEntry("bz-1", 145, berlinTime(2026, 4, 13, 7, 0)),
                        bzEntry("bz-2", 154, berlinTime(2026, 4, 13, 18, 30))
                ));

        InsightsDtos.DataQualityResponse response = insightsService.computeDataQuality("profil-1", 14);

        assertThat(response.measurementGapCount()).isGreaterThanOrEqualTo(1);
        assertThat(response.hasCgmSignal()).isTrue();
        assertThat(response.issues()).extracting(InsightsDtos.DataQualityIssue::id)
                .contains("cgm_gap", "measurement_gap");
    }

    private static Entry bzEntry(String id, int bzValue, long timestamp) {
        Entry entry = new Entry();
        entry.setId(id);
        entry.setType(Entry.EntryType.BZ);
        entry.setTimestamp(timestamp);
        entry.setBzValue(bzValue);
        return entry;
    }

    private static Entry mealEntry(String id, String mealTime, long timestamp) {
        Entry entry = new Entry();
        entry.setId(id);
        entry.setType(Entry.EntryType.MEAL);
        entry.setTimestamp(timestamp);
        entry.setMealTime(mealTime);
        return entry;
    }

    private static Entry activityEntry(String id, long timestamp) {
        Entry entry = new Entry();
        entry.setId(id);
        entry.setType(Entry.EntryType.ACTIVITY);
        entry.setTimestamp(timestamp);
        return entry;
    }

    private static Entry bzEntryWithSource(String id, int bzValue, long timestamp, String source) {
        Entry entry = bzEntry(id, bzValue, timestamp);
        entry.setSource(source);
        return entry;
    }

    private static long berlinTime(int year, int month, int day, int hour, int minute) {
        return ZonedDateTime.of(year, month, day, hour, minute, 0, 0, ZoneId.of("Europe/Berlin"))
                .toInstant()
                .toEpochMilli();
    }
}
