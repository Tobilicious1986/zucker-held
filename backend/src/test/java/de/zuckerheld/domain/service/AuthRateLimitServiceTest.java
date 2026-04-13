package de.zuckerheld.domain.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AuthRateLimitServiceTest {

    @Test
    void blocksProfileAfterTooManyFailures() {
        AuthRateLimitService service = new AuthRateLimitService();

        for (int i = 0; i < 5; i++) {
            service.registerFailure("profil-1");
        }

        assertThat(service.isBlocked("profil-1")).isTrue();
        assertThat(service.getRemainingLockSeconds("profil-1")).isPositive();
    }

    @Test
    void clearsAttemptsAfterSuccessfulLogin() {
        AuthRateLimitService service = new AuthRateLimitService();

        for (int i = 0; i < 5; i++) {
            service.registerFailure("profil-1");
        }
        service.registerSuccess("profil-1");

        assertThat(service.isBlocked("profil-1")).isFalse();
        assertThat(service.getRemainingLockSeconds("profil-1")).isZero();
    }
}
