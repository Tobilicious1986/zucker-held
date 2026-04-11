package de.zuckerheld.infrastructure.events;

import org.springframework.context.ApplicationEvent;

/**
 * Spring-Event das nach erfolgreicher Erstellung eines Entry-Datensatzes publiziert wird.
 * Ermöglicht lose Kopplung zwischen EntryService und Achievement-/Notification-Logik.
 */
public class EntryCreatedEvent extends ApplicationEvent {

    private final String profileId;
    private final String entryId;
    private final String entryType;
    private final long   occurredAt;

    public EntryCreatedEvent(Object source, String profileId, String entryId, String entryType, long occurredAt) {
        super(source);
        this.profileId  = profileId;
        this.entryId    = entryId;
        this.entryType  = entryType;
        this.occurredAt = occurredAt;
    }

    public String getProfileId()  { return profileId; }
    public String getEntryId()    { return entryId; }
    public String getEntryType()  { return entryType; }
    public long   getOccurredAt() { return occurredAt; }
}
