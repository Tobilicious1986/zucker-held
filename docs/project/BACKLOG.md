# Zucker-Held — Produkt-Backlog

> Letzte Aktualisierung: 2026-04-15 (Sprint 13 abgeschlossen, Strategie- und Nutzendenkonzept erweitert)  
> Primäre Nutzer: Malte (8, T1D), Familie (Eltern, Oma), Jugendliche (16), Erwachsene, Ärzte

---

## 🎯 Produkt-Vision — Skalierung auf Klinik-Empfehlung

> Aufgenommen Sprint-12-Review, 2026-04-15

Die langfristige Vision ist: **Krankenhäuser, Diabetes-Ambulanzen und niedergelassene Diabetologen empfehlen Zucker-Held ihren Patienten und Angehörigen.** Nicht als proprietäres Klinik-Tool, sondern als vertrauenswürdige Alltagsbegleitung, die der Patient selbst besitzt und die Klinik sicher anschauen kann.

Das hat fundamentale Konsequenzen für Architektur, Rollen und Betrieb:

### Was sich bei vielen Nutzern ändert

| Heute | Bei Skalierung |
|---|---|
| Ein Profil per lokalem PIN | Account mit E-Mail + Passwort (DSGVO-konform) |
| Familie teilt ein Gerät | Jeder hat eigenen Account, verknüpft über Einladung |
| Klinik sieht nichts | Klinik bekommt lesenden Zugriff — nur mit Einwilligung des Patienten |
| Admin = Elternteil | Rollen: Patient, Elternteil, Pflegeperson, Diabetesberater, Arzt, Klinik-Admin |
| Einzelnes Gerät offline | Multi-Device, Cloud-Sync, PWA offline-first |
| Keine Mandantentrennung nötig | Harte Datenisolation: Patient A sieht niemals Daten von Patient B |

### Rollen-Vision (Sprint 13+ Grundlage)

```
Patient          — volles Self-Management, eigene Daten, Einwilligung steuert Zugriff
Elternteil       — Admin-Zugang zum Kind-Profil, kann Einträge anlegen und Settings ändern
Betreuer         — lesend + schreibend, kein Settings-Zugang, kein Datenlösch-Recht
Pflegepersonal   — wie Betreuer, aber auf mehrere Patienten gleichzeitig
Diabetesberater  — lesend, kann Kommentare/Empfehlungen hinterlassen, kein Schreibzugriff auf Einträge
Arzt             — lesend, gefilterter Arzt-View (keine persönlichen Notizen), FHIR-Export
Klinik-Admin     — verwaltet Klinik-Einladungen, sieht aggregierte Statistiken (anonym), kein Patientenzugriff ohne Einwilligung
```

**Datenschutz-Grundsatz:** Kein Klinik-Mitarbeiter bekommt automatisch Zugriff. Jede Freigabe ist eine explizite Einwilligung des Patienten — zeitlich begrenzt, widerrufbar, protokolliert im Audit-Log.

---

## 🧭 Strategische Produkt-Richtung (ab Sprint 14)

### Leitbild
Zucker-Held wird als **DACH Familien-first, T1D-first, Empfehlung-zuerst** geplant:
- zuerst die beste Begleit-App für frisch diagnostizierte Familien und deren Umfeld
- dann die verlässliche Empfehlung aus Klinik, Ambulanz und Schulung
- später darauf aufbauend ein möglicher Verordnungs-/DiGA-Pfad

Die App soll nicht nur Logbuch sein, sondern **Diagnose-, Lern-, Sicherheits- und Begleitplattform**.

Die verdichtete Persona-, Stakeholder- und Markt-Synthese liegt ergänzend in `docs/project/PRODUCT_STRATEGY.md`.

### Führende Zielsegmente
- **Primär:** frisch diagnostizierte T1D-Kinder/Jugendliche und ihre Familien
- **Sekundär:** Erwachsene mit T1D und deren Partner/Begleitpersonen
- **Tertiär:** Diabetesberater, Ärzte, Pflegepersonal, Schule/Trainer als freigegebene Begleiter

### Klare Trennung der Nutzergruppen
- **Patient / Betroffener:** besitzt die Gesundheitsdaten, steuert Einwilligungen, sieht Vollansicht
- **Angehörige / Begleitungen:** Eltern, Partner, Geschwister, Großeltern, enge Betreuung; je nach Rolle lesen, dokumentieren oder administrieren
- **Professionelle:** Arzt, Diabetesberater, Pflege, Klinik-Admin; nur freigegeben, zeitlich begrenzt, protokolliert
- **Bildungsnutzer ohne Live-Daten:** Lehrkräfte, Freunde, weitere Familie; kein Live-Zugriff, nur Lern-/Notfallinhalte

### Produkteinstiege (Zielbild)
Niemand startet langfristig im selben generischen Flow. Die App bekommt vier getrennte Einstiege:
1. `Ich habe Diabetes`
2. `Ich begleite jemanden`
3. `Ich bin Fachperson`
4. `Ich will lernen / Notfallhilfe`

### Was uns zur Marktführerschaft noch fehlt
- Diagnose-Startpfad für die ersten Tage nach Erstdiagnose
- Rollen- und Einwilligungsmodell für Familie, Schule und Klinik
- strukturierte Lernakademie statt nur statischem Lernmodul
- klinisch brauchbare Übergabe- und Terminpakete
- Datenschutz-, Lösch-, Export- und Widerrufslogik als sichtbare Produktfunktion
- Mobile-, Accessibility- und Performance-Politur für den echten Alltagsbetrieb

### Neue Epics ab Sprint 14

#### EPIC A · Diagnose-Start & Lernakademie
- `EDU-01` Diagnosemodus: 14-Tage-Startpfad nach Erstdiagnose
- `EDU-02` Rollenbasierte Lernpfade für Kind, Teen, Eltern, Partner, Geschwister, Schule, Fachpersonal
- `EDU-03` Teach-back-Checks: kleine Verständnisprüfungen statt nur Lesen
- `EDU-04` Klinik-/Schulpaket als druck- und teilbarer Lern-/Notfallsatz
- `EDU-05` Content-System für medizinisch kuratierte Lerninhalte, Versionierung und Review
- `EDU-06` Mehrsprachigkeit und leichte Sprache für Diagnose-/Notfallinhalte

#### EPIC B · Care Network & Rechte
- `NET-01` Haushalts-/Familienkonto mit sauberer Rollenmatrix
- `NET-02` Einwilligungszentrale: wer sieht was, wie lange und zu welchem Zweck
- ~~`NET-03` Trennung zwischen Live-Daten-Zugriff und Nur-Lernen-/Gastzugriff~~ ✅ Sprint 15
- `NET-04` Schule-/Trainer-/Tagesbetreuung als eigene, sicher eingeschränkte Rolle
- `NET-05` Geschwister-/Partner-Modus mit begrenzten Alltagshilfen statt medizinischer Vollansicht
- ~~`NET-06` Rechtejournal: jederzeit sichtbare Freigabe- und Widerrufshistorie~~ ✅ Sprint 15

#### EPIC C · Klinik-Readiness
- `CLN-01` Klinik-/Ambulanz-Einladung mit zeitlich begrenztem Zugriff
- ~~`CLN-02` strukturierter Arzt-/Berater-View statt generischer Share-Seite~~ ✅ Sprint 15
- `CLN-03` Visit Pack: Kurzbericht für Aufnahme, Entlassung, Ambulanztermin
- `CLN-04` Diagnose-QR/Empfehlungsflow für Station und Ambulanz
- `CLN-05` FHIR-/ePA-/Export-Roadmap als eigenes Interop-Epic
- `CLN-06` Rollen für Diabetesberater, Pflege, Arzt, Klinik-Admin produktiv schneiden

#### EPIC D · Sicherheit, Vertrauen, DSGVO
- `TRU-01` Recht auf Auskunft, Export, Löschung und Freigabewiderruf
- `TRU-02` Safety-Layer für Chat, Vorschläge und Notfallhinweise
- `TRU-03` Klinische Inhaltsfreigabe: medizinisch sensible Texte nur reviewt veröffentlichen
- `TRU-04` Verlässlichkeits- und Offline-Strategie für Familie, Schule und Kliniktermine
- `TRU-05` Privacy-by-default: minimale Sichtbarkeit je Rolle
- `TRU-06` Governance für Dokumentation, Architektur-Review und klinische Review-Pflicht

#### EPIC E · Massentauglichkeit & Wachstum
- `GTM-01` Onboarding, Referral und Empfehlungssystem für Familien
- `GTM-02` Familien-Aktivierung: erst Patient, dann Begleitung, dann Schule/Arzt
- `GTM-03` Versorgungs-KPIs: Aktivierung, verbundene Begleiter, Lernabschluss, Erstfreigabe
- `GTM-04` Accessibility, Performance und Low-Friction-Mobile-Fokus
- `GTM-05` Device-/Ökosystem-Roadmap statt Einzellösungen
- `GTM-06` Positionierung: Zucker-Held ist nicht nur Logbuch, sondern Diagnose-, Lern-, Sicherheits- und Begleitplattform

---

## ⚙️ Verbindliche Prozessregeln (ab Sprint 13)

### P-01 · Testpflicht pro Sprint
Jeder Sprint der neuen Code liefert **muss** Testfälle mitliefern.
- Neue Funktionen: mindestens 1 Happy-Path + 1 Fehlerfall
- Geänderte Funktionen: bestehende Tests aktualisieren
- Testsuite muss am Sprint-Ende vollständig grün sein
- **Fehlende oder rote Tests sind ein Release-Blocker**

