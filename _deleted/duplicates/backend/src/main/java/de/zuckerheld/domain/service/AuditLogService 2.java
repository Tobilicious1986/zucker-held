package de.zuckerheld.domain.service;

import de.zuckerheld.domain.model.AuditLog;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.infrastructure.repository.AuditLogRepository;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ProfileRepository profileRepository;

    public AuditLogService(AuditLogRepository auditLogRepository,
                           ProfileRepository profileRepository) {
        this.auditLogRepository = auditLogRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional
    public void log(String profileId, String actorId, String action, String details) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new EntityNotFoundException("Profil nicht gefunden: " + profileId));
        Profile actor = profileRepository.findById(actorId)
                .orElseThrow(() -> new EntityNotFoundException("Akteur nicht gefunden: " + actorId));

        AuditLog log = new AuditLog();
        log.setProfile(profile);
        log.setActor(actor);
        log.setAction(action);
        log.setDetails(details);
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getLogs(String profileId, Pageable pageable) {
        return auditLogRepository.findByProfileIdOrderByCreatedAtDesc(profileId, pageable);
    }
}
