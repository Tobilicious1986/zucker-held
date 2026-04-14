package de.zuckerheld.domain.service.food;

import de.zuckerheld.api.dto.FoodDtos;

import java.util.List;
import java.util.Optional;

public interface ExternalFoodProvider {

    String sourceKey();

    List<FoodDtos.FoodResponse> search(String query);

    Optional<FoodDtos.FoodResponse> findByBarcode(String barcode);
}