### P-02 · Backlog-Review nach jedem Sprint
Nach jedem Sprint ist das Backlog zu prüfen und fortzuschreiben:
- Abgeschlossene Tickets als ✅ markieren
- Neue Findings und Nacharbeiten aufnehmen
- Prioritäten neu bewerten
- Kein Sprint ohne aktuelles Backlog

---

## ✅ Fertig (zuletzt implementiert)

| ID | Feature | Sprint |
|----|---------|--------|
| BL-01 | Insulin-Dosierungs-Rechner | Sprint 1 |
| BL-02 | 7-Tage-Chart (renderFullChart) | — |
| BL-03 | localStorage Fehlerbehandlung | Sprint 1 |
| BL-04 | Admin/Betreuer-Modus | Sprint 1 |
| BL-07 | Browser-Benachrichtigungen | Sprint 1 |
| BL-S01 | Insulin-Rechner: Warnung bei unrealistischen Parametern | Sprint 2 |
| BL-S06 | Korrektur-Fenster im Insulin-Rechner | Sprint 2 |
| BL-M04 | Hinweis wenn kein BZ eingegeben | Sprint 2 |
| BL-M06 | Kinderfreundliche Alert-Texte | Sprint 2 |
| BL-H06 | Streak-Anzeige auf Dashboard | Sprint 2 |
| BL-H08 | Ketone-Warnung & DKA-Protokoll | Sprint 2 |
| NEU-F1 | Familien-Rollen: profile_links + Einladungsflow | Sprint 3 |
| NEU-F2 | Ampel-Dashboard für Betreuer (Observer Page) | Sprint 3 |
| NEU-F3 | Geführter Notfall-Flow für Betreuer | Sprint 3 |
| NEU-F4 | Adaptive UI: useAgeGroup Hook (child_young/child_teen/adult) | Sprint 3 |
| BL-H01 | Admin-PIN auf 4 oder 6 Stellen (pinLength) | Sprint 3 |
| BL-H02 | Elevation Session-Timeout (15 Min, elevationExpiresAt) | Sprint 3 |
| NEU-F8 | Sport-/Aktivitäts-Kontext mit BZ-Warnungen | Sprint 4 |
| NEU-F9 | Tages-Zusammenfassung per Queue/Scheduler | Sprint 4 |
| NEU-F10 | Druckbare Notfall-Karte | Sprint 4 |
| NEU-F11 | Gamification / XP-Widget | Sprint 4 |
| BL-H03 | CSV-Export | Sprint 4 |
| BL-H07 | Mahlzeit-Favoriten | Sprint 4 |
| NEU-F6 | Arzt-Link ohne Login | Sprint 5 |
| NEU-F12 | Dark Mode Basis | Sprint 5 |
| NEU-F14 | Mini-Share-Modus | Sprint 5 |
| NEU-F15 | Konsensus-Kennzahlen (TIR, GMI, CV) | Sprint 5 |
| NEU-F7 | Muster-Erkennung Basis | Sprint 5 |
| NEU-F13 | Adaptiver Bolus-Hinweis | Sprint 6 |
| NEU-F5 | Eltern-Ping Basis | Sprint 6 |
| BL-L04 | PIN-Rate-Limiting | Sprint 6 |
| BL-L05 | Audit-Log für Admin-Aktionen | Sprint 6 |
| NEU-F17 | CGM-/Nightscout-Gap-Erkennung | Sprint 8 |
| NEU-F26 | Datenqualitätsindikatoren | Sprint 8 |
| SR-04 / NEU-F21 | Muster-Erkennung mit Zeitfenstern | Sprint 8 |
| UX-00 | Designsystem-Basis, App-Shell und Experience Overhaul | Sprint 9 |
| BR-01 | Settings-Schreibflow wieder funktionsfähig | Sprint 9 |
| BR-02 | Invite-/Watcher-Flow wieder funktionsfähig | Sprint 9 |
| BR-03 | KI-Chat kontrolliert degradiert statt 500 | Sprint 9 |
| SR-03 / NEU-F18 | Arzt-Link als druckbarer Kurzbericht | Sprint 9 |
| SR-01 / NEU-F14 | Mini-Share klar auf Lesemodus begrenzt | Sprint 9 |
| SR-06 / NEU-F5 | Eltern-Ping mit Zustellfeedback | Sprint 9 |
| FD-01 | DACH-Food-Katalog (300+ kuratierte Built-ins mit Aliases und Portionspresets) | Sprint 11 |
| FD-02 | Hybride Food-Suche: lokal + explizite Open-Food-Facts-Online-Suche | Sprint 11 |
| FD-03 | KH-Rechner mit Barcode, Portionen und Meal-Handoff | Sprint 11 |
| AUD-01 | `pin_changed`-Audit-Log für Profil-PIN-Änderungen | Sprint 13 |
| BL-S05 | Warnbanner + CSV-Export nach Auto-Trim alter CGM-Daten | Sprint 13 |
| ARCH-01 | Verbindlicher Entry-Typedef für Widgets und Module | Sprint 13 |
| KC-01 | Keycloak-Basis in Docker Compose inkl. Realm-Import | Sprint 13 |
| REG-01 | Registrierungsformular mit lokalem Direkt-Login nach Erstellung | Sprint 13 |
| RR-01 | ADR-001 Rollen- und Rechtekonzept | Sprint 13 |
| INS-01 | Tageszeitabhängige Insulinfaktoren im Therapieplan | Sprint 13 |
| ARC-FIX-01 | Merge-Konflikt settings.js aufgelöst (getActiveUser + updateProfile) | Sprint 10 |
| BR-04 / UX-01 | Observer-/Betreuer-Schreibschutz: minRole patient, canWrite-Guard, Rollen-Banner | Sprint 10 |
| UX-02 | Settings: Post-Save Field-Refresh — verhindert visuelle Divergenz bei normalisierten Werten | Sprint 10 |
| UX-03 | Sekundärseiten: inline-style entfernt (history.js), CSS-Vars für log-entry-icon-Farben | Sprint 10 |
| UX-04 | Kind-Theme verstärkt (mehr Luft, größere Inputs, prominent Greeting, surface-1) | Sprint 10 |
| ARC-01 | Architektur-Review: canWrite-Guards in bz/insulin/meal/activity; Role-Banner CSS-Vars | Sprint 10 |
| SEC-01 | PIN-Hashing: SHA-256 via Web Crypto API (kein Klartext mehr) | Sprint 12 |
| SEC-02 | Observer-Write-Guard: Beobachter können nicht speichern (medizinisch kritisch) | Sprint 12 |
| SEC-03 | Audit-Log schärfen: 5 kritische Admin-Events + Anzeige in Settings | Sprint 12 |
| SEC-04 | Service Worker Cache v12: food.js Network-First, neue Widgets gecacht | Sprint 12 |
| UX-02 | Settings: Dirty-State-Indikator für medizinische Felder | Sprint 12 |
| UX-03 | Sekundärseiten konsistent im Design-System | Sprint 12 |
| UX-04 | Nav Deutsch, kind_young Altersgruppen-Theme (große Buttons, runde Ecken) | Sprint 12 |
| BL-M02 | BZ-Trendpfeil (↗ ↘ →) aus letzten 2 Messungen | Sprint 12 |
| BL-M03 | BZ-Hero-Widget: aktueller BZ groß + Trendpfeil auf Dashboard | Sprint 12 |
| BL-M01 | Tägliche Challenges (BZ messen, Mahlzeit loggen, Aktivität) + Coins | Sprint 12 |
| TECH-01 | Barcode-Scanner: manueller EAN-Fallback wenn BarcodeDetector fehlt | Sprint 12 |

---

---

## 🔵 Sprint 13 — Abgeschlossen (historischer Scope)

> Dieser Abschnitt bleibt als Scope-Referenz erhalten. Die Punkte sind mit Sprint 13 umgesetzt und zusätzlich in die Tabelle `✅ Fertig` übernommen.

### REG-01 · Registrierung im Frontend (Next.js, Port 3100) 🔴 KRITISCH
**Aufgenommen:** Sprint-12-Review, 2026-04-15  
**Problem:** Es gibt kein Registrierungsformular. Der erste Account muss manuell via API/Swagger angelegt werden — das ist für Endnutzer (Patienten, Eltern) unzumutbar und kein Release-fähiger Zustand.  
**Lösung:**
- Login-Seite bekommt „Neues Profil erstellen"-Button (unterhalb der Profilliste, sichtbar wenn keine Profile vorhanden)
- Formular: Name, Avatar-Auswahl, Typ (Kind / Erwachsener), PIN (optional), PIN-Länge
- Aufruf: `POST /api/v1/profiles` (Endpunkt bereits vorhanden, kein Auth nötig)
- Nach Erstellung: direkt auf Dashboard weiterleiten (Auto-Login)
- Validierung: Name Pflicht, PIN wenn gesetzt min. 4 Stellen, Fehlerhinweise im Formular

**Dateien (Frontend):**
- `frontend/src/app/login/page.tsx` — „Neues Profil erstellen"-Flow ergänzen
- ggf. neue Komponente `frontend/src/components/CreateProfileModal.tsx`

