package de.zuckerheld.infrastructure.persistence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Converter
public class JsonStringListConverter implements AttributeConverter<List<String>, String> {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> TYPE = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        try {
            Set<String> sanitized = new LinkedHashSet<>();
            if (attribute != null) {
                attribute.stream()
                        .filter(value -> value != null && !value.isBlank())
                        .map(String::trim)
                        .map(value -> value.toLowerCase(Locale.ROOT))
                        .forEach(sanitized::add);
            }
            return OBJECT_MAPPER.writeValueAsString(List.copyOf(sanitized));
        } catch (Exception e) {
            throw new IllegalStateException("Konnte String-Liste nicht serialisieren.", e);
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
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
