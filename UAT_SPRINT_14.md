# UAT Sprint 14 — Einladung, Einwilligung, DSGVO, Safety

> Stand: 2026-04-15  
> Branch: `codex/sprint-14-einladung-dsgvo-safety`

## Ziel
Dieser UAT-Plan prüft, dass Sprint 14 die neuen Freigaben, Datenschutzfunktionen und Safety-Grenzen nachvollziehbar und betriebssicher abbildet.

## Testdaten / Rollen
- `Patient / Admin-Profil`
  - kann Settings, Freigaben und Share-Links verwalten
- `Familienprofil`
  - nimmt einen `LIVE_MEDICAL`-Invite an
- `Fachpersonenprofil`
  - nimmt einen lesenden `LIVE_MEDICAL`-Invite an
- `Schule / Alltag`
  - nimmt einen `SUMMARY_ONLY`-Invite an
- `Gast-Lernen`
  - nimmt einen `LEARNING_ONLY`-Invite an

## Technische Vorbedingungen
1. `./scripts/start-local-stack.sh` wurde erfolgreich ausgeführt.
2. Backend-Health ist `UP`.
3. Frontend-Login ist erreichbar.
4. Mindestens ein Patientenprofil ist vorhanden.

## UAT-01 · Privacy-Hub sichtbar und bedienbar
**Personas:** Sarah (Elternteil), Anna (Erwachsene)

Schritte:
1. Als Admin-/Patientenprofil einloggen.
2. Zu `Einstellungen` wechseln.
3. Bereich `Datenschutz & Freigaben` prüfen.
4. Datenschutz-Export auslösen.
5. Löschanfrage stellen.
6. Löschanfrage widerrufen.

Erwartet:
- Export wird als Datei ausgelöst.
- Status von Löschanfrage / Widerruf ist sichtbar.
- Zahlen zu aktiven Rollen, offenen Einladungen und Share-Links wirken plausibel.
- Hinweis auf sensible Exporte ist sichtbar.

## UAT-02 · Invite-Presets sind verständlich getrennt
**Personas:** Sarah (Elternteil), Dr. Krause (Diabetologe), Schule/Trainer

Schritte:
1. In `Einstellungen` den Invite-Flow öffnen.
2. Die Presets `Familie`, `Fachperson`, `Schule / Alltag`, `Gast-Lernen` nacheinander prüfen.
3. Je Preset die Beschreibung und den Warnhinweis lesen.
4. Für `Familie` zusätzlich zwischen `Lesend`, `Betreuung`, `Verwaltung` umschalten.

Erwartet:
- Beziehungstyp und Berechtigung werden verständlich getrennt.
- `Fachperson` bleibt lesend.
- `Schule / Alltag` kommuniziert klar, dass kein voller Live-Datenzugriff entsteht.
- `Gast-Lernen` kommuniziert klar, dass nur Lernen/Notfallhilfe gemeint ist.

## UAT-03 · Pending-Invites und Widerruf
**Personas:** Sarah (Elternteil), QA

Schritte:
1. Einen Invite erstellen.
2. Prüfen, ob er unter `Offene Einladungen` erscheint.
3. Invite widerrufen.

Erwartet:
- Pending Invite erscheint mit Beziehungstyp, Scope, Zweck und Ablaufdatum.
- Widerruf entfernt oder entwertet den Invite sichtbar.

## UAT-04 · Nur `LIVE_MEDICAL` gelangt in die Beobachtungsliste
**Personas:** Sarah (Elternteil), Dr. Krause, QA

Schritte:
1. Einen `Familie`- oder `Fachperson`-Invite mit `LIVE_MEDICAL` annehmen.
2. Einen `Schule / Alltag`-Invite annehmen.
3. Einen `Gast-Lernen`-Invite annehmen.
4. Zur Login-Seite gehen.

Erwartet:
- Nur der `LIVE_MEDICAL`-Fall erscheint unter `Ich beobachte`.
- Schule-/Alltags- und Gast-Lernen-Fälle erscheinen dort nicht.
- Toast-/Hinweistexte machen den Unterschied sichtbar.

## UAT-05 · Observer bleibt klar read-only
**Personas:** Sarah (Elternteil), Dr. Krause, Schule

Schritte:
1. Ein `LIVE_MEDICAL`-Profil über `Ich beobachte` öffnen.
2. Observer-Seite lesen.
3. Auf Lesemodus, Scope und Safety-Hinweise achten.

Erwartet:
- Sichtbarer Hinweis `Nur ansehen` oder gleichwertiger klarer Lesemodus.
- Kein UI-Element suggeriert Schreibzugriff.
- Hinweis, dass Schule/Gast-Lernen nicht in diesen Screen gehören, ist sichtbar.

## UAT-06 · Share-Modus bleibt getrennt von Invite
**Personas:** Dr. Krause, Schule, Anna

Schritte:
1. Einen Arzt-Link erzeugen.
2. Einen Mini-Link erzeugen.
3. Beide Ansichten separat öffnen.

Erwartet:
- Beide Views kommunizieren `ohne Login` und `zeitlich begrenzt`.
- Arzt-Link wirkt wie Kurzbericht.
- Mini-Link wirkt wie reduzierte Leseansicht.
- Beide sagen klar, dass sie nicht für akute Notfälle oder Schreibrechte gedacht sind.

## UAT-07 · Assistant Safety
**Personas:** Jonas (16), Anna, QA

Schritte:
1. `KI-Assistent` öffnen.
2. Chat-Modus prüfen.
3. KH-Schätzung prüfen.

Erwartet:
- Klarer Hinweis, dass keine Dosierungs- oder Therapieentscheidung getroffen wird.
- Hinweis auf Notfall-Flow bei Hypo/Hyper/Ketonen ist sichtbar.
- KH-Schätzung wird lesbar angezeigt, ohne Roh-Markup.

## UAT-08 · Notfall-Karte
**Personas:** Eltern, Schule, Pflege

Schritte:
1. `Notfall-Karte` öffnen.
2. Hypo-/Hyper-Abschnitte prüfen.
3. Eskalationshinweis unten prüfen.

Erwartet:
- Karte ist druckbar.
- Eskalation `112` bei Bewusstlosigkeit, Krampfanfall, schwerer Atemnot oder fehlender Besserung ist klar sichtbar.

## Abschlusskriterium
Sprint 14 ist review- und abnahmefähig, wenn:
- alle technischen Checks grün sind,
- die Invite-/Consent-Scope-Trennung im UAT nachvollziehbar gezeigt wurde,
- Key-User-, UI/UX- und QA-Rückmeldung gesammelt ist,
- keine UI mehr implizit Live- oder Schreibrechte verspricht, die technisch nicht existieren.
