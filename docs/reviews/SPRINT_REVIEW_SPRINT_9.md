# Sprint Review Sprint 9

Stand: 2026-04-14

## Scope des Reviews

Geprüft wurden:

- Sprint-9-Ziele rund um GUI-Überarbeitung, Designsystem und Experience Overhaul
- die behobenen Sprint-8-Blocker
- neue bzw. überarbeitete Funktionen:
  - Settings speichern
  - Invite-/Watcher-Flow
  - KI-Chat mit kontrollierter Degradierung
  - Guardian Ping mit Zustellfeedback
  - Arzt-Link als druckbarer Kurzbericht
  - Mini-Share als klare Leseansicht

Technisch verifiziert wurden:

- `frontend npm run build`
- `npm test`
- `backend mvn test`

Zusätzliche Spezialisten-Sichten:

- [SPECIALIST_REVIEW_SPRINT_9.md](SPECIALIST_REVIEW_SPRINT_9.md)
  - UI/UX-Spezialist
  - Architektur-Spezialist

## Kritische Findings

### 1. Kritisch · Observer-Schreibaktionen landen voraussichtlich im falschen Profil

- Betroffene Personas:
  - Sarah
  - Oma / Betreuung
  - Schulbegleitung
  - Jonas im Betreuerkontext
- Beobachtung:
  - Im Observer-Mode werden Schnellaktionen für `BZ`, `Insulin`, `Mahlzeit` und `Ketone` angeboten.
  - Die Observer-Ansicht verlinkt dafür einfach auf die normalen Eintragsseiten.
  - Der API-Client setzt `X-Viewing-Profile-Id` aber nur bei `GET`, nicht bei `POST`.
  - Der Backend-Entry-Controller schreibt neue Einträge ausschließlich auf das authentifizierte Profil.
- Risiko:
  - Eine Begleitperson glaubt, für das beobachtete Kind einzutragen, schreibt aber tatsächlich ins eigene Profil.
  - Das ist fachlich hochkritisch und ein Freigabeblocker für den Betreuer-Flow.
- Referenzen:
  - [observer/page.tsx](../../frontend/src/app/(app)/observer/page.tsx:148)
  - [api-client.ts](../../frontend/src/lib/api-client.ts:35)
  - [EntryController.java](../../backend/src/main/java/de/zuckerheld/api/controller/EntryController.java:72)

### 2. Hoch · Settings wirken gespeichert, können aber visuell vom echten Serverstand abweichen

- Betroffene Personas:
  - Sarah
  - Anna
  - Dr. Krause indirekt über Profilkonfiguration
- Beobachtung:
  - Die numerischen Settings-Felder speichern direkt auf `blur`.
  - Die Inputs sind mit `defaultValue` unkontrolliert.
  - Nach Server-Normalisierung, Fehlersituation oder späterer Neuladung kann die UI einen Wert zeigen, der nicht mehr der echten Persistenz entspricht.
- Risiko:
  - Gerade bei Zielwert, Faktoren und Quiet Hours entsteht Unsicherheit, ob der Wert wirklich übernommen wurde.
  - Für medizinisch sensible Konfiguration ist das Vertrauensproblem relevant.
- Referenz:
  - [settings/page.tsx](../../frontend/src/app/(app)/settings/page.tsx:232)

### 3. Mittel · Der Sprint liefert ein starkes neues Designsystem, aber die App ist visuell noch nicht vollständig vereinheitlicht

- Betroffene Personas:
  - alle
- Beobachtung:
  - Login, Dashboard, Share, Observer und Assistant sind klar modernisiert.
  - Mehrere Sekundärseiten haben jedoch vor allem neue Header bekommen, während Karten, Formmuster und CTA-Stil noch überwiegend aus dem alten visuellen System stammen.
- Auswirkung:
  - Der Eindruck ist deutlich besser als zuvor, aber noch nicht komplett „aus einem Guss“.
  - In einer Live-Demo kann man den Umbaufortschritt sehen, aber noch nicht überall den finalen Reifegrad.
- Referenzen:
  - [bz/page.tsx](../../frontend/src/app/(app)/bz/page.tsx:41)
  - [insulin/page.tsx](../../frontend/src/app/(app)/insulin/page.tsx:74)
  - [meal/page.tsx](../../frontend/src/app/(app)/meal/page.tsx:100)
  - [history/page.tsx](../../frontend/src/app/(app)/history/page.tsx:125)
  - [activity/page.tsx](../../frontend/src/app/(app)/activity/page.tsx:88)

### 4. Mittel · KH-Schätzung zeigt Roh-Markup statt formatiertem Text

- Betroffene Personas:
  - Jonas
  - Anna
- Beobachtung:
  - Die Antwort für die KH-Schätzung enthält Markdown-Syntax wie `**...**`.
  - Die Chatblasen rendern aber Plaintext.
- Auswirkung:
  - Der Assistent wirkt an dieser Stelle unfertig und weniger hochwertig.
- Referenz:
  - [assistant/page.tsx](../../frontend/src/app/(app)/assistant/page.tsx:69)

### 5. Niedrig · Sprach- und Navigationskonsistenz ist noch nicht vollständig

- Betroffene Personas:
  - alle
- Beobachtung:
  - In der Bottom-Navigation steht `Home`, obwohl der Rest der App deutschsprachig ist.
  - Zusätzlich zeigt der neue `PageHeader` standardmäßig einen Zurück-Button; auf dem Dashboard ist das für den Root-Screen eher irritierend.
- Auswirkung:
  - Kein Blocker, aber es stört den „runden“ Eindruck, den Sprint 9 eigentlich herstellen sollte.