**Akzeptanzkriterium:** Ein komplett neuer Nutzer (leere Datenbank) kann ohne API-Kenntnisse in unter 60 Sekunden ein Profil anlegen und ist danach eingeloggt.

---

### RR-01 · Rollen- und Rechtekonzept überarbeiten (Architektur-Entscheidung) 🟠 HOCH
**Aufgenommen:** Sprint-12-Review, 2026-04-15  
**Kontext:** Langfristige Vision ist Klinik-Empfehlung an Patienten und Familien — potentiell sehr viele Nutzer, unterschiedliche Stakeholder (Patienten, Eltern, Ärzte, Pflegepersonal, Diabetesberater, Klinik-Admins). Das aktuelle Rollenmodell (`observer`, `caregiver`, `patient`, `admin`) ist auf Familien-Kleingruppen ausgelegt und skaliert nicht auf diese Breite.

**Zu klären und entscheiden:**

1. **Account-Modell:** Aktuell Profile ohne E-Mail/Passwort — reicht das für viele Nutzer? Oder brauchen wir E-Mail-Verifizierung + Passwort-Reset?
2. **Neue Rollen:**
   - `diabetesberater` — lesend, kann Empfehlungen hinterlassen
   - `pflegepersonal` — wie caregiver, aber auf mehrere Patienten gleichzeitig
   - `arzt` — gefilterter Arzt-View, FHIR-Export-Recht
   - `klinik_admin` — verwaltet Einladungen der Klinik, keine Patientendaten
3. **Einwilligungskonzept:** Patient steuert explizit, wer was sieht — zeitlich begrenzt, widerrufbar, im Audit-Log protokolliert. Kein automatischer Klinik-Zugriff.
4. **Datenisolation:** Harte Mandantentrennung auf DB-Ebene (Row-Level Security in PostgreSQL) oder auf Service-Ebene — Entscheidung notwendig vor Skalierung.
5. **DSGVO-Checkliste:** Recht auf Löschung, Recht auf Auskunft, Datenminimierung, Auftragsverarbeitungsvertrag wenn Kliniken involviert.

**Ergebnis dieses Tickets:** Nicht Code, sondern ein **Architektur-Entscheidungsdokument (ADR)** + aktualisierte Rollentabelle in `docs/project/ARCHITECTURE.md` + angepasste DB-Migration-Strategie.

**Abhängigkeiten:** REG-01 sollte so gebaut werden, dass es das spätere Rollenmodell nicht verbaut (z.B. E-Mail-Feld optional vorsehen).

---

### INS-01 · Tageszeit-abhängige Insulinfaktoren (KI + KF nach Uhrzeit) 🟠 HOCH
**Aufgenommen:** Sprint-12-Review, 2026-04-15  
**Hintergrund (klinisch):** Jede Diabetes-Klinik berechnet für jeden Patienten individuell unterschiedliche Insulinfaktoren je nach Tageszeit. Der Grund: Insulinresistenz und Hormonspiegel (Cortisol, Wachstumshormon) variieren stark über den Tag. Typischer Therapieplan aus der Ambulanz:

| Zeitblock | KI (g KH pro IE) | KF (mg/dL pro IE) |
|---|---|---|
| Nacht 00:00–06:00 | 8 g / IE | 20 mg/dL |
| Morgen 06:00–11:00 | 10 g / IE | 25 mg/dL |
| Mittag 11:00–17:00 | 12 g / IE | 30 mg/dL |
| Abend 17:00–22:00 | 10 g / IE | 28 mg/dL |
| Spätabend 22:00–00:00 | 9 g / IE | 22 mg/dL |

**Kontext Omnipod 5 + Dexcom G7:** Im Closed-Loop-Modus berechnet der Omnipod 5 selbst die Basaldosis. Die manuell hinterlegten Faktoren werden trotzdem gebraucht:
- Beim **manuellen Modus** (z.B. Sensor-Ausfall, Wechseltag, Sport-Modus) rechnet die App mit diesen Werten
- Für die **Mahlzeit-Bolus-Vorberechnung** im KH-Rechner (der Omnipod bestätigt, aber der Vorschlag kommt aus der App)
- Für den **KI-Assistenten** wenn er Dosierungsvorschläge kommentiert

**Problem heute:** `state.settings.insulinRatio` und `state.settings.correctionFactor` sind einzelne Zahlen. Der Insulin-Rechner nimmt immer diesen Wert — unabhängig davon ob es 7 Uhr morgens oder 23 Uhr nachts ist.

**Lösung — neues Datenmodell:**

```js
// NEU: insulinFactors ersetzt insulinRatio + correctionFactor
settings.insulinFactors = [
  { id: 'f1', label: 'Nacht',      from: '00:00', to: '06:00', ki: 8,  kf: 20 },
  { id: 'f2', label: 'Morgen',     from: '06:00', to: '11:00', ki: 10, kf: 25 },
  { id: 'f3', label: 'Mittag',     from: '11:00', to: '17:00', ki: 12, kf: 30 },
  { id: 'f4', label: 'Abend',      from: '17:00', to: '22:00', ki: 10, kf: 28 },
  { id: 'f5', label: 'Spätabend',  from: '22:00', to: '00:00', ki: 9,  kf: 22 },
]
// Fallback wenn kein Zeitblock passt oder kein Array vorhanden:
settings.insulinRatio       = 10   // bleibt als Legacy-Fallback
settings.correctionFactor   = 30   // bleibt als Legacy-Fallback
```

**Neue Hilfsfunktion in `src/utils.js`:**
```js
export function getActiveInsulinFactor(settings, now = new Date()) {
  const factors = settings.insulinFactors;
  if (!factors?.length) return { ki: settings.insulinRatio || 10, kf: settings.correctionFactor || 30 };
  const hhmm = now.getHours() * 60 + now.getMinutes();
  return factors.find(f => {
    const [fh, fm] = f.from.split(':').map(Number);
    const [th, tm] = f.to.split(':').map(Number);
    const from = fh * 60 + fm;
    const to   = th * 60 + tm;
    return to > from ? (hhmm >= from && hhmm < to) : (hhmm >= from || hhmm < to); // Mitternacht-Wrap
  }) ?? { ki: settings.insulinRatio || 10, kf: settings.correctionFactor || 30 };
}
```

**Migration:** Beim `load()` in `state.js`: wenn `insulinFactors` nicht vorhanden → einen Standardblock `00:00–24:00` mit alten Werten anlegen. Kein Datenverlust.

**UI-Änderungen in Settings:**
- Bisherige zwei Felder (KI, KF) bleiben als vereinfachte Fallback-Ansicht
- Neuer Bereich „Tageszeit-Faktoren (Therapieplan)" mit Zeitblock-Tabelle
- Zeitblöcke sind editierbar: von/bis, KI, KF, Label
- Zeitblöcke müssen 00:00–24:00 lückenlos abdecken (Validierung)
- Hinweis: „Diese Werte stammen aus deinem Therapieplan. Nur nach Rücksprache mit deiner Diabetes-Ambulanz ändern."
- Admin-Gate schützt diese Einstellung

**Betroffene Dateien:**
- `src/state.js` — neues Feld `insulinFactors[]`, Migration
- `src/utils.js` — `getActiveInsulinFactor()`
- `src/modules/insulin.js` — `_calcInsulinDose()` nutzt `getActiveInsulinFactor()` statt direktem Feld-Zugriff
- `src/modules/settings.js` — Zeitblock-UI, Validierung
- `src/config.js` — Standard-Zeitblöcke als Konstante
- Tests: `tests/sprint13.test.js` — `getActiveInsulinFactor()` mit Uhrzeit-Mocks

**Akzeptanzkriterien:**
- Um 08:00 wird KI Morgen-Wert genutzt, um 23:00 der Nacht-Wert
- Mitternacht-Wrap (Zeitblock 22:00–06:00 über Mitternacht hinweg) funktioniert korrekt
- Fehlt `insulinFactors` → Fallback auf `insulinRatio`/`correctionFactor` ohne Absturz
- Settings zeigt Zeitblock-Tabelle, Felder sind geschützt hinter Admin-Gate
- Insulin-Rechner zeigt welcher Zeitblock gerade aktiv ist: „🌙 Nacht-Faktor: 8g KH / IE"

---

### MSG-01 · Familien-Messaging: verschlüsselte Nachrichten innerhalb der Gruppe 🟠 HOCH
**Aufgenommen:** Sprint-12-Review, 2026-04-15  
**Beschreibung:** Mitglieder einer verbundenen Familie oder Betreuungsgruppe können sich gegenseitig Nachrichten schicken — direkt in der App, ohne externe Dienste. Der typische Anwendungsfall: Mutter schreibt Malte „Schalte mal in den Sportmodus" oder „Du hast 40g KH gegessen, überleg ob du 1 IE brauchst."

**⚠️ Medizinisch-rechtlicher Rahmen (wichtig für Umsetzung):**  
Nachrichten zu Insulindosierungen sind **Empfehlungen von Familienmitgliedern**, keine ärztlichen Anweisungen. Die App muss das klar kennzeichnen:
- Aktions-Vorschläge tragen den Absender-Namen und einen Disclaimer: „Empfehlung von Mama — nicht als Anweisung verstehen"
- Notfälle (BZ < 55, DKA) leiten immer zum SOS-Flow weiter, nicht zum Chat
- Kein Arzt oder Klinik-Mitarbeiter kann über den Chat Dosierungsanweisungen geben (andere Rolle, anderer Haftungsrahmen)

