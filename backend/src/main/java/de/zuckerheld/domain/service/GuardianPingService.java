package de.zuckerheld.domain.service;

import de.zuckerheld.domain.model.GuardianPingKind;
import de.zuckerheld.domain.model.ProfileLink;
import de.zuckerheld.domain.model.Settings;
import de.zuckerheld.infrastructure.messaging.RabbitMQConfig;
import de.zuckerheld.infrastructure.repository.ProfileLinkRepository;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class GuardianPingService {

    private static final Pattern DOSING_INSTRUCTION_PATTERN = Pattern.compile(
            "(?i)(\\b\\d+[,.]?\\d*\\s*(ie|i\\.e\\.|einheiten|units|u)\\b|\\b(dosierung|dosis|bolus|korrekturbolus|korrigier|insulin\\s*(geben|spritzen|nehmen))\\b)"
    );

    public record GuardianPingResult(
            int recipients,
            List<String> recipientNames,
            GuardianPingKind messageKind,
            String deliveredMessage
    ) {}

    private final ProfileLinkRepository profileLinkRepository;
    private final SettingsRepository settingsRepository;
    private final RabbitTemplate rabbitTemplate;

    public GuardianPingService(ProfileLinkRepository profileLinkRepository,
                               SettingsRepository settingsRepository,
                               RabbitTemplate rabbitTemplate) {
        this.profileLinkRepository = profileLinkRepository;
        this.settingsRepository = settingsRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Transactional(readOnly = true)
    public GuardianPingResult sendGuardianPing(String ownerId, String message) {
        return sendGuardianPing(ownerId, null, message);
    }

    @Transactional(readOnly = true)
    public GuardianPingResult sendGuardianPing(String ownerId, GuardianPingKind kind, String message) {
        Settings settings = settingsRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Settings nicht gefunden."));
        if (Boolean.FALSE.equals(settings.getGuardianPingEnabled())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Eltern-Ping ist deaktiviert.");
        }

        GuardianPingKind resolvedKind = kind != null ? kind : GuardianPingKind.CHECK_IN;
        String deliveredMessage = resolveMessage(resolvedKind, message);
        rejectDosingInstruction(deliveredMessage);

        List<ProfileLink> recipients = profileLinkRepository.findByOwnerIdAndStatusAndRoleIn(
                ownerId,
                ProfileLink.LinkStatus.ACCEPTED,
                List.of(ProfileLink.LinkRole.CAREGIVER, ProfileLink.LinkRole.ADMIN)
        ).stream()
                .filter(link -> link.getWatcher() != null)
                .filter(link -> !link.isExpired())
                .toList();

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "GUARDIAN_PING");
        payload.put("ownerId", ownerId);
        payload.put("messageKind", resolvedKind.name());
        payload.put("message", deliveredMessage);
        payload.put("recipientIds", recipients.stream()
                .map(link -> link.getWatcher().getId())
                .toList());
        payload.put("recipientNames", recipients.stream()
                .map(link -> link.getWatcher().getName())
                .toList());
        payload.put("sentAt", OffsetDateTime.now().toString());

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_ALERTS,
                RabbitMQConfig.KEY_GUARDIAN_PING,
                payload
        );
        return new GuardianPingResult(
                recipients.size(),
                recipients.stream().map(link -> link.getWatcher().getName()).toList(),
                resolvedKind,
                deliveredMessage
        );
    }

    private String resolveMessage(GuardianPingKind kind, String message) {
        String trimmed = message == null ? "" : message.trim().replaceAll("\\s+", " ");
        if (!trimmed.isBlank()) return trimmed;

        return switch (kind) {
            case ALL_CLEAR -> "Mir geht es gut. Alles okay.";
            case HELP_NEEDED -> "Ich brauche jetzt Hilfe. Bitte komm zu mir.";
            case CHECK_IN -> "Bitte kurz bei mir melden.";
        };
    }

    private void rejectDosingInstruction(String message) {
        if (DOSING_INSTRUCTION_PATTERN.matcher(message).find()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ping-Nachrichten dürfen keine Dosierungs- oder Insulinanweisungen enthalten."
            );
        }
    }
}