- Referenzen:
  - [layout.tsx](../../frontend/src/app/(app)/layout.tsx:11)
  - [PageHeader.tsx](../../frontend/src/components/ui/PageHeader.tsx:19)
  - [dashboard/page.tsx](../../frontend/src/app/(app)/dashboard/page.tsx:206)

## Review-Ergebnis nach Persona

### Malte (8 Jahre)

Positiv:

- Deutlich größerer, motivierenderer Einstieg.
- Dashboard-Hero ist klarer und emotionaler.
- Signalqualität und direkte Aktionen sind sichtbarer.
- Guardian Ping ist verständlicher als zuvor.

Kritische Anmerkungen:

- Einige Unterseiten wirken noch spürbar „alt“, obwohl der Einstieg schon modern wirkt.
- Für ein 8-jähriges Kind ist die Settings-Seite weiterhin zu komplex und textreich.
- Die Observer-/Betreuer-Schnellaktionen sind fachlich derzeit nicht freigabefähig, solange Einträge nicht sicher dem beobachteten Profil zugeordnet werden.

Status: `teilweise freigabefähig`

### Sarah (Elternteil / Begleitperson)

Positiv:

- Rollen, Share und Sicherheitsbereiche sind klarer gruppiert.
- Der neue Settings-Einstieg wirkt ruhiger und vertrauenswürdiger.
- Invite- und Share-Themen sind besser auffindbar.

Kritische Anmerkungen:

- Settings speichern noch zu implizit; es fehlt ein klarer, verlässlicher „gespeichert“-Mental-Model auf Feld- und Seitenebene.
- Der Betreuer-Flow ist wegen des Observer-Schreibproblems nicht freigabefähig.
- Die Seite ist trotz besserer Struktur noch lang und verlangt viel Aufmerksamkeit am Stück.

Status: `nicht voll freigabefähig`

### Jonas (16 Jahre)

Positiv:

- Der neue Look ist deutlich moderner und weniger kindlich.
- Dark Mode wirkt wesentlich ernsthafter und technischer.
- Assistant und Dashboard haben jetzt eine zeitgemäßere Produktanmutung.

Kritische Anmerkungen:

- Einige Screens tragen noch zu viele weiche, verspielte Muster aus dem alten UI.
- Die Teen-Perspektive ist verbessert, aber noch nicht konsequent genug von `child_young` getrennt.
- Der KH-Assistent wirkt durch Roh-Markup und lange Hinweistexte noch nicht ganz „clean“.

Status: `weitgehend freigabefähig mit UX-Follow-ups`

### Anna (Erwachsene Nutzerin)

Positiv:

- Dashboard, Share und Insights wirken professioneller und ruhiger.
- Arzt-Link und Mini-Share sind besser differenziert.
- KI-Chat bricht nicht mehr hart, sondern ist kontrolliert degradiert.

Kritische Anmerkungen:

- Settings sind inhaltlich stark, aber noch nicht auf Professional-Grade-Interaktion poliert.
- Die visuelle Vereinheitlichung ist im Kern gut, aber in der Breite noch nicht vollständig.
- Dashboard zeigt viele starke Module, konkurriert dadurch aber teils um Aufmerksamkeit.

Status: `freigabefähig mit Priorität auf Politur`

### Dr. Krause (Arzt)

Positiv:

- Die neue Arztansicht ist ein deutlicher Fortschritt.
- Druckfunktion und Berichtslogik sind für ein Gespräch schon sinnvoll.
- Metrics, letzte Einträge und Notfallhinweis sind kompakter und besser erfassbar.

Kritische Anmerkungen:

- Es fehlt noch etwas medizinischer Rahmen: Zeitraum, Berichtskontext, evtl. erzeugt-am-Hinweis.
- Die Kurzansicht ist brauchbar, aber noch eher ein App-Bericht als ein vollständig klinischer Kurzreport.

Status: `freigabefähig mit fachlichem Ausbauwunsch`

## Bewertung der Sprint-9-Ziele

### P0

- `BR-01 Settings speichern reparieren`: `technisch erfüllt`
- `BR-02 Invite-/Watcher-Flow reparieren`: `technisch erfüllt`
- `BR-03 KI-Chat stabilisieren oder kontrolliert deaktivieren`: `erfüllt`
- neues Designsystem und App-Shell: `erfüllt`
- gesamte App visuell überarbeiten: `teilweise erfüllt`

### P1

- Dark-Mode-Polish: `deutlich verbessert`
- Arzt-Link als druckbarer Kurzbericht: `erfüllt`
- Mini-Share klar auf Lesemodus begrenzen: `erfüllt`
- Eltern-Ping mit Zustellfeedback: `erfüllt`

## Freigabeempfehlung

Empfehlung: `bedingt freigeben`

Freigabefähig:

- Designsystem-Grundlage
- neuer Login
- neues Dashboard
- Assistant mit kontrollierter Verfügbarkeit
- Share-Überarbeitung
- Guardian-Ping-Feedback
- Settings-/Invite-/AI-Blocker aus Sprint 8 grundsätzlich adressiert

Blocker vor voller Sprint-9-Abnahme:

- Observer-Schreibfluss muss fachlich korrekt auf das beobachtete Profil schreiben oder im UI vorübergehend auf Read-only begrenzt werden.

## Empfohlene Nacharbeiten für Sprint 10

1. Observer-Schreiblogik sicher korrigieren oder deaktivieren.
2. Settings-Felder auf kontrollierte Inputs plus explizites Speichermodell umstellen.
3. Sekundärseiten vollständig ins neue Designsystem ziehen.
4. Assistant-Ausgabe ohne Roh-Markup rendern.
5. letzte Konsistenzpunkte beheben:
   - `Home` → deutscher Labeltext
   - Dashboard ohne Zurück-Button
   - visuelle Teen-/Adult-Schärfung
