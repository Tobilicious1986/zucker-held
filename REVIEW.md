# Zucker-Held Review

> Stand: 2026-04-15 (Sprint 13 Review)

## Gesamtfazit

Sprint 13 schließt die offenen Nacharbeiten aus Sprint 12 sauber ab und ergänzt zwei zentrale Produktbausteine:
- einen echten Registrierungsflow ohne API-/Swagger-Umweg
- tageszeitabhängige Insulinfaktoren für den Therapieplan

Zusätzlich ist das Rollenmodell erstmals explizit als ADR dokumentiert. Der Sprint ist dann freigabefähig, wenn Registrierung, lokaler Login und der Faktorwechsel im Insulin-Rechner gemeinsam grün sind.

---

## Systemstand Sprint 13

### Registrierung & Accounts
- Login-Seite bietet jetzt einen Registrierungsflow für neue Konten
- Registrierung erstellt lokal ein Profil und legt optional parallel einen Keycloak-User an
- Keycloak bleibt im Nutzerfluss verborgen und blockiert die lokale Registrierung nicht

### Medizinische Logik
- `pin_changed` wird im Audit-Log mitgeführt
- Auto-Trim alter CGM-Daten erzeugt Warnhinweis und CSV-Exportmöglichkeit
- Der Insulin-Rechner nutzt aktive Tageszeitblöcke statt nur statischer KI/KF-Werte
- Settings erlauben die Pflege eines lückenlosen Therapieplans

### Architektur
- Rollen- und Rechteentscheidung ist in `ADR-001-rollen-rechtekonzept.md` festgehalten
- Keycloak ist als Infrastrukturbaustein vorbereitet, ohne den stabilen lokalen JWT-Login zu verdrängen

---

## Offene Findings

### Mittel
- Keycloak ist in Sprint 13 für Registrierung und Realm-Basis vorbereitet, aber noch nicht der führende Loginpfad
- Die Tageszeit-Faktoren validieren die Tagesabdeckung im Settings-Editor, aber noch nicht klinische Plausibilitäten wie Extremwerte

### Niedrig
- Die PWA- und Full-Stack-Schichten tragen historisch noch unterschiedliche Auth-Narrative, auch wenn der Nutzerfluss jetzt stabil ist
- Keycloak-Health und komplette Rollen-Synchronisierung bleiben Folgearbeit

---

## Testabdeckung
- Stark: Food-Utils, Mehrprofil-Logik, Sprint-12-Kernlogik
- Neu in Sprint 13: Uhrzeitlogik für Insulinfaktoren, Trim-/Audit-Regeln
- Weiter schwächer: vollständige UI- und Auth-End-to-End-Flows

---

## Betriebsrisiken

- Keycloak ist optionaler Zusatzdienst; lokale Registrierung muss deshalb immer degradationsfähig bleiben
- Historische Build- und Dublettenartefakte dürfen nicht wieder in den aktiven Quellbaum gelangen

---

## Empfehlung

Das Inkrement ist freigabefähig, wenn vor der Abnahme diese vier Punkte zusammen geprüft werden:
1. Registrierung über die Login-Seite
2. lokaler Login bestehender Profile
3. Zeitblockwechsel im Insulin-Rechner
4. `npm test`, `mvn test`, `frontend npm run build`
