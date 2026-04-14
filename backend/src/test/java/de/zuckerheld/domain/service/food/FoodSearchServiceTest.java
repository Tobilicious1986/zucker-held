package de.zuckerheld.domain.service.food;

import de.zuckerheld.api.dto.FoodDtos;
import de.zuckerheld.domain.model.FoodItem;
import de.zuckerheld.infrastructure.repository.FoodItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FoodSearchServiceTest {

    @Mock
    private FoodItemRepository foodItemRepository;

    @Mock
    private ExternalFoodProvider externalFoodProvider;

    private FoodSearchService foodSearchService;

    @BeforeEach
    void setUp() {
        foodSearchService = new FoodSearchService(foodItemRepository, List.of(externalFoodProvider));
    }

    @Test
    void findetDachAliasWieSemmel() {
        FoodItem broetchen = builtin("builtin_broetchen", "Brötchen", "brot_getreide", List.of("semmel"));
        FoodItem toastbrot = builtin("builtin_toastbrot", "Toastbrot", "brot_getreide", List.of("toast"));

        when(foodItemRepository.findAvailableForProfile("profil-1")).thenReturn(List.of(toastbrot, broetchen));

        List<FoodDtos.FoodResponse> results = foodSearchService.searchFoods("profil-1", "Semmel", null);

        assertThat(results).isNotEmpty();
        assertThat(results.getFirst().name()).isEqualTo("Brötchen");
        assertThat(results.getFirst().aliases()).contains("semmel");
    }

    @Test
    void priorisiertExaktenTrefferVorTeiltreffer() {
        FoodItem apfel = builtin("builtin_apfel", "Apfel", "obst", List.of("roter apfel"));
        FoodItem apfelsaft = builtin("builtin_apfelsaft", "Apfelsaft", "getraenke", List.of("saft"));

        when(foodItemRepository.findAvailableForProfile("profil-1")).thenReturn(List.of(apfelsaft, apfel));

        List<FoodDtos.FoodResponse> results = foodSearchService.searchFoods("profil-1", "Apfel", null);

        assertThat(results).hasSize(2);
        assertThat(results.getFirst().id()).isEqualTo("builtin_apfel");
    }

    @Test
    void barcodeSuchtErstLokalUndFragtDannNichtExtern() {
        FoodItem localFood = builtin("builtin_apfel", "Apfel", "obst", List.of("apfel"));
        localFood.setBarcode("4012345678901");

        when(foodItemRepository.findAvailableByBarcode("profil-1", "4012345678901"))
                .thenReturn(Optional.of(localFood));

        Optional<FoodDtos.FoodResponse> result =
                foodSearchService.findByBarcode("profil-1", "4012345678901");

        assertThat(result).isPresent();
        assertThat(result.get().source()).isEqualTo("builtin");
        verify(externalFoodProvider, never()).findByBarcode(anyString());
    }

    @Test
    void barcodeFaelltSauberAufOpenFoodFactsZurueck() {
        FoodDtos.FoodResponse online = FoodDtos.FoodResponse.online(
                "off_4012345678901",
                "Saft",
                BigDecimal.valueOf(10.5),
                "🥤",
                "4012345678901",
                "getraenke",
                List.of("saft"),
                List.of(200),
                "open_food_facts"
        );

        when(foodItemRepository.findAvailableByBarcode("profil-1", "4012345678901"))
                .thenReturn(Optional.empty());
        when(externalFoodProvider.findByBarcode("4012345678901")).thenReturn(Optional.of(online));

        Optional<FoodDtos.FoodResponse> result =
                foodSearchService.findByBarcode("profil-1", "4012345678901");

        assertThat(result).isPresent();
        assertThat(result.get().externalSource()).isEqualTo("open_food_facts");
    }

    @Test
    void onlineFehlerfalleFuehrtZuLeererListeStattZu500() {
        when(externalFoodProvider.search("cola")).thenReturn(List.of());

        List<FoodDtos.FoodResponse> results = foodSearchService.searchOnline("cola");

        assertThat(results).isEmpty();
    }

    private FoodItem builtin(String id, String name, String category, List<String> aliases) {
        FoodItem item = new FoodItem();
        item.setId(id);
        item.setName(name);
        item.setKhPer100g(BigDecimal.valueOf(42));
        item.setCategory(category);
        item.setAliases(aliases);
        item.setPortionPresets(List.of(30, 60));
        item.setEmoji("🍽️");
        item.setSource("builtin");
        return item;
    }
}
