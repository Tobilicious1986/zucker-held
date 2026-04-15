# ADR-001 — Rollen- und Rechtekonzept

**Status:** Accepted  
**Datum:** 2026-04-15  
**Sprint:** 13

## Kontext
Zucker-Held ist aus einem Familien- und Kinderalltag heraus entstanden. Mit zunehmender Nutzung durch Eltern, Betreuer, Jugendliche, Erwachsene und perspektivisch medizinische Fachrollen reicht ein rein haushaltszentriertes Rechtebild nicht mehr aus. Gleichzeitig darf die Migration bestehender Profile nicht zum Datenverlust oder zu einem harten Systembruch führen.

## Entscheidung 1: Hybrides Identitätsmodell
- Bestehende lokale Profile bleiben erhalten und funktionieren weiter per Profil + PIN.
- Neue Konten können zusätzlich über E-Mail + Passwort angelegt werden.
- Die App bleibt für Endnutzer die primäre Oberfläche; externe IdP-Komplexität bleibt im Hintergrund.

**Begründung:** Bestehende Familien- und Kinderprofile dürfen nicht zwangsweise migriert werden. Gleichzeitig braucht die App einen Weg zu stärkerem Account- und Rollenmanagement.

## Entscheidung 2: Rollenmodell
Aktive Kernrollen:
- `patient` — eigener Vollzugriff
- `admin` — erweiterte Rechte auf ein Kinder-/Familienprofil
- `caregiver` — dokumentieren + lesen, aber keine kritischen Einstellungen
- `observer` — nur lesen

Perspektivische Erweiterungen:
- `arzt`
- `diabetesberater`
- `pflegepersonal`
- `klinik_admin`

## Entscheidung 3: Einwilligung vor Institution
- Zugriffe werden nicht institutionell pauschal vergeben.
- Der Patient bzw. das Familienprofil gibt Zugriff explizit frei.
- Freigaben sollen zeitlich begrenzbar und widerrufbar sein.
- Kritische Rechteänderungen und Freigaben gehören ins Audit-Log.

## Entscheidung 4: Datenisolation
- Kurz- und mittelfristig erfolgt die Isolation auf Service-Ebene.
- Jeder Zugriff muss gegen Eigentümerschaft oder eine aktive Freigabe geprüft werden.
- Datenbankseitige RLS bleibt ein späterer Skalierungspfad, ist aber aktuell kein Muss.

## Konsequenzen
### Positiv
- Bestehende lokale Nutzung bleibt stabil.
- Neue Registrierungs- und Rollenpfade sind möglich, ohne Familienprofile zu brechen.
- Das Rechtebild ist dokumentiert und für Sprint 14ff anschlussfähig.

### Negativ
- Das System bleibt vorerst hybrid und damit komplexer als ein vollständiger Greenfield-Account-Stack.
- Einige medizinische und institutionelle Rollen bleiben bewusst Folge-Sprints vorbehalten.

## Nächste Schritte
- Einladung und Einwilligung für Fachrollen konkretisieren
- Lösch- und Auskunftsrechte weiter DSGVO-sicher verdrahten
- Rechteauswertung im Observer-/Betreuer-Flow weiter schärfen
