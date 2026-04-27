# Supersprint S14-S16 Cleanup

> Zeitraum: 2026-04-27
> Branch: `codex/supersprint-s14-s16-cleanup`
> Status: umgesetzt, Runtime-UAT blockiert
> Einordnung: außerplanmäßiger, unnummerierter Cleanup-Sprint. Kein Sprint 17.

## Ziel

Alle tatsächlich offenen oder nur teilweise umgesetzten Punkte aus Sprint 14, Sprint 15 und Sprint 16 schließen:
- Consent-/Access-Abläufe real prüfen und abgelaufene Rechte sauber entfernen
- CLN-01/CLN-06 als nutzbare Basis für Fachpersonen-Freigaben liefern
- T-05 und weitere Backend-Tests nachziehen
- Repo-Hygiene wiederherstellen
- keine medizinischen Texte oder Schwellen ändern

## Audit-Befund

| Bereich | Befund |
|---------|--------|
| Sprint 14 | Privacy Hub, Rollen-/Scope-Basis und Safety-Hinweise größtenteils vorhanden; abgelaufene Links wurden aber nicht in allen Listen herausgefiltert |
| Sprint 15 | Summary/Learning/Consent/Clinical-Flows vorhanden; `/consent` war nicht sichtbar verlinkt, T-05 fehlte, Summary nutzte beim Fremdzugriff keinen echten Owner-Namen |
| Sprint 16 | Sicherheitsfixes teilweise vorhanden; CLN-01/CLN-06, UAT und technische Verifikation offen |
| Repo-Hygiene | Root-`node_modules` war versioniert; lokale gh/npm-Installation hatte Root-Paketdateien verschmutzt |

## Umgesetzte Änderungen

- Root-`package.json` und `package-lock.json` von ungewollten `brew`/`homebrew`-Änderungen bereinigt.
- Root-`node_modules/` aus dem Git-Index entfernt und physisch nach `_deleted/node_modules.supersprint-root` verschoben.
- `.gitignore` um Root-`node_modules/` ergänzt.
- Vitest ignoriert `_deleted/`, damit gesicherte Altordner nicht als Testquellen eingesammelt werden.
- `ProfileLink` trennt jetzt `inviteExpiresAt` für Einladungscodes und `expiresAt` für akzeptierte Zugriffe.
- `ProfessionalRole` ergänzt: `DOCTOR`, `DIABETES_COUNSELOR`, `NURSING`, `CLINIC_ADMIN`.
- Fachpersonen-Freigaben sind lesend, fachrollenpflichtig und zeitlich begrenzt.
- Abgelaufene Links/Invites werden aus Watching-, Watcher-, Pending-, Privacy- und Consent-Flächen herausgefiltert.
- `CONSENT_HISTORY_VIEWED` ist Teil des Consent-Journals.
- `/summary/[ownerId]` nutzt den echten Owner-Namen und echte Hypo-/Hyper-Zählungen aus BZ-Einträgen.
- Settings verlinkt sichtbar nach `/consent`.
- Login-Routing ist nach `frontend/src/lib/access-routing.ts` ausgelagert und per Vitest testbar.
- `POST /api/v1/ai/analyze-meal` liefert kontrollierte `available=false`-Antworten bei fehlendem Provider-Key.
- Gemini-Fotoanalyse erhält Bilddaten als inline payload.
- Frontend-Build ist nicht mehr von Google-Font-Netzwerkzugriff abhängig.
- Medizinische Learning-Texte bleiben unverändert; der Nutzer hat die bestehenden Texte für diesen Supersprint bestätigt.

## Teststatus

| Check | Status |
|-------|--------|
| `npm test` | ✅ ausgeführt am 2026-04-27, 62 Tests bestanden |
| `cd backend && mvn test` | ✅ ausgeführt am 2026-04-27, 53 Tests bestanden |
| `cd frontend && npm run build` | ✅ ausgeführt am 2026-04-27, Next-Build erfolgreich |
| lokale Runtime / UAT Sprint 15 | ❌ nicht ausgeführt: `docker` ist lokal nicht installiert, `./scripts/start-local-stack.sh` braucht Docker Compose für Postgres/RabbitMQ/Keycloak |

## Architektur-Review

- Access-Ablauf ist jetzt eindeutig ein accepted-link-Konzept; Invite-Ablauf ist getrennt.
- Fachpersonen-Rollen erweitern `ProfileLink`, ohne ein neues Consent-Domänenmodell vorwegzunehmen.
- `expiresAt` bleibt API-kompatibel als Access-Ablauf erhalten; neue Clients nutzen zusätzlich `inviteExpiresAt` und `accessDurationHours`.
- `V16__professional_invites_and_expiry_semantics.sql` korrigiert bestehende Daten und die Consent-Journal-View, ohne die bestehende V15-Migration zu verändern.
- Medizinische Inhalte wurden nicht fachlich verändert.

## Offene Punkte

- Runtime-UAT kann erst nach erfolgreichem lokalen Stack-Start abgeschlossen und mit echten Ergebnissen markiert werden; Voraussetzung: Docker/Docker Compose lokal verfügbar.
- CLN-03 Visit Pack, EDU-01 und Interop-Themen bleiben Roadmap-Punkte, nicht Teil dieses Cleanup-Supersprints.
