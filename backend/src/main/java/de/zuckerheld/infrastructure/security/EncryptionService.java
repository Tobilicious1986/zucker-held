package de.zuckerheld.infrastructure.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM Verschlüsselung für API-Keys in der Datenbank.
 * IV wird zufällig generiert und dem Ciphertext vorangestellt.
 */
@Service
public class EncryptionService {

    private static final int GCM_IV_LENGTH  = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final String ALGORITHM    = "AES/GCM/NoPadding";

    @Value("${app.encryption.key}")
    private String rawKey;

    private SecretKey getKey() {
        byte[] keyBytes = rawKey.getBytes();
        byte[] key32 = new byte[32];
        System.arraycopy(keyBytes, 0, key32, 0, Math.min(keyBytes.length, 32));
        return new SecretKeySpec(key32, "AES");
    }

    /** Verschlüsselt einen Klartext-String → Base64-kodiertes Ciphertext */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) return null;
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, getKey(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] encrypted = cipher.doFinal(plaintext.getBytes());
            byte[] combined  = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Verschlüsselung fehlgeschlagen", e);
        }
    }

    /** Entschlüsselt ein Base64-kodiertes Ciphertext → Klartext */
    public String decrypt(String ciphertext) {
        if (ciphertext == null || ciphertext.isBlank()) return null;
        try {
            byte[] combined = Base64.getDecoder().decode(ciphertext);
            byte[] iv       = new byte[GCM_IV_LENGTH];
            byte[] encrypted = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, iv.length);
            System.arraycopy(combined, iv.length, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, getKey(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            return new String(cipher.doFinal(encrypted));
        } catch (Exception e) {
            throw new RuntimeException("Entschlüsselung fehlgeschlagen", e);
        }
    }
}
