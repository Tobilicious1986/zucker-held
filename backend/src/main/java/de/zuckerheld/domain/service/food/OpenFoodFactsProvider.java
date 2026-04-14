package de.zuckerheld.domain.service.food;

import com.fasterxml.jackson.databind.JsonNode;
import de.zuckerheld.api.dto.FoodDtos;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class OpenFoodFactsProvider implements ExternalFoodProvider {

    private static final Duration OPENFOODFACTS_TIMEOUT = Duration.ofSeconds(10);
    private static final String OFF_BASE_URL = "https://world.openfoodfacts.org";
    private static final String USER_AGENT = "ZuckerHeld/1.0 (contact@zuckerheld.de)";
    private static final Pattern SERVING_SIZE_PATTERN = Pattern.compile("(\\d{1,4})\\s?(g|ml)", Pattern.CASE_INSENSITIVE);

    private final WebClient.Builder webClientBuilder;

    public OpenFoodFactsProvider(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    @Override
    public String sourceKey() {
        return "open_food_facts";
    }

    @Override
    public List<FoodDtos.FoodResponse> search(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        try {
            JsonNode response = webClientBuilder.build()
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("world.openfoodfacts.org")
                            .path("/cgi/search.pl")
                            .queryParam("search_terms", query)
                            .queryParam("json", "true")
                            .queryParam("page_size", 20)
                            .queryParam("fields", "code,product_name,nutriments,categories,brands,serving_size")
                            .build())
                    .header("User-Agent", USER_AGENT)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(OPENFOODFACTS_TIMEOUT)
                    .block();

            if (response == null || !response.has("products")) {
                return List.of();
            }

            LinkedHashMap<String, FoodDtos.FoodResponse> deduped = new LinkedHashMap<>();
            for (JsonNode product : response.get("products")) {
                FoodDtos.FoodResponse mapped = parseOffProduct(product);
                if (mapped != null) {
                    deduped.putIfAbsent(mapped.id(), mapped);
                }
            }
            return new ArrayList<>(deduped.values());
        } catch (Exception e) {
            return List.of();
        }
    }

    @Override
    public Optional<FoodDtos.FoodResponse> findByBarcode(String barcode) {
        if (barcode == null || barcode.isBlank()) {
            return Optional.empty();
        }

        try {
            JsonNode response = webClientBuilder.build()
                    .get()
                    .uri(OFF_BASE_URL + "/api/v0/product/" + barcode + ".json")
                    .header("User-Agent", USER_AGENT)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(OPENFOODFACTS_TIMEOUT)
                    .block();

            if (response == null || response.path("status").asInt(0) != 1) {
                return Optional.empty();
            }

            return Optional.ofNullable(parseOffProduct(response.path("product")));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    FoodDtos.FoodResponse parseOffProduct(JsonNode product) {
        if (product == null || product.isMissingNode()) {
            return null;
        }

        String name = product.path("product_name").asText("").trim();
        if (name.isBlank()) {
            return null;
        }

        double khRaw = product.path("nutriments").path("carbohydrates_100g").asDouble(-1);
        if (khRaw < 0) {
            return null;
        }

        String barcode = product.path("code").asText(product.path("id").asText(product.path("_id").asText("")));
        if (barcode.isBlank()) {
            barcode = null;
        }

        String categories = product.path("categories").asText("");
        String brands = product.path("brands").asText("");
        String category = FoodMetadataHeuristics.inferCategory(name, categories, brands);
        String emoji = FoodMetadataHeuristics.inferEmoji(category, name);
        List<String> aliases = new ArrayList<>();
        if (!brands.isBlank()) {
            aliases.add(brands.toLowerCase());
        }
        aliases.addAll(FoodMetadataHeuristics.defaultAliases(name));

        List<Integer> portionPresets = parseServingSize(product.path("serving_size").asText(""));
        if (portionPresets.isEmpty()) {
            portionPresets = FoodMetadataHeuristics.defaultPortionPresets(category, name);
        }

        return FoodDtos.FoodResponse.online(
                "off_" + (barcode != null ? barcode : FoodMetadataHeuristics.normalize(name).replace(' ', '_')),
                name,
                BigDecimal.valueOf(khRaw),
                emoji,
                barcode,
                category,
                aliases,
                portionPresets,
                sourceKey()
        );
    }

    private List<Integer> parseServingSize(String servingSizeText) {
        if (servingSizeText == null || servingSizeText.isBlank()) {
            return List.of();
        }

        Matcher matcher = SERVING_SIZE_PATTERN.matcher(servingSizeText);
        if (!matcher.find()) {
            return List.of();
        }

        int grams = Integer.parseInt(matcher.group(1));
        return List.of(grams);
    }
}
