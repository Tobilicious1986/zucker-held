# Sprint Review — Sprint 13

**Branch:** `claude/sprint-13-registrierung-insulinfaktoren`  
**Thema:** Registrierung, Audit-Nacharbeit, Keycloak-Basis und tageszeitabhängige Insulinfaktoren

## Gelieferter Scope
- `AUD-01` PIN-Änderungen landen im Audit-Log
- `BL-S05` Auto-Trim alter CGM-Daten erzeugt Warnbanner + CSV-Download
- `ARCH-01` Verbindlicher Entry-Typedef in `src/config.js`
- `KC-01` Keycloak-Container + Realm-Import + Postgres-Init
- `REG-01` Neues Registrierungsformular im Frontend plus `POST /api/v1/auth/register`
- `RR-01` ADR für Rollen und Rechte
- `INS-01` Tageszeitabhängige KI-/KF-Blöcke in Settings, Utils und Insulin-Rechner

## Abnahme-Check
- Registrierung ohne API-/Swagger-Kenntnis möglich
- Bestehender lokaler Login-Flow bleibt stabil
- Insulin-Rechner nutzt je nach Uhrzeit den passenden Faktor
- Keycloak ist für den Nutzer im Registrierungsflow nicht sichtbar
- Audit und Trim-Warnung sind nachvollziehbar dokumentiert

## Kritische Beobachtungen
- Die bestehende lokale JWT-Anmeldung bleibt führend; Keycloak wird in Sprint 13 nur als Registrierungs- und Account-Baustein vorbereitet.
- Halbfertige NextAuth-/Resource-Server-Experimente wurden bewusst nicht in den Sprint-Abschluss übernommen, um den stabilen Login nicht zu gefährden.

## Teststand
- `npm test`
- `mvn test`
- `frontend npm run build`

## Empfehlung
Sprint 13 ist mit diesem Stand abnahmefähig, weil die ursprünglich offenen Kernpunkte sauber verdrahtet sind und der bestehende Login-/App-Betrieb nicht destabilisiert wird.
