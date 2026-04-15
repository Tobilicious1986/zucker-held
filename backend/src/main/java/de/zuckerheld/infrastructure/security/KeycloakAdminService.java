package de.zuckerheld.infrastructure.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Erstellt bei Bedarf einen Keycloak-User parallel zur lokalen Profilerstellung.
 * Wenn Keycloak nicht erreichbar ist, bleibt die lokale Registrierung trotzdem funktionsfähig.
 */
@Service
public class KeycloakAdminService {

    private static final Logger log = LoggerFactory.getLogger(KeycloakAdminService.class);

    @Value("${KEYCLOAK_ADMIN_URL:http://localhost:8180}")
    private String keycloakAdminUrl;

    @Value("${KEYCLOAK_ADMIN_USER:admin}")
    private String adminUser;

    @Value("${KEYCLOAK_ADMIN_PASSWORD:zuckerheld_dev_pw}")
    private String adminPassword;

    @Value("${KEYCLOAK_REALM:zuckerheld}")
    private String realm;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean createUser(String email, String name, String password, String profileType) {
        try {
            String adminToken = getAdminToken();
            if (adminToken == null) return false;

            Map<String, Object> userRepresentation = Map.of(
                "username", email,
                "email", email,
                "firstName", name,
                "enabled", true,
                "attributes", Map.of(
                    "profileType", List.of(profileType != null ? profileType : "erwachsen")
                ),
                "credentials", List.of(Map.of(
                    "type", "password",
                    "value", password,
                    "temporary", false
                )),
                "realmRoles", List.of("zh-patient")
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(adminToken);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(userRepresentation, headers);
            String url = keycloakAdminUrl + "/admin/realms/" + realm + "/users";

            restTemplate.postForEntity(url, entity, Void.class);
            log.info("[Keycloak] User angelegt: {}", email);
            return true;
        } catch (HttpClientErrorException.Conflict e) {
            throw new EmailAlreadyExistsException("E-Mail-Adresse ist bereits vergeben.");
        } catch (Exception e) {
            log.warn("[Keycloak] Registrierung nur lokal fortgesetzt: {}", e.getMessage());
            return false;
        }
    }

    private String getAdminToken() {
        try {
            String tokenUrl = keycloakAdminUrl + "/realms/master/protocol/openid-connect/token";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "password");
            body.add("client_id", "admin-cli");
            body.add("username", adminUser);
            body.add("password", adminPassword);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                tokenUrl,
                new HttpEntity<>(body, headers),
                Map.class
            );

            return response != null ? (String) response.get("access_token") : null;
        } catch (Exception e) {
            log.debug("[Keycloak] Admin-Token konnte nicht geholt werden: {}", e.getMessage());
            return null;
        }
    }

    public static class EmailAlreadyExistsException extends RuntimeException {
        public EmailAlreadyExistsException(String message) {
            super(message);
        }
    }
}
