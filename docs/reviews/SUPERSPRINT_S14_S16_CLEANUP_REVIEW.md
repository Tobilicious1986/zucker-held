# Review — Supersprint S14-S16 Cleanup

> Stand: 2026-04-27
> Branch: `codex/supersprint-s14-s16-cleanup`
> Status: abgeschlossen, Runtime-UAT offen

## Review-Fokus

- Wurden die dokumentierten Sprint-14/15/16-Schulden wirklich im Code geschlossen?
- Sind Rechteabläufe für Einladungscode und akzeptierten Zugriff sauber getrennt?
- Sind Fachpersonen-Freigaben lesend, fachrollenpflichtig und zeitlich begrenzt?
- Sind Tests und UAT-Status ehrlich dokumentiert?

## Code-Review-Befunde

| Bereich | Ergebnis |
|---------|----------|
| Repo-Hygiene | Root-`node_modules` wird aus Git entfernt und ignoriert; Paket-Pollution bereinigt |
| Consent/Access | Abgelaufene Links und Invites werden nicht mehr in aktiven Listen angezeigt |
| Fachpersonen | `ProfessionalRole` + Zugriffsdauer sind Teil von Backend-API und Settings-UI |
| Summary | Owner-Name und Hypo-/Hyper-Zähler werden real aus Backend-Daten gebildet |
| AI | KI-Mahlzeitenanalyse liefert kontrollierte Nichtverfügbarkeit statt Backend-Fehler |
| Build-Hygiene | Vitest ignoriert `_deleted/`; Next-Build nutzt lokale Font-Fallbacks statt Buildzeit-Google-Fetch |
| Medizin | Learning-Texte bleiben unverändert und sind vom Nutzer bestätigt |

## Testnachweise

| Check | Ergebnis |
|-------|----------|
| `npm test` | ✅ ausgeführt am 2026-04-27 — 6 Dateien, 62 Tests bestanden |
| `cd backend && mvn test` | ✅ ausgeführt am 2026-04-27 — 53 Tests bestanden, Build Success |
| `cd frontend && npm run build` | ✅ ausgeführt am 2026-04-27 — Next.js Build erfolgreich |
| Runtime-UAT | ❌ nicht ausgeführt — Docker/Docker Compose fehlt lokal, der lokale Stack kann dadurch nicht gestartet werden |

## Review-Fazit

Die geplanten Code- und Doku-Änderungen sind umgesetzt und durch Unit-/Build-Checks belegt. Die einzige verbleibende Lücke ist Runtime-UAT auf einer laufenden lokalen Instanz; diese darf erst nach installiertem Docker/Docker Compose nachgetragen werden.
