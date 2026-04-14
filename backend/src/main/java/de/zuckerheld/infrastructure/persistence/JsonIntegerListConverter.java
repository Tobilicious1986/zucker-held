package de.zuckerheld.infrastructure.persistence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Converter
public class JsonIntegerListConverter implements AttributeConverter<List<Integer>, String> {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<Integer>> TYPE = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<Integer> attribute) {
        try {
            Set<Integer> sanitized = new LinkedHashSet<>();
            if (attribute != null) {
                attribute.stream()
                        .filter(v -> v != null && v > 0)
                        .forEach(sanitized::add);
            }
            return OBJECT_MAPPER.writeValueAsString(List.copyOf(sanitized));
        } catch (Exception e) {
            throw new IllegalStateException("Konnte Integer-Liste nicht serialisieren.", e);
        }
    }

    @Override
    public List<Integer> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return List.of();
        }

        try {
            return OBJECT_MAPPER.readValue(dbData, TYPE);
        } catch (Exception e) {
            return List.of();
        }
    }
}
