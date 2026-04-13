package de.zuckerheld.domain.service;

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

@Service
public class GuardianPingService {

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
    public int sendGuardianPing(String ownerId, String message) {
        Settings settings = settingsRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Settings nicht gefunden."));
        if (Boolean.FALSE.equals(settings.getGuardianPingEnabled())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Eltern-Ping ist deaktiviert.");
        }

        List<ProfileLink> recipients = profileLinkRepository.findByOwnerIdAndStatusAndRoleIn(
                ownerId,
                ProfileLink.LinkStatus.ACCEPTED,
                List.of(ProfileLink.LinkRole.CAREGIVER, ProfileLink.LinkRole.ADMIN)
        );

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "GUARDIAN_PING");
        payload.put("ownerId", ownerId);
        payload.put("message", message);
        payload.put("recipientIds", recipients.stream()
                .map(link -> link.getWatcher().getId())
                .toList());
        payload.put("sentAt", OffsetDateTime.now().toString());

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_ALERTS,
                RabbitMQConfig.KEY_GUARDIAN_PING,
                payload
        );
        return recipients.size();
    }
}
