package de.zuckerheld.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class AiDtos {

    public record ChatRequest(
            @NotBlank String question,
            String contextSnippet
    ) {}

    public record ChatResponse(
            String answer,
            String provider,
            boolean usedContext,
            boolean available,
            String sourceLabel
    ) {}

    public record MealMessageDto(
            @NotBlank String role,
            @NotBlank String content
    ) {}

    public record MealAnalysisRequest(
            @NotEmpty List<MealMessageDto> messages,
            String imageBase64,
            String imageMimeType
    ) {}

    public record MealAnalysisResponse(
            String rawJson,
            String provider,
            boolean available,
            String errorMessage
    ) {}
}
