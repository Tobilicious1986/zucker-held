package de.zuckerheld.domain.service.food;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.zuckerheld.api.dto.FoodDtos;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OpenFoodFactsProviderTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final OpenFoodFactsProvider provider = new OpenFoodFactsProvider(null);

    @Test
    void normalisiertOpenFoodFactsProduktInKhFirstAntwort() throws Exception {
        JsonNode product = objectMapper.readTree("""
            {
              "product_name": "Milchbrötchen",
              "code": "4012345678901",
              "brands": "Gut & Günstig",
              "categories": "Brot, Backwaren",
              "serving_size": "60 g",
              "nutriments": {
                "carbohydrates_100g": 48.5
              }
            }
            """);

        FoodDtos.FoodResponse result = provider.parseOffProduct(product);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Milchbrötchen");
        assertThat(result.barcode()).isEqualTo("4012345678901");
        assertThat(result.externalSource()).isEqualTo("open_food_facts");
        assertThat(result.portionPresets()).contains(60);
    }

    @Test
    void verwirftProdukteOhneKohlenhydratwert() throws Exception {
        JsonNode product = objectMapper.readTree("""
            {
              "product_name": "Wasser",
              "code": "12345678",
              "nutriments": {}
            }
            """);

        FoodDtos.FoodResponse result = provider.parseOffProduct(product);

        assertThat(result).isNull();
    }
}