---

#### Gruppen-Konzept

Die Gruppe ergibt sich aus bestehenden `profile_links`. Jeder Patient (Owner) hat eine implizite **Familiengruppe** = alle Watcher die ihn verknüpft haben (Status ACCEPTED).

```
Malte (patient/owner)
  ├── Sarah (caregiver) ─── Gruppenkanal: Sarah ↔ Malte
  ├── Papa (caregiver) ──── Gruppenkanal: Papa ↔ Malte
  └── Oma (observer) ────── Gruppenkanal: Oma ↔ Malte
                             Gruppenkanal: Alle ↔ alle (Familien-Feed)
```

Nachrichten können **1:1** (z.B. Mama → Malte) oder **an die ganze Gruppe** gesendet werden.

---

#### Nachrichtentypen

| Typ | Beschreibung | Beispiel |
|---|---|---|
| `TEXT` | Freier Text | „Bitte Wasser trinken, war ein heißer Tag 🌡️" |
| `BZ_SHARE` | Aktueller BZ automatisch angehängt | „Mein BZ: 210 mg/dL · vor 3 Min. gemessen" |
| `ACTION_SUGGESTION` | Strukturierter Vorschlag mit Kategorie | „💉 Vorschlag: 1 IE Korrektur prüfen" / „🏃 Sport-Modus einschalten" |
| `PING` | Schnell-Ping ohne Text | ❤️ „Alles ok bei dir?" (einfache Rückmeldung: 👍 / 👎) |

**ACTION_SUGGESTION-Kategorien** (konfigurierbar, kein Freitext für Dosierungen):
- `SPORT_MODE` — Sport-Modus einschalten
- `CHECK_BZ` — BZ messen
- `EAT_CARBS` — Kohlenhydrate essen (bei Hypo)
- `INSULIN_CHECK` — Insulin-Bedarf prüfen (kein konkreter IE-Wert, nur Hinweis)
- `CALL_ME` — Bitte ruf an
- `CUSTOM` — Freitext-Vorschlag (nur für caregiver/admin, nicht für observer)

> **Begründung für strukturierte Kategorien:** Konkrete IE-Werte per Chat zu schicken ist medizinisch riskant. Die App schlägt stattdessen vor, den Insulin-Rechner zu öffnen — der nutzt dann die persönlichen Faktoren (inkl. INS-01 Tageszeit-Faktoren).

---

#### Technische Architektur

**Echtzeit-Transport: WebSocket + STOMP + RabbitMQ**

```
Frontend (Browser)
  └── WebSocket-Verbindung zu /ws
        ├── SUBSCRIBE /user/{profileId}/queue/messages → eingehende Nachrichten
        └── SEND /app/chat/send → Nachricht abschicken

Spring Boot Backend
  ├── WebSocketConfig (STOMP-Broker-Relay → RabbitMQ)
  ├── ChatController (@MessageMapping /chat/send)
  │     ├── Empfänger aus ProfileLink bestimmen
  │     ├── Nachricht verschlüsseln (server-side, AES-256)
  │     ├── in DB persistieren
  │     └── via RabbitMQ an Empfänger-Queue routen
  └── RabbitMQ
        └── zh.queue.chat-{profileId} (neu, durable, TTL 7 Tage)
```

**Warum RabbitMQ als STOMP-Broker?** Spring Boot kann RabbitMQ direkt als STOMP-Broker nutzen (`StompBrokerRelay`) — die bestehende RabbitMQ-Infrastruktur wird einfach erweitert, kein zweiter Message-Broker nötig.

---

#### Verschlüsselungskonzept (zwei Stufen)

**Stufe 1 — Transport (immer):** HTTPS/WSS — Nachrichten sind in Transit verschlüsselt. Bereits vorhanden.

**Stufe 2 — At-Rest-Verschlüsselung (Sprint 13):**  
Message-Content wird auf dem Server mit AES-256-GCM verschlüsselt bevor er in die DB geschrieben wird. Der Schlüssel ist pro Familiengruppe und wird aus einem Gruppen-Secret (bei Invite-Erstellung generiert, niemals als Klartext in DB) abgeleitet. Server kann den Inhalt nur entschlüsseln wenn der Gruppen-Schlüssel bekannt ist.

**Stufe 3 — Client-seitige E2E (späterer Sprint):**  
Jedes Profil bekommt bei Erstellung ein asymmetrisches Schlüsselpaar (Web Crypto API, ECDH P-256). Der Public Key wird auf dem Server gespeichert. Der Private Key verlässt den Browser nie. Nachrichten werden mit dem Public Key des Empfängers verschlüsselt bevor sie den Browser verlassen — der Server sieht nur Ciphertext.  
**Voraussetzung:** Gruppen-Key-Exchange-Protokoll (komplex, separates Ticket). Für Sprint 13 reicht Stufe 2.

---

#### Datenbankschema (neue Migration)

```sql
-- Neue Tabelle: chat_messages
CREATE TABLE chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES profile_links(id) ON DELETE CASCADE,
    sender_id   UUID NOT NULL REFERENCES profiles(id),
    type        VARCHAR(30) NOT NULL,          -- TEXT, BZ_SHARE, ACTION_SUGGESTION, PING
    content_enc TEXT,                          -- AES-256-GCM verschlüsselt
    metadata    JSONB,                         -- Kategorie, BZ-Wert, etc.
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at     TIMESTAMPTZ,
    deleted_at  TIMESTAMPTZ                    -- Soft-Delete
);

-- Index für Gruppen-Feed
CREATE INDEX idx_chat_messages_group ON chat_messages(group_id, sent_at DESC);

-- Neue Queue in RabbitMQConfig
-- zh.queue.chat-{profileId}  (TTL 7 Tage = 604_800_000 ms)
```

---

#### Frontend-Komponenten (Next.js)

- `frontend/src/app/(app)/chat/page.tsx` — Gruppen-Feed + 1:1-Auswahl
- `frontend/src/components/chat/MessageBubble.tsx` — Nachrichten-Bubble mit Typ-Icon
- `frontend/src/components/chat/ActionSuggestionCard.tsx` — Strukturierter Vorschlag mit „Öffne Insulin-Rechner"-CTA
- `frontend/src/components/chat/PingCard.tsx` — Schnell-Ping mit 👍/👎-Antwort
- `frontend/src/lib/chat-client.ts` — WebSocket-/STOMP-Client-Wrapper
- Badge im Tab-Nav wenn ungelesene Nachrichten vorhanden

#### Backend-Komponenten (Spring Boot)

- `ChatController.java` — `@MessageMapping`, `@SendToUser`
- `ChatService.java` — Gruppen-Logik, Verschlüsselung, Persistenz
- `ChatMessage.java` — Domain-Modell
- `ChatRepository.java` — JPA
- `WebSocketConfig.java` — STOMP-Broker-Relay auf RabbitMQ
- `RabbitMQConfig.java` — neue Queue `zh.queue.chat-{id}` ergänzen
- Flyway-Migration: `V{n}__add_chat_messages.sql`

---

#### Akzeptanzkriterien

- Mama schickt Malte „Schalte Sport-Modus ein" → Malte sieht die Nachricht innerhalb von 2 Sekunden, bekommt eine Browser-Notification
- ACTION_SUGGESTION öffnet per Tap den Insulin-Rechner oder die Einstellungen
- Nachrichten sind nach 7 Tagen automatisch gelöscht (DSGVO-Datenminimierung)
- Observer kann lesen und PING senden, aber keinen TEXT und kein ACTION_SUGGESTION (nur caregiver/admin)
- Wenn Nutzer offline ist: Nachricht landet in RabbitMQ und wird beim nächsten Connect zugestellt (max. 7 Tage)
- Kein Dritter (nicht verbundenes Profil) kann die Gruppe lesen oder schreiben

---

### RR-02 · Arzt-/Berater-Einladungsflow (Umsetzung nach RR-01) 🟡 MITTEL
**Aufgenommen:** Sprint-12-Review, 2026-04-15  
**Voraussetzung:** RR-01 abgeschlossen  
**Inhalt:** Patient kann Arzt oder Diabetesberater einladen (separater Einladungstyp mit eingeschränkten Rechten). Der Eingeladene bekommt die neue Rolle `arzt` oder `diabetesberater` mit gefilterter Ansicht (keine persönlichen Notizen, kein Löschen). Freigabe ist zeitlich begrenzt (Standard: 90 Tage, verlängerbar). Widerruf jederzeit durch Patient.

---

## 🟣 Teilweise umgesetzt / konsolidieren

| ID | Thema | Status |
|----|-------|--------|
| NEU-F19 | Sicherheits-Härtung Rollen & Sessions | Teilweise umgesetzt: Rate-Limit, Audit-Log und Session-Bausteine vorhanden, Konsolidierung offen |
| NEU-F21 | Muster-Erkennung mit Hinweisen | Teilweise umgesetzt: Basis-Patterns vorhanden, Zeitfenster und Präzision offen |
| NEU-F22 | Reminder-Motor mit Ruhezeiten | Teilweise umgesetzt: Quiet Hours und Routine-Reminder-Basis vorhanden |
| NEU-F5 | Eltern-Ping steuerbar durch Kind/Jugendlichen | Teilweise umgesetzt: Ping-Basis und Settings vorhanden, Zustellfeedback/Ausbau offen |

---

