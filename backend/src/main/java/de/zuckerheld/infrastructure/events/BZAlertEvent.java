package de.zuckerheld.infrastructure.events;

import org.springframework.context.ApplicationEvent;

/**
 * Spring-Event das gefeuert wird wenn ein BZ-Wert außerhalb des sicheren Bereichs liegt.
 * Wird von EntryService publiziert und von NotificationService verarbeitet.
 */
public class BZAlertEvent extends ApplicationEvent {

    private final String profileId;
    private final int    bzValue;
    private final long   occurredAt;

    public BZAlertEvent(Object source, String profileId, int bzValue, long occurredAt) {
        super(source);
        this.profileId  = profileId;
        this.bzValue    = bzValue;
        this.occurredAt = occurredAt;
    }

    public String getProfileId()  { return profileId; }
    public int    getBzValue()    { return bzValue; }
    public long   getOccurredAt() { return occurredAt; }
}
