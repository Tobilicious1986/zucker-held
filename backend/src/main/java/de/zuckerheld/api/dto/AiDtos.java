package de.zuckerheld.api.dto;

import jakarta.validation.constraints.NotBlank;

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
}