## 🟣 Doku / Enablement

### DOC-01 · Nutzerhandbuch / Bedienanleitung
**Priorität:** 🟠 HOCH  
**Inhalt:** Separates Nutzerhandbuch für Familien, Jugendliche, Erwachsene und Betreuer mit typischen Abläufen, Screens und Rollenbeispielen.  
**Hinweis:** Nicht Teil von Sprint 8. Sprint 8 liefert bewusst nur Betriebsdoku (`README.md`, `docs/project/ARCHITECTURE.md`, `docs/project/COOKBOOK.md`, `docs/project/REVIEW.md`).

---

## 🔴 KRITISCH — Sicherheit / Medizin

### BL-S01 · Insulin-Rechner: Warnung bei unrealistischen Parametern
**Gefunden in:** Sprint-1-Review (Diabetesberater)  
**Problem:** Wenn Admin insulinRatio auf 1 oder 50 setzt, gibt es keine Warnung. Dosierungsfehler möglich.  
**Fix:** Warndialog bei Speichern wenn Ratio < 5 oder > 30 (außerhalb klinischer Norm).  
**Dateien:** `src/modules/settings.js` (_saveInsulinSettings)

### BL-S02 · _trimOldEntries: Dexcom-CSV-Quelle fehlte ✅ BEHOBEN
**Gefunden in:** Sprint-1-Review  
**Problem:** CGM-Einträge mit `source='dexcom'` wurden nicht getrimmt.  
**Fix:** `CGM_SOURCES = new Set(['nightscout', 'dexcom'])` — bereits behoben.

### BL-S03 · Notifications Toggle: visueller Widerspruch ✅ BEHOBEN
**Gefunden in:** Sprint-1-Review  
**Fix:** Permission erst anfragen, dann State setzen — bereits behoben.

### BL-S04 · Notification-Click öffnet jetzt BZ-Seite ✅ BEHOBEN
**Gefunden in:** Sprint-1-Review  
**Fix:** SW sendet `OPEN_PAGE`-Message, App navigiert zur BZ-Seite — bereits behoben.

### BL-S05 · Keine Warnung vor Auto-Löschung von CGM-Daten
**Problem:** Wenn Speicher voll ist, werden CGM-Daten > 90 Tage still gelöscht. Für Arzt-Berichte und HbA1c-Trends problematisch.  
**Fix:** Vor Trim-Aktion Export-Angebot anzeigen (CSV-Download der betroffenen Daten).  
**Dateien:** `src/state.js` (_trimOldEntries), neue Exportfunktion

### BL-S06 · Korrektur-Fenster im Insulin-Rechner
**Problem:** Rechner schlägt Korrektur vor wenn BZ = 130 und Ziel = 120 → nur 10 mg/dL Differenz, klinisch unnötig.  
**Fix:** Korrektur nur wenn |BZ - Ziel| > 30 mg/dL (konfigurierbares Fenster).  
**Dateien:** `src/modules/insulin.js` (_calcInsulinDose)

---

## 🟠 HOCH — UX / Betreuer

### BL-H01 · Admin-PIN auf 6 Stellen (optional)
**Gefunden in:** Sprint-1-Review (Eltern-Perspektive)  
**Problem:** 4-stellig = 10.000 Kombis, bei 0,5s/Versuch in < 2h crackbar ohne Rate-Limit.  
**Fix:** PIN-Länge konfigurierbar 4–6 Stellen bei Profilerstellung.  
**Dateien:** `app.js` (openAddProfile, pinKey), `src/auth/local-provider.js` (checkPin)

### BL-H02 · Admin-Rollenhochstufung: Session-Timeout
**Problem:** `elevateRole('admin')` ist bis Seitenreload aktiv. Kind könnte Admin-Zugang bekommen wenn Eltern Gerät weggeben.  
**Fix:** Automatischer Downgrade nach 15 Min Inaktivität.  
**Dateien:** `app.js` (_elevateToAdmin, setInterval), `src/auth/local-provider.js`

### BL-H03 · Datenexport (PDF / CSV)
**Status:** Geplant seit Backlog-Init  
**Inhalt:** CSV aller Einträge (Datum, Uhrzeit, Typ, Wert), PDF-Wochenbericht mit Chart + TIR  
**Dateien:** Neue Datei `src/export.js`, `src/modules/settings.js`

### BL-H04 · Eltern-Benachrichtigungen: Nightscout-Gap-Erkennung
**Problem:** Wenn CGM-Sensor offline > 20 Min, merkt die App es nicht.  
**Fix:** In `_autoSyncNightscout` prüfen ob letzter Eintrag > 25 Min alt → Alert "CGM-Signal verloren".  
**Dateien:** `app.js` (_autoSyncNightscout), `src/notifications.js`

### BL-H05 · Settings: Profil ohne PIN kann Admin-Gate nicht schützen
**Problem:** `_adminGate()` deaktiviert Schutz wenn Profil keinen PIN hat → unsichtbare Änderungen.  
**Fix:** Wenn kein PIN vorhanden → Hinweis "Admin-PIN in Profil-Einstellungen setzen" anzeigen statt Gate zu deaktivieren.  
**Dateien:** `src/modules/settings.js` (_adminGate)

### BL-H06 · Streak-Anzeige auf Dashboard
**Status:** Aus BL-09 übernommen  
**Problem:** `getMaxStreak()` existiert, wird aber im Dashboard nicht angezeigt.  
**Fix:** Streak-Widget im Dashboard ("🔥 X Tage in Folge")  
**Dateien:** `src/widgets/stats.js` oder neues Widget

### BL-H08 · Ketone-Warnung & DKA-Protokoll bei BZ > 300
**Wunsch von:** Eltern / Diabetesberater (Sprint-2-Planning)  
**Medizinischer Hintergrund:** Bei BZ > 300 mg/dL muss nicht sofort der Arzt gerufen werden — aber nach **1 Stunde** müssen Ketone gemessen werden. Sind Ketone erhöht (> 0,6 mmol/L bzw. je nach Klinik-Schwelle), wird der Notfallplan ausgelöst.  
**Ablauf:**
1. BZ-Eintrag > 300 mg/dL → sofortiger Hinweis in der App: "⚠️ Hoher BZ — bitte in 1 Stunde Ketone messen!"
2. Nach 1 Stunde → Erinnerungsbenachrichtigung: "Jetzt Ketone messen!" (Browser Notification)
3. Neuer Eintrag-Typ `ketone` mit Wert (mmol/L oder mg/dL)  
4. Wenn Ketone > Schwellwert (konfigurierbar, Default 0,6 mmol/L) → **Notfall-Banner** + Empfehlung Arzt kontaktieren + SOS-Flow öffnen
5. Wenn Ketone normal → Entwarnung, App protokolliert
**Konfiguration:** Ketone-Schwellwert in Settings (Admin-Gate), Einheit mmol/L oder mg/dL  
**Dateien:** Neuer Eintrag-Typ in `src/state.js`, `src/modules/bz.js` (Trigger nach Speichern), neue Seite `src/modules/ketone.js`, `src/notifications.js`, `src/modules/settings.js`

### BL-H07 · Mahlzeit-Favoriten / Schnelleingabe
**Status:** Aus BL-10 übernommen  
**Problem:** Mahlzeit erfassen = 4 Klicks, keine Favoriten für "Schulfrühstück".  
**Dateien:** `src/state.js` (favorites[]), `src/modules/meal.js`, `src/modules/calc.js`

---

## 🟡 MITTEL — Spielspass / Retention

### BL-M01 · Tägliche Challenges / Quests
**Status:** Aus BL-08 übernommen  
**Inhalt:** 3 tägliche Aufgaben ("Miss vor dem Frühstück"), Fortschrittsbalken, Coins-System  
**Dateien:** `src/config.js`, `src/achievements.js`, neue Datei `src/challenges.js`

### BL-M02 · BZ-Trend-Pfeile (Nightscout direction-Feld)
**Status:** Aus BL-12 übernommen  
**Inhalt:** ↗ ↘ → neben aktuellem BZ-Wert  
**Dateien:** `app.js` (_autoSyncNightscout), `src/api.js` (fetchNightscout direction-Feld importieren)

### BL-M03 · BZ-Wert prominent auf Dashboard
**Status:** Aus BL-11 übernommen  
**Inhalt:** Großer aktueller BZ-Wert oben im Dashboard (nicht nur Sparkline)  
**Dateien:** `src/widgets/bz-status.js`

### BL-M04 · Insulin-Rechner: Hinweis wenn kein BZ eingegeben
**Gefunden in:** Sprint-1-Review (Malte-Perspektive)  
**Problem:** Berechnung ohne BZ zeigt nur Mahlzeit-IE ohne Korrektur — könnte Unterdosierung verursachen.  
**Fix:** Gelber Hinweis wenn BZ-Feld leer: "Ohne aktuellen BZ wird keine Korrektur berechnet."  
**Dateien:** `src/modules/insulin.js` (_calcInsulinDose)

### BL-M05 · Notification-Cooldown konfigurierbar / kürzer für Kritisch
**Gefunden in:** Sprint-1-Review  
**Problem:** 1h Cooldown auch für BZ < 55 (Lebensgefahr!). Kritische Alerts sollten alle 15 Min wiederholt werden.  
**Fix:** Unterschiedliche Cooldowns: kritisch = 15 Min, hoch = 2h, Lücke = 4h  
**Dateien:** `src/notifications.js`

