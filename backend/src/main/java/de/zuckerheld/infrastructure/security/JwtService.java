package de.zuckerheld.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /** Erstellt ein kurzlebiges Access-Token */
    public String generateToken(String profileId, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("type", "access");
        return buildToken(claims, profileId, expirationMs);
    }

    /** Erstellt ein langlebiges Refresh-Token */
    public String generateRefreshToken(String profileId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        return buildToken(claims, profileId, refreshExpirationMs);
    }

    /** Erstellt ein Admin-Token für die laufende Session (15 Minuten) */
    public String generateElevatedToken(String profileId, String baseRole) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "admin");
        claims.put("baseRole", baseRole);
        claims.put("elevated", true);
        claims.put("type", "access");
        return buildToken(claims, profileId, 15 * 60 * 1000L); // 15 Minuten
    }

    private String buildToken(Map<String, Object> extraClaims, String subject, long expMs) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractProfileId(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isRefreshToken(String token) {
        try {
            String type = extractAllClaims(token).get("type", String.class);
            return "refresh".equals(type);
        } catch (Exception e) {
            return false;
        }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
