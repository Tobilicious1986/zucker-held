package de.zuckerheld.domain.service;

import de.zuckerheld.api.dto.ProfileDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.Profile.ProfileType;
import de.zuckerheld.domain.model.Profile.Role;
import de.zuckerheld.domain.model.Settings;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import de.zuckerheld.infrastructure.repository.SettingsRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

/**
 * Verwaltet Nutzerprofile (Erstellen, Aktualisieren, Löschen, PIN-Verifikation).
 */
@Service
public class ProfileService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String       CHARS  = "abcdefghijklmnopqrstuvwxyz0123456789";

    private final ProfileRepository  profileRepository;
    private final SettingsRepository settingsRepository;
    private final PasswordEncoder    passwordEncoder;

    public ProfileService(ProfileRepository profileRepository,
                          SettingsRepository settingsRepository,
                          PasswordEncoder passwordEncoder) {
        this.profileRepository  = profileRepository;
        this.settingsRepository = settingsRepository;
        this.passwordEncoder    = passwordEncoder;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Öffentliche API
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Gibt alle Profile in Erstellungsreihenfolge zurück (für Login-Screen).
     */
    @Transactional(readOnly = true)
    public List<Profile> getAllProfiles() {
        return profileRepository.findAllByOrderByCreatedAtAsc();
    }

    /**
     * Erstellt ein neues Profil mit zugehörigen Default-Settings.
     */
    @Transactional
    public Profile createProfile(ProfileDtos.CreateProfileRequest req) {
        Profile profile = new Profile();
        profile.setId(generateProfileId());
        profile.setName(req.name());
        profile.setAvatar(req.avatar() != null ? req.avatar() : "🦊");

        if (req.type() != null) {
            try {
                profile.setType(ProfileType.valueOf(req.type().toUpperCase()));
            } catch (IllegalArgumentException e) {
                profile.setType(ProfileType.ERWACHSEN);
            }
        }

        if (req.role() != null) {
            try {
                profile.setRole(Role.valueOf(req.role().toUpperCase()));
            } catch (IllegalArgumentException e) {
                profile.setRole(Role.PATIENT);
            }
        }

        if (req.pin() != null && !req.pin().isBlank()) {
            profile.setPinHash(passwordEncoder.encode(req.pin()));
        }

        // BL-H01: PIN-Länge (4 oder 6 Stellen)
        if (req.pinLength() != null && (req.pinLength() == 4 || req.pinLength() == 6)) {
            profile.setPinLength(req.pinLength());
        }

        // Altersgruppe für adaptive UI
        if (req.ageGroup() != null && !req.ageGroup().isBlank()) {
            profile.setAgeGroup(req.ageGroup());
        } else if (req.type() != null && req.type().equalsIgnoreCase("kind")) {
            profile.setAgeGroup("child_young");  // Standard für Kinder-Profile
        }

        profile = profileRepository.save(profile);

        // Default-Settings erstellen (@MapsId übernimmt profileId automatisch)
        Settings settings = new Settings();
        settings.setProfile(profile);
        settingsRepository.save(settings);

        return profile;
    }

    /**
     * Aktualisiert Name, Avatar oder PIN eines Profils.
     */
    @Transactional
    public Profile updateProfile(String id, ProfileDtos.UpdateProfileRequest req) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profil nicht gefunden: " + id));

        if (req.name() != null && !req.name().isBlank()) {
            profile.setName(req.name());
        }
        if (req.avatar() != null) {
            profile.setAvatar(req.avatar());
        }

        // PIN-Update: null = PIN entfernen, leer = unverändert lassen
        if (req.pin() == null) {
            profile.setPinHash(null); // PIN entfernen
        } else if (!req.pin().isBlank()) {
            profile.setPinHash(passwordEncoder.encode(req.pin())); // neuen PIN setzen
        }
        // leerer String "" → PIN unverändert lassen

        return profileRepository.save(profile);
    }

    /**
     * Löscht ein Profil. CASCADE löscht alle zugehörigen Entries, Settings etc.
     */
    @Transactional
    public void deleteProfile(String id) {
        if (!profileRepository.existsById(id)) {
            throw new EntityNotFoundException("Profil nicht gefunden: " + id);
        }
        profileRepository.deleteById(id);
    }

    /**
     * Prüft ob ein PIN korrekt ist (BCrypt-Vergleich).
     */
    @Transactional(readOnly = true)
    public boolean verifyPin(String profileId, String rawPin) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new EntityNotFoundException("Profil nicht gefunden: " + profileId));

        if (profile.getPinHash() == null) {
            // Kein PIN gesetzt — Zugang ohne PIN erlaubt
            return true;
        }
        if (rawPin == null || rawPin.isBlank()) {
            return false;
        }
        return passwordEncoder.matches(rawPin, profile.getPinHash());
    }

    /**
     * Lädt ein einzelnes Profil oder wirft EntityNotFoundException.
     */
    @Transactional(readOnly = true)
    public Profile getProfile(String id) {
        return profileRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profil nicht gefunden: " + id));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Hilfsmethoden
    // ═══════════════════════════════════════════════════════════════════════

    private String generateProfileId() {
        StringBuilder sb = new StringBuilder(5);
        for (int i = 0; i < 5; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return "p_" + System.currentTimeMillis() + "_" + sb;
    }
}