### BL-M06 · Alert-Texte kinderfreundlicher
**Gefunden in:** Sprint-1-Review (Malte-Perspektive)  
**Problem:** "Sofort handeln!" klingt dramatisch für ein Kind.  
**Fix:** "BZ ist 45 — iss 3 Traubenzucker-Stücke und ruf Papa/Mama an 📞"  
**Dateien:** `src/notifications.js` (checkBZAlert)

---

## 🔵 NIEDRIG — Polish / Langfristig

### BL-L01 · Fuzzy-Suche Lebensmittel (Tipp-Fehler-Toleranz)
**Status:** Aus BL-14 übernommen

### BL-L02 · DKA-Warnungen verbessern (BZ > 300 → Ketone)
**Status:** Hochgestuft auf 🟠 HOCH — siehe BL-H08

### BL-L03 · KH-Datenbank Genauigkeit prüfen
**Status:** Aus BL-16 übernommen

### BL-L04 · PIN Rate-Limiting für normalen Login
**Status:** Aus BL-13 übernommen (Elevation hat Rate-Limit, Login noch nicht)

### BL-L05 · Audit-Log für Admin-Aktionen
**Gefunden in:** Sprint-1-Review (Eltern + Berater-Perspektive)  
**Inhalt:** JSON-Log in localStorage: wer hat wann was geändert (insulinRatio, Zielbereich, Einträge gelöscht)  
**Dateien:** `src/state.js`, neue Datei `src/audit.js`

### BL-L06 · Vibration + Sound für kritische Alerts
**Gefunden in:** Sprint-1-Review  
**Fix:** `navigator.vibrate([500, 200, 500])` bei BZ < 55  
**Dateien:** `src/notifications.js`

---

## 🚀 MEILENSTEIN — KI-Assistent

### BL-KI01 · Persönlicher Diabetes-KI-Assistent
**Priorität:** 🟠 HOCH — Großer Meilenstein, Sprint 5+  
**Wunsch von:** Eltern / Nutzer (Sprint-2-Planning)  
**Vision:** Ein integrierter KI-Chat-Assistent, den man Fragen zu Diabetes stellen kann — mit persönlichen Unterlagen (z.B. aus der Diabetes-Ambulanz) als Wissensgrundlage. Für Themen die nicht in den Unterlagen stehen, greift die KI auf allgemeine Diabetes-Informationen zurück.

#### Kernfunktionen
1. **Chat-Interface** — einfache Fragen stellen ("Was tue ich bei BZ 45?", "Wie viel KH hat Kartoffelbrei?", "Warum schwankt mein BZ nach dem Sport?")
2. **Eigene Unterlagen hochladen** — PDF/Text aus der Diabetes-Ambulanz, Therapieplan, individuelle Behandlungsempfehlungen → werden als Kontext für die KI-Antworten genutzt
3. **Multi-Provider-Support** — Nutzer kann wählen zwischen:
   - Claude (Anthropic) — bereits API-Key-Support vorhanden
   - ChatGPT (OpenAI)
   - Gemini (Google)
   - Lokale Modelle (Ollama, optional)
4. **Kontext-Priorisierung** — Antworten aus eigenen Unterlagen werden bevorzugt, mit klarer Kennzeichnung "Laut Ihrem Therapieplan:" vs. "Allgemeine Information:"
5. **Sicherheitshinweis** — Klare Disclaimer dass die KI kein Arzt ist und Notfallsituationen (BZ < 55, Ketone hoch) immer den SOS-Flow triggern

#### Technische Architektur
```
src/
  ai-assistant/
    assistant.js          — Chat-Logik, Provider-Facade
    providers/
      claude-provider.js  — Anthropic API (bereits api.js Grundlage)
      openai-provider.js  — OpenAI Chat Completions API
      gemini-provider.js  — Google Gemini API
    document-store.js     — Unterlagen hochladen + indexieren (localStorage)
    prompt-builder.js     — System-Prompt aus Unterlagen + Nutzerdaten aufbauen
src/modules/
  assistant.js            — Chat-UI Seite
```

#### Unterlagen-Management
- PDFs/Text-Dateien können lokal gespeichert werden (Base64 in localStorage oder IndexedDB)
- Volltextsuche in den Dokumenten → relevante Passagen als Kontext mitgeben
- Dateien können benannt und verwaltet werden ("Therapieplan 2026", "Notfallprotokoll DRK")
- **Datenschutz:** Alle Unterlagen bleiben lokal — nur der relevante Textausschnitt wird an die KI-API gesendet (kein Upload der ganzen Datei)

#### System-Prompt Strategie
```
Du bist ein Diabetes-Assistent für [Name]. 
Aktuelle Werte: BZ [X], letztes Insulin [X] IE vor [X] Min.
Behandlungsplan (aus persönlichen Unterlagen):
---
[Relevanter Ausschnitt aus hochgeladenen Dokumenten]
---
Beantworte die Frage basierend auf dem Behandlungsplan.
Für Themen außerhalb des Plans: gib allgemeine Informationen mit dem Hinweis "Allgemeine Information".
Bei Notfällen: Leite immer zum SOS-Modus weiter.
```

#### Settings
- KI-Provider wählen + API-Key eingeben (Admin-Gate)
- Unterlagen verwalten (hochladen, umbenennen, löschen)
- Chat-Verlauf löschen

**Dateien (neu):** `src/modules/assistant.js`, `src/ai-assistant/assistant.js`, `src/ai-assistant/providers/*.js`, `src/ai-assistant/document-store.js`, `src/ai-assistant/prompt-builder.js`  
**Dateien (anpassen):** `index.html` (neue Seite + Nav-Button), `src/ui/router.js` (PAGE_REGISTRY), `src/modules/settings.js` (Provider + API-Keys), `src/api.js` (OpenAI/Gemini Clients)

---

## ⚪ Langfristig / Externe APIs

| ID | Feature | Komplexität |
|----|---------|-------------|
| BL-X01 | Direkte Dexcom API v3 (OAuth) | Sehr hoch |
| BL-X02 | Omnipod 5 Integration | Sehr hoch (proprietäre API) |
| BL-X03 | Keycloak SSO für Arztpraxen | Hoch |
| BL-X04 | IOB/COB im Insulin-Rechner | Hoch |
| BL-X05 | Tageszeit-spezifische Zielwerte | Mittel |

### Food-Folgeausbau
| ID | Feature | Priorität |
|----|---------|-----------|
| FD-04 | BE/KE/FPE als zusätzliche Food-Metriken | Mittel |
| FD-05 | Zusätzliche Food-Provider (Food Repo / USDA) hinter Provider-Abstraktion | Mittel |
| FD-06 | Persistente Online-Favoriten / Recents für häufige Scan-Produkte | Mittel |

---

## Sprint-Empfehlung

### ✅ Sprint 2 (Sicherheit zuerst) — FERTIG
1. ✅ BL-S01 · Warnung bei unrealistischen Insulin-Parametern
2. ✅ BL-S06 · Korrektur-Fenster im Insulin-Rechner
3. ✅ BL-M04 · Hinweis wenn kein BZ eingegeben
4. ✅ BL-M06 · Kinderfreundliche Alert-Texte
5. ✅ BL-H06 · Streak-Dashboard
6. ✅ BL-H08 · Ketone-Warnung & DKA-Protokoll

### ✅ Sprint 3 (Familien-Rollen) — FERTIG
> Basis: Nutzerforschung mit 6 Personas (Elternteil, Kind 8, Jugendlicher 16, Erwachsene, Arzt, Oma)
1. ✅ NEU-F1 · Familien-Rollen: profile_links + Einladungsflow (Backend + Frontend)
2. ✅ NEU-F2/F3 · Ampel-Dashboard + Notfall-Flow für Betreuer (Observer Page)
3. ✅ NEU-F4 · Adaptive UI: useAgeGroup Hook
4. ✅ BL-H01 · PIN-Länge 4 oder 6 Stellen
5. ✅ BL-H02 · Elevation Session-Timeout (15 Min)

### Sprint 4 (Nutzer-getriebene Features — Forschungs-Prioritäten)
> Priorisiert nach Nutzerforschung Sprint 3
1. NEU-F9 · Tages-Zusammenfassung als morgendliche Push-Nachricht (Sarah)
2. NEU-F10 · Druckbare Notfall-Karte / QR-Code für Lehrer (Sarah)
3. NEU-F11 · Malte-Spielmodus: Charakter + Punkte + Leveling (Malte)
4. NEU-F8 · Sport/Aktivitäts-Kontext-Modus mit Vorab-Empfehlungen (Jonas)
5. BL-H03 · Datenexport PDF/CSV (Anna, Dr. Krause)
6. BL-H07 · Mahlzeit-Favoriten (Sarah)

### Sprint 5 (Professionelle Daten & Arzt-Integration)
> Priorisiert nach Arzt + Erwachsene-Nutzer-Forschung
1. NEU-F6 · Zeitlich begrenzter Arzt-Link ohne Login (Anna, Dr. Krause)
2. NEU-F7 · Muster-Erkennung (wiederkehrende BZ-Muster) (Jonas, Anna)
3. NEU-F15 · Konsensus-Kennzahlen-Dashboard (TIR, GMI, CV%) (Anna, Dr. Krause)
4. NEU-F12 · Dark Mode (Anna)
5. NEU-F14 · Mini-Share-Modus für Trainer/Lehrer (Jonas)
6. BL-M01 · Tägliche Challenges/Quests (Malte)

