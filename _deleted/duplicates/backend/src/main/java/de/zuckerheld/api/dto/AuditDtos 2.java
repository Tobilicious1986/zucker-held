package de.zuckerheld.api.dto;

import de.zuckerheld.domain.model.AuditLog;

import java.time.OffsetDateTime;

public class AuditDtos {

    public record AuditLogResponse(
            long id,
            String profileId,
            String actorId,
            String actorName,
            String action,
            String details,
            OffsetDateTime createdAt
    ) {
        public static AuditLogResponse from(AuditLog log) {
            return new AuditLogResponse(
                    log.getId(),
                    log.getProfile().getId(),
                    log.getActor().getId(),
                    log.getActor().getName(),
                    log.getAction(),
                    log.getDetails(),
                    log.getCreatedAt()
            );
        }
    }
}
