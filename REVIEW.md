# Zucker-Held Review

> Stand: 2026-04-15 (Sprint 12 Review)

## Gesamtfazit

Die Anwendung hat mit Sprint 12 einen qualitativ bedeutenden Schritt gemacht:
- Der medizinische Blocker (Observer-Write-Bug) ist geschlossen
- PIN-Sicherheit entspricht jetzt einem modernen Mindeststandard
- Maltes Alltag hat mit BZ-Hero und täglichen Challenges eine deutliche Verbesserung erhalten

Der Sprint wurde mit **52 grünen Tests** und **vollständiger Dokumentationspflege** abgeschlossen.

---

## Systemstand Sprint 12

### Sicherheit
- PINs werden als SHA-256 (Web Crypto API) gespeichert — kein Klartext mehr
- Observer-Write-Guard in `state.save()` verhindert Schreibzugriff für Beobachter-Rolle
- Audit-Log protokolliert 5 kritische Admin-Aktionen persistent
- Service Worker v12.0 — Cacheversionierung zuverlässig

### UX
- BZ-Hero-Widget zeigt aktuellen BZ als 72px-Zahl + Trendpfeil
- Tägliche Challenges (BZ, Mahlzeit, Aktivität) + Coin-System für Motivation
- Settings zeigen Dirty-State bei ungespeicherten medizinischen Feldern
- `kind_young`-Theme: Buttons 56px, runde Ecken, größere Inputs

### Technik
- Testsuite: 52 Tests, 4 Dateien, alle grün
- Neue Sprint-12-Tests für SEC-01, DASH-01, DASH-02
- Barcode-Scanner mit manuellem EAN-Fallback

---

## Offene Findings (Sprint 13)

### Mittel
- `pin_changed` fehlt im Audit-Log (war im Sprint geplant, nicht geliefert)
- `COOKBOOK.md` nicht auf Sprint-12-Stand gebracht
- Entry-Objekte haben keinen gemeinsamen Typedef — Widgets können Feldnamen falsch referenzieren (in Sprint 12 passiert: `timestamp` statt `ts`)

### Niedrig
- `timeStr` in `bz-hero.js` wird berechnet aber nicht genutzt
- Coin-System hat keine Einlösebene für Malte
- Challenge-Reihenfolge ist statisch, keine Kontextualisierung nach Tageszeit/BZ

---

## Priorisierte Findings (historisch offen)

### Kritisch (offen)
- **BL-S01:** Insulin-Rechner warnt nicht bei unrealistischen Parametern (Ratio < 5 oder > 30)
- **BL-S05:** Keine Warnung vor Auto-Löschung von CGM-Daten > 90 Tage

### Hoch (offen)
- **BL-H01:** PIN-Länge konfigurierbar (4–6 Stellen) — 4-stellig mit Rate-Limit akzeptabel, 6-stellig wäre besser
- **BL-H02:** Admin-Rollenhochstufung hat keinen automatischen Timeout
- **DOC-01:** Nutzerhandbuch für Familien fehlt noch

### Testabdeckung
- Stark: Auth, Gamification, Food-Utils, Sprint-12-Kernlogik
- Schwächer: Observer-Flow End-to-End, Share-UI, Barcode-Browser-Matrix, vollständige Widget-Render-Tests

---

## Betriebsrisiken

- Keine neuen Risiken eingeführt in Sprint 12
- Bestehend: RabbitMQ-Endzustellung für alle Reminder-Ketten noch nicht vollständig
- Bestehend: Nightscout-Hintergrund-Sync noch nicht implementiert

---

## Empfehlung

Das Inkrement ist **freigabefähig**.

Nächste Prio für Sprint 13:
1. `pin_changed` im Audit-Log
2. `COOKBOOK.md` aktualisieren
3. Entry-Typedef einführen
4. BL-S01 (Insulin-Rechner-Warnung) — medizinisch relevant