### Sprint 6 (Intelligenz & Automation)
1. NEU-F13 · Adaptiver Bolus-Rechner (lernt aus History) (Anna)
2. BL-KI01 · KI-Assistent (Grundversion: Claude + Dokument-Upload)
3. BL-KI01 · Multi-Provider (OpenAI, Gemini)
4. NEU-F5 · Eltern-Ping steuerbar durch Kind/Jugendlichen (Jonas)

### Sprint 7 (Sicherheits- & Versorgungs-Upgrade — KOMPLETTPAKET)
> Neuer Sprint mit allen priorisierten Punkten aus der letzten Produkt-Runde (Sicherheit + Versorgung + Alltagstauglichkeit)
1. NEU-F16 · Kritisch-Alert Eskalationskette
   - Bestätigungspflichtige kritische Alerts (Hypo/Hyper)
   - Eskalationskette: Eltern 1 -> Eltern 2 -> Notfallkontakt
   - Verknüpfung mit Notfall-Flow für Betreuer
2. NEU-F17 · CGM-/Nightscout-Gap-Erkennung
   - Alarm bei ausbleibenden CGM-Daten nach definierter Zeit
   - Eigene Hinweislogik für Betreuer-/Schulmodus
3. NEU-F18 · Medizinischer Wochenbericht (PDF + Datenexport Plus)
   - PDF mit TIR, Hypo-/Hyper-Episoden, Ketone-Ereignissen, Streaks
   - FHIR/CSV-Export für Arztkommunikation vereinheitlichen
4. NEU-F19 · Sicherheits-Härtung Rollen & Sessions
   - PIN-Rate-Limiting beim Login
   - Audit-Log für Admin-Aktionen (wer, was, wann)
   - Strengere Session-Timeouts bei sensiblen Änderungen
5. NEU-F20 · Schul-/Betreuer-Modus 2.0
   - "3-Klick-Notfallhilfe" für nicht-medizinisches Personal
   - Rollenabhängige Aktionsfreigaben (Lesen vs. dokumentieren)
   - Druck-/Tageskarte für Schule und Sportverein
6. NEU-F21 · Muster-Erkennung mit Hinweisen
   - Erkennung wiederkehrender Muster (z.B. nach Frühstück/Sport)
   - Konkrete, nicht-dosierende Handlungshinweise
7. NEU-F22 · Reminder-Motor mit Ruhezeiten
   - Wiederkehrende Routinen (Messzeiten, Ketone, Materialcheck)
   - Quiet Hours + kindgerechte Sprache
8. NEU-F23 · Familien-Kommunikation im Verlauf
   - Kurze Kommentare/Notizen direkt an Einträgen für Eltern, Schule, Betreuer
9. NEU-F24 · Therapie-Übergabe-Flow (Kind -> Teen -> Erwachsen)
   - Schrittweise UI-/Rechte-Umstellung je Reifegrad
10. NEU-F25 · Tagesreflexion "Was hat heute geholfen?"
    - 1-Tap Rückblick für Lern- und Motivationsfeedback
11. NEU-F26 · Datenqualitätsindikatoren
    - Erkennung von Messlücken, veralteten Werten, unvollständigen Einträgen

**Sprint-7 Prioritätsblöcke (Umsetzungsreihenfolge innerhalb des Sprints):**
1. Sicherheitskern: `NEU-F16`, `NEU-F17`, `NEU-F19`
2. Versorgung/Arzt: `NEU-F18`, `NEU-F21`, `NEU-F26`
3. Alltag & Retention: `NEU-F20`, `NEU-F22`, `NEU-F23`, `NEU-F24`, `NEU-F25`

### Sprint 8 (Plattformstabilität, Doku & Signalqualität)
1. REVIEW · Anwendungs-Review und Bestandsaufnahme
2. DOKU · README, Architektur und Frontend-Doku auf Ist-Zustand ziehen
3. OPS · Cookbook / Betriebsanleitung erstellen
4. BACKLOG · Status bereinigen und teilweise umgesetzte Themen sichtbar machen
5. NEU-F17 · CGM-/Nightscout-Gap-Erkennung
6. NEU-F26 · Datenqualitätsindikatoren
7. SR-04 / NEU-F21 · Muster-Erkennung mit Zeitfenstern

### Sprint 9 (Experience Overhaul, Freigabe-Reparaturen & visuelle Modernisierung)
1. UX-00 · Designsystem-Basis, App-Shell, Typografie und GUI-Relaunch
2. BR-01 · Settings-Schreibflow reparieren
3. BR-02 · Invite-/Watcher-Flow reparieren
4. BR-03 · KI-Chat stabilisieren oder kontrolliert degradieren
5. SR-03 / NEU-F18 · Arzt-Link als druckbarer Kurzbericht
6. SR-01 / NEU-F14 · Mini-Share klar auf Lesemodus begrenzen
7. SR-06 / NEU-F5 · Eltern-Ping mit Zustellfeedback

### Sprint 10 (Freigabe-Fix, Integrität & Experience-Polish)
> Vormerkung aus Sprint-9-Review, Persona-UAT und Spezialisten-Review
1. BR-04 / UX-01 · Observer-Schreibfluss korrekt machen oder bis zum Fix read-only schalten
   - Einträge aus dem Observer-/Betreuer-Modus müssen sicher im beobachteten Profil landen
   - Falls das nicht sprinttauglich sauber lösbar ist, werden Schreibaktionen im Observer-Modus vorübergehend deaktiviert
2. UX-02 · Settings mit explizitem Speichermodell und kontrollierten Feldern
   - sensible Werte nicht nur implizit auf `blur`
   - klare Rückmeldung, wann ein Wert lokal geändert, serverseitig gespeichert oder abgewiesen wurde
3. UX-03 · Sekundärseiten vollständig ins neue Designsystem ziehen
   - `BZ`, `Insulin`, `Meal`, `Activity`, `History`, `Ketone`, `Calc`, `Emergency`
   - keine „alter Screen mit neuem Header“-Brüche mehr
   - Assistant-Ausgabe ohne Roh-Markup und mit hochwertiger Quellen-/Kontext-Trennung
4. UX-04 · Konsistenz-Polish für Navigation und Altersgruppen
   - Navigation komplett deutsch
   - Root-Screens ohne irritierende Zurück-Mechanik
   - stärkere visuelle Trennung `child_young` vs `child_teen` vs `adult`
5. ARC-01 · Architektur-Integritätsreview für Observer-, API- und Zustandsmodell
   - Review durch Architektur-Perspektive verpflichtend vor Sprint-Abnahme
   - Fokus auf Rollen, Profilzuordnung, State-Integrität und API-Klarheit
6. DOC-02 · Doku- und Architektur-Delta je Sprint verpflichtend nachziehen
   - `README.md`, `docs/project/ARCHITECTURE.md` und betroffene Betriebsdoku müssen immer mit dem Code-Stand aktualisiert werden

### ✅ Sprint 11 (Lebensmittel-DB, Barcode & hybride Suche) — FERTIG
1. FD-01 · Kuratierter DACH-Food-Katalog mit 300+ Built-ins, Aliases, Kategorien und Portionspresets
2. FD-02 · Hybride Food-Suche: lokale Suche als Standard, explizite Open-Food-Facts-Suche online
3. FD-03 · Barcode-Flow mit `lokal -> Open Food Facts`-Fallback
4. FD-03 · Portionseditor und KH-Summenbildung direkt im Rechner
5. FD-03 · Handoff vom KH-Rechner in den Mahlzeiten-Flow
6. DOC-03 · README, Architektur und Cookbook auf Food-Architektur erweitert

### Sprintreview-Follow-ups (freigegeben mit Anmerkungen)

#### SR-01 · Mini-Share klarer abgrenzen
**Quelle:** Sprintreview  
**Keyuser:** Jonas, Oma/Betreuung  
**Follow-up zu:** `NEU-F14`

**User Story:** Als nicht-medizinische Begleitperson moechte ich im Mini-Share nur lesen-orientierte Informationen sehen, damit ich nicht versehentlich medizinische Handlungen ausfuehre, die ausserhalb meiner Rolle liegen.

**Akzeptanzkriterien:**
1. Mini-Share zeigt nur Status-, Verlaufs- und Notfallinformationen, aber keine missverstaendlichen Handlungs-CTAs.
2. Medizinische Aktionsbuttons bleiben Arzt-/Betreuer-Ansichten vorbehalten.
3. Die Ansicht erklaert klar, dass bei kritischen Werten Eltern oder Betreuer kontaktiert werden sollen.

#### SR-02 · KI-Antwort-Herkunft sichtbar machen
**Quelle:** Sprintreview  
**Keyuser:** Anna, Dr. Krause  
**Follow-up zu:** `BL-KI01`

**User Story:** Als Nutzerin moechte ich sehen, ob eine KI-Antwort aus meinem persoenlichen Kontext oder aus allgemeinem Wissen stammt, damit ich die Antwort besser einordnen kann.

**Akzeptanzkriterien:**
1. Jede KI-Antwort kennzeichnet sichtbar `Persoenlicher Kontext` oder `Allgemeine Information`.
2. Antworten mit persoenlichem Kontext priorisieren vorhandene Unterlagen und markieren das nachvollziehbar.
3. Falls kein persoenlicher Kontext verwendet wird, ist das ebenfalls explizit sichtbar.

