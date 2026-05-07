package de.zuckerheld.api.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.ProfileLink;
import de.zuckerheld.domain.model.Settings;
import de.zuckerheld.domain.service.ProfileLinkService;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/**
 * Sprint 15 — NET-03: Lern- und Notfallzugang für LEARNING_ONLY-Watcher.
 * Gibt ausschließlich Notfallkontakte und SOS-Hinweise zurück — keine Messwerte.
 */
@RestController
@Tag(name = "Learning Access", description = "Lern- und Notfallzugang (NET-03)")
@PreAuthorize("isAuthenticated()")
public class LearningAccessController {

    private static final String HYPO_HINT =
            "Hypo (< 70 mg/dL): Sofort 15–20g schnelle KH geben (Traubenzucker, Fruchtsaft). " +
            "Nach 15 Min. Kontrolle. Bei Bewusstlosigkeit: Notruf 112, keine orale Gabe.";

    private static final String HYPER_HINT =
            "Hyper (> 250 mg/dL): Viel Wasser trinken, Insulin vorhanden? Ketonkontrolle. " +
            "Bei Erbrechen oder Bewusstseinstrübung: Notruf 112.";

    private static final String KETONE_HINT =
            "Ketone > 1,5 mmol/L: Arzt kontaktieren. Ketone > 3 mmol/L: Notruf 112 — DKA-Risiko.";

    private final ProfileLinkService  linkService;
    private final ProfileRepository   profileRepository;
    private final SettingsRepository  settingsRepository;
    private final ObjectMapper        objectMapper;

    public LearningAccessController(ProfileLinkService linkService,
                                     ProfileRepository profileRepository,
                                     SettingsRepository settingsRepository,
                                     ObjectMapper objectMapper) {
        this.linkService      = linkService;
        this.profileRepository = profileRepository;
        this.settingsRepository = settingsRepository;
        this.objectMapper     = objectMapper;
    }

    @Operation(summary = "Lern- und Notfallzugang für LEARNING_ONLY-Watcher")
    @GetMapping("/api/v1/profiles/{ownerId}/learning-access")
    public ResponseEntity<LearningAccessResponse> getLearningAccess(
            @PathVariable String ownerId,
            Authentication auth) {

        String watcherId = ((Profile) auth.getPrincipal()).getId();

        // Eigener Zugriff immer erlaubt
        boolean isSelf = ownerId.equals(watcherId);
        ProfileLink link = null;
        if (!isSelf) {
            link = linkService.getActiveLinkForScope(
                    ownerId,
                    watcherId,
                    ProfileLink.AccessScope.LEARNING_ONLY
            ).orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Kein LEARNING_ONLY-Zugang für dieses Profil."));
        }

        Profile owner = profileRepository.findById(ownerId)
                .orElseThrow(() -> new EntityNotFoundException("Profil nicht gefunden: " + ownerId));

        Settings settings = settingsRepository.findById(ownerId).orElse(null);
        List<Map<String, String>> contacts = parseContacts(settings);

        return ResponseEntity.ok(new LearningAccessResponse(
                true,
                owner.getName(),
                contacts,
                HYPO_HINT,
                HYPER_HINT,
                KETONE_HINT,
                link != null ? link.getRelationshipKind().name() : "SELF",
                link != null ? link.getPurpose() : "Eigener Lern- und Notfallzugang",
                buildEverydayPackage(link)
        ));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, String>> parseContacts(Settings settings) {
        if (settings == null || settings.getContacts() == null) return List.of();
        try {
            return objectMapper.readValue(settings.getContacts(), List.class);
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private EverydayPackage buildEverydayPackage(ProfileLink link) {
        String audience = "Alltagshilfe";
        if (link != null && link.getRelationshipKind() == ProfileLink.RelationshipKind.SCHOOL) {
            audience = "Schule / Trainer";
        } else if (link != null && link.getRelationshipKind() == ProfileLink.RelationshipKind.FAMILY) {
            audience = "Familie / Betreuung";
        }

        return new EverydayPackage(
                "Sport/Schule",
                audience,
                List.of(
                        new ActionCard(
                                "Kontakt bereit haben",
                                "Vor Start klären, wer erreichbar ist und welcher Kontakt zuerst angerufen wird."
                        ),
                        new ActionCard(
                                "Rolle klar halten",
                                "Dieser Zugang unterstützt im Alltag, ersetzt aber keine medizinische Entscheidung."
                        ),
                        new ActionCard(
                                "Bei Unsicherheit eskalieren",
                                "Elternkontakt oder Notruf nutzen, statt Dosierungsfragen per Nachricht zu klären."
                        )
                ),
                "Keine Messwerte, keine Eintragsliste und keine Dosierungsanweisungen in diesem Zugang."
        );
    }

    public record LearningAccessResponse(
            boolean hasAccess,
            String ownerName,
            List<Map<String, String>> emergencyContacts,
            String hypoHint,
            String hyperHint,
            String ketoneHint,
            String relationshipKind,
            String purpose,
            EverydayPackage everydayPackage
    ) {}

    public record EverydayPackage(
            String title,
            String audience,
            List<ActionCard> actionCards,
            String safetyNote
    ) {}

    public record ActionCard(
            String title,
            String text
    ) {}
}
