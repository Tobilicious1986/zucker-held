package de.zuckerheld.domain.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Einfaches In-Memory-Rate-Limit für PIN-Logins.
 * Sperrt ein Profil temporär nach zu vielen Fehlversuchen.
 */
@Service
public class AuthRateLimitService {

    private static final int MAX_FAILS = 5;
    private static final long LOCK_SECONDS = 10 * 60L;

    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public boolean isBlocked(String profileId) {
        AttemptState state = attempts.get(profileId);
        if (state == null) return false;
        if (state.lockedUntilEpoch <= Instant.now().getEpochSecond()) {
            attempts.remove(profileId);
            return false;
        }
        return true;
    }

    public long getRemainingLockSeconds(String profileId) {
        AttemptState state = attempts.get(profileId);
        if (state == null) return 0;
        long now = Instant.now().getEpochSecond();
        return Math.max(0, state.lockedUntilEpoch - now);
    }

    public void registerFailure(String profileId) {
        long now = Instant.now().getEpochSecond();
        attempts.compute(profileId, (id, existing) -> {
            AttemptState state = existing == null ? new AttemptState() : existing;
            if (state.lockedUntilEpoch > now) return state;

            state.failures++;
            if (state.failures >= MAX_FAILS) {
                state.lockedUntilEpoch = now + LOCK_SECONDS;
                state.failures = 0;
            }
            return state;
        });
    }

    public void registerSuccess(String profileId) {
        attempts.remove(profileId);
    }

    private static class AttemptState {
        int failures;
        long lockedUntilEpoch;
    }
}