#### SR-03 · Arzt-Link als Kurzbericht druckbar machen
**Quelle:** Sprintreview  
**Keyuser:** Dr. Krause, Anna  
**Follow-up zu:** `NEU-F18`

**User Story:** Als Arzt moechte ich einen kompakten, druckbaren Kurzbericht aus dem Arzt-Link erhalten, damit ich die wichtigsten Informationen schnell in der Sprechstunde erfassen kann.

**Akzeptanzkriterien:**
1. Der Arzt-Link bietet eine druckfreundliche Kurzansicht mit Kennzahlen, letzten relevanten Ereignissen und Basis-Notfallhinweis.
2. Die Druckansicht funktioniert ohne Login und ohne unnoetige Navigationselemente.
3. Die Kurzansicht bleibt klar von der Mini-Share-Ansicht getrennt.

#### SR-04 · Mustererkennung mit Zeitfenstern
**Quelle:** Sprintreview  
**Keyuser:** Jonas, Anna  
**Follow-up zu:** `NEU-F21`

**User Story:** Als Nutzer moechte ich bei Mustern konkrete Zeitfenster sehen, damit ich erkenne, wann ein wiederkehrendes Problem typischerweise auftritt.

**Akzeptanzkriterien:**
1. Musterhinweise nennen konkrete Zeitfenster wie `nach dem Fruehstueck zwischen 8:00 und 10:00 Uhr`.
2. Zeitfenster werden aus den erkannten Daten abgeleitet und nicht nur generisch benannt.
3. Die Hinweise bleiben nicht-dosierend und verweisen nur auf beobachtete Muster.

#### SR-05 · Dark-Mode-Polish
**Quelle:** Sprintreview  
**Keyuser:** Anna  
**Follow-up zu:** `NEU-F12`

**User Story:** Als Nutzerin moechte ich einen visuell ausgereiften Dark Mode, damit Karten, Statusfarben und Kontraste auch bei laengerer Nutzung angenehm und klar lesbar bleiben.

**Akzeptanzkriterien:**
1. Karten, Statuskomponenten und Navigation erhalten abgestimmte Dark-Mode-Farben mit ausreichendem Kontrast.
2. Kritische Statusfarben bleiben auch im Dark Mode klar unterscheidbar.
3. Der Dark Mode wirkt konsistent und nicht wie eine reine Invertierung des Light Modes.

#### SR-06 · Eltern-Ping mit Zustellfeedback
**Quelle:** Sprintreview  
**Keyuser:** Sarah, Jonas  
**Follow-up zu:** `NEU-F5`

**User Story:** Als Kind oder Jugendlicher moechte ich nach einem Eltern-Ping sehen, an wen und an wie viele Betreuer die Nachricht gesendet wurde, damit ich direkt Rueckmeldung ueber die Zustellung bekomme.

**Akzeptanzkriterien:**
1. Nach dem Ping zeigt die App an, an wie viele Empfaenger gesendet wurde.
2. Wenn technisch moeglich, werden die betroffenen Betreuer namentlich genannt.
3. Wenn keine Empfaenger verfuegbar sind, gibt die App ein klares Feedback statt eines stillen Erfolgs.

### Sprint 10 (UX-Freigabe, Rollenfluss & Konsistenz)
1. UX-01 · Observer-Schreibfluss absichern
   - Beobachtete Profile und aktive Schreibziele muessen visuell und technisch klar getrennt sein.
   - Schnellaktionen im Beobachtungsmodus duerfen nur ins beobachtete Profil schreiben.
   - Die UI muss eindeutig zeigen, ob gerade das eigene oder ein fremdes Profil aktiv ist.

2. UX-02 · Settings als kontrollierte Formular-UI
   - Einstellungsfelder muessen den gespeicherten Wert zuverlaessig widerspiegeln und nicht nur beim Blur erfasst werden.
   - Nach dem Speichern braucht es klares Feedback, ob der Server den Wert akzeptiert oder normalisiert hat.
   - Medizinisch relevante Felder duerfen nicht stillschweigend von der UI abweichen.

3. UX-03 · Assistant-Ausgabe lesbar und ehrlich machen
   - KI-Antworten muessen sauber formatiert erscheinen, ohne rohe Markdown-Reste.
   - Der deaktivierte oder nicht verfuegbare Zustand muss sichtbar und ruhig erklaert werden.
   - Quelle, Kontext und Verfuegbarkeit sollen auch visuell klar getrennt sein.

4. UX-04 · Visuelle Konsistenz ueber alle Sekundaerseiten
   - BZ, Insulin, Mahlzeit, Aktivitaet, Verlauf und weitere Seiten muessen dieselbe Typo-, Card- und CTA-Sprache sprechen.
   - Alte Ad-hoc-Farben, uneinheitliche Abstaende und gemischte Surface-Stile sollen verschwinden.
   - Die App soll sich nicht nur auf einzelnen Screens modern anfuehlen, sondern durchgaengig.

### Roadmap ab Sprint 14 (strategische Fortsetzung)

### Sprint 14 — Einladung, Einwilligung, DSGVO, Safety
1. `NET-01` Haushalts-/Begleitmodell mit klarer Trennung `Patient`, `Begleitung`, `Fachperson`, `Gast-Lernen`
2. `NET-02` Einwilligungszentrale mit Sichtbarkeiten, Zweck und Laufzeit
3. `NET-04` Schule-/Trainer-/Gastrolle ohne Live-Medizinzugriff
4. `TRU-01` DSGVO-Basis: Export-, Lösch- und Widerrufslogik sichtbar machen
5. `TRU-02` Safety-Regeln für Hinweise, Nachrichten, Empfehlungen und Notfallpfade

Aktueller Sprint-14-Abschlussstand:
- Privacy-Hub, Datenschutz-Export und Lösch-/Widerrufslogik sind bereits umgesetzt.
- Zweckgebundene Einladungen mit Beziehungstyp (`Familie`, `Fachperson`, `Schule/Alltag`, `Gast-Lernen`) und Access Scope sind als operativer Consent-Slice umgesetzt.
- Live-Medizinzugriff wird aktuell nur noch für `LIVE_MEDICAL`-Links in den Observer-/Viewing-Flow gehoben; Schule/Gast-Lernen bleiben bewusst außerhalb des Live-Zugriffs.
- Sprint 14 ist damit reviewbereit; die verbleibenden Punkte sind Folgesprint-Themen und keine Blocker für die aktuelle Abnahme.

Direkte Folgepunkte nach Sprint 14 — **alle in Sprint 15 abgeschlossen:**
- ~~`NET-02b` Rechtejournal / Einwilligungshistorie mit Zweck, Ablauf und Widerruf~~ ✅ Sprint 15
- ~~`NET-03b` Eigene Ziel-Flows für `SUMMARY_ONLY` und `LEARNING_ONLY`~~ ✅ Sprint 15
- ~~`CLN-02` Strukturierter Fachpersonen-View statt generischer Beobachtung~~ ✅ Sprint 15
- `TRU-02b` Safety-Layer für spätere Nachrichten-, Kommentar- und Empfehlungssysteme

### Sprint 15 — "Consent trifft Klinik" ✅ Abgeschlossen
> Ursprünglich als Diagnosemodus geplant — nach Refinement auf NET+CLN-Slice geschärft (EDU auf Sprint 16 verschoben)

1. ~~`NET-06` Rechtejournal / Einwilligungshistorie~~ ✅
2. ~~`NET-03` Dedizierte UI-Flows: SUMMARY_ONLY + LEARNING_ONLY~~ ✅
3. ~~`NET-02b` Einwilligungszentrale Basis-UI (`/consent`)~~ ✅
4. ~~`CLN-02` Strukturierter Fachpersonen-View (Arzt-Link → klinische Ansicht)~~ ✅

### Sprint 16 — Care Team & Klinik-Readiness
1. `CLN-06` Rollen `Arzt`, `Diabetesberater`, `Pflege`, `Klinik-Admin`
2. `CLN-01` Einladungs- und Widerrufslogik für professionelle Nutzer (baut auf CLN-02 auf)
3. `CLN-03` Visit Pack / Kurzbericht / Terminansicht
4. `EDU-01` Diagnosemodus / Diagnose-Startpfad für die ersten 14 Tage (aus Sprint 15 verschoben)
5. `CLN-05` Interop-Backlog konkretisieren: FHIR / ePA / Export

### Sprint 17 — Alltag im Umfeld
1. `NET-04` Schule-/Trainer-Modus
2. `NET-05` Geschwister-/Großeltern-/Partner-Pfade
3. `MSG-01` Familieninterne Kommunikation mit klaren Safety-Grenzen
4. Alltagspakete für Klassenfahrt, Sport, Übernachtung und Krankheitstage
5. psychosoziale Unterstützung und Entlastungsfeatures für Eltern / Carer

### Sprint 18 — Skalierung & Marktführung
1. `EDU-06` Mehrsprachigkeit und leichte Sprache
2. `GTM-04` Accessibility, Performance und starke Mobile-Politur
3. `GTM-03` Aktivierungs- und Retentionsmetriken
4. `GTM-01` Empfehlungs-/Referral-Material für Kliniken und Diabetesberater
5. Technische Skalierung, Monitoring, Support- und Content-Betrieb
6. DiGA-/Verordnungsfähigkeit als separater Entscheidungspunkt, nicht als Kurzfristpfad
