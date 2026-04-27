package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.AiDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.AiProviderUnavailableException;
import de.zuckerheld.domain.service.AiProxyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiProxyControllerTest {

    @Mock private AiProxyService aiProxyService;
    @Mock private Authentication authentication;

    private AiProxyController controller;

    @BeforeEach
    void setUp() {
        controller = new AiProxyController(aiProxyService);
    }

    @Test
    void analyzeMealReturnsControlledUnavailableResponseWhenProviderKeyMissing() {
        Profile profile = new Profile();
        profile.setId("profile-1");
        when(authentication.getPrincipal()).thenReturn(profile);
        when(aiProxyService.analyzeMeal("profile-1", List.of(new AiDtos.MealMessageDto("user", "Pizza")), null, null))
                .thenThrow(new AiProviderUnavailableException("claude", "Bitte API-Schlüssel hinterlegen."));

        ResponseEntity<AiDtos.MealAnalysisResponse> response = controller.analyzeMeal(
                new AiDtos.MealAnalysisRequest(
                        List.of(new AiDtos.MealMessageDto("user", "Pizza")),
                        null,
                        null
                ),
                authentication
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().available());
        assertEquals("claude", response.getBody().provider());
        assertEquals("Bitte API-Schlüssel hinterlegen.", response.getBody().errorMessage());
    }
}
