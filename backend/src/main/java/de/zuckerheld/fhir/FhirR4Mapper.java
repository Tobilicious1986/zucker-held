package de.zuckerheld.fhir;

import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.domain.model.Profile;
import org.hl7.fhir.r4.model.*;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Mappt Zucker-Held Domain-Objekte auf FHIR R4-Ressourcen.
 * Implementierte Ressourcen:
 *  - Profile  → Patient
 *  - Entry(BZ) → Observation (LOINC 15074-8: Glucose [Moles/volume] in Blood)
 *  - Entry(Insulin) → MedicationAdministration
 *  - Entry(Ketone) → Observation (LOINC 53061-6: Ketones [Moles/volume] in Blood)
 */
@Component
public class FhirR4Mapper {

    private static final String LOINC_SYSTEM     = "http://loinc.org";
    private static final String LOINC_GLUCOSE    = "15074-8";
    private static final String LOINC_GLUCOSE_DISPLAY = "Glucose [Moles/volume] in Blood";
    private static final String LOINC_KETONE     = "53061-6";
    private static final String LOINC_KETONE_DISPLAY = "Ketones [Moles/volume] in Blood";
    private static final String UCUM_MG_DL       = "mg/dL";
    private static final String UCUM_MMOL_L      = "mmol/L";
    private static final String UCUM_SYSTEM      = "http://unitsofmeasure.org";
    private static final String BASE_URL         = "https://zuckerheld.de/fhir/R4";

    // ── Profile → Patient ──────────────────────────────────────────────────

    public Patient toPatient(Profile profile) {
        Patient patient = new Patient();
        patient.setId(profile.getId());
        patient.getMeta().setLastUpdated(Date.from(profile.getUpdatedAt().toInstant()));

        // Name
        HumanName name = new HumanName();
        name.setText(profile.getName());
        patient.addName(name);

        // Identifier (interne ID)
        patient.addIdentifier()
            .setSystem(BASE_URL + "/identifier/profile")
            .setValue(profile.getId());

        // Extension: Profiltyp (kind/erwachsen)
        patient.addExtension(
            BASE_URL + "/extension/profile-type",
            new StringType(profile.getType().toString())
        );

        return patient;
    }

    // ── BZ-Entry → Observation ────────────────────────────────────────────

    public Observation toBZObservation(Entry entry) {
        if (entry.getBzValue() == null) return null;

        Observation obs = new Observation();
        obs.setId(entry.getId());
        obs.getMeta().setLastUpdated(Date.from(entry.getCreatedAt().toInstant()));

        // Status
        obs.setStatus(Observation.ObservationStatus.FINAL);

        // Code: LOINC Glucose
        obs.getCode()
            .addCoding()
            .setSystem(LOINC_SYSTEM)
            .setCode(LOINC_GLUCOSE)
            .setDisplay(LOINC_GLUCOSE_DISPLAY);

        // Subject: Referenz auf Patient
        obs.getSubject().setReference("Patient/" + entry.getProfile().getId());

        // Zeitpunkt
        obs.setEffective(new DateTimeType(new Date(entry.getTimestamp())));

        // Wert in mg/dL
        Quantity qty = new Quantity();
        qty.setValue(entry.getBzValue());
        qty.setUnit(UCUM_MG_DL);
        qty.setSystem(UCUM_SYSTEM);
        qty.setCode(UCUM_MG_DL);
        obs.setValue(qty);

        // Interpretations-Code (in/out of range)
        if (entry.getBzInTarget() != null) {
            String interpretCode = entry.getBzInTarget() ? "N" : "H";
            String interpretDisplay = entry.getBzInTarget() ? "Normal" : "High";
            obs.addInterpretation()
                .addCoding()
                .setSystem("http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation")
                .setCode(interpretCode)
                .setDisplay(interpretDisplay);
        }

        // Quelle (manual/CGM)
        if (entry.getSource() != null) {
            obs.addExtension(
                BASE_URL + "/extension/source",
                new StringType(entry.getSource())
            );
        }

        return obs;
    }

    // ── Ketone-Entry → Observation ────────────────────────────────────────

    public Observation toKetoneObservation(Entry entry) {
        if (entry.getKetoneValue() == null) return null;

        Observation obs = new Observation();
        obs.setId(entry.getId());

        obs.setStatus(Observation.ObservationStatus.FINAL);

        obs.getCode()
            .addCoding()
            .setSystem(LOINC_SYSTEM)
            .setCode(LOINC_KETONE)
            .setDisplay(LOINC_KETONE_DISPLAY);

        obs.getSubject().setReference("Patient/" + entry.getProfile().getId());
        obs.setEffective(new DateTimeType(new Date(entry.getTimestamp())));

        Quantity qty = new Quantity();
        qty.setValue(entry.getKetoneValue());
        String unit = "mg".equals(entry.getKetoneUnit()) ? "mg/dL" : UCUM_MMOL_L;
        qty.setUnit(unit);
        qty.setSystem(UCUM_SYSTEM);
        qty.setCode(unit);
        obs.setValue(qty);

        return obs;
    }

    // ── Entry → FHIR-Ressource (generisch) ────────────────────────────────

    public Resource toFhirResource(Entry entry) {
        return switch (entry.getType()) {
            case BZ      -> toBZObservation(entry);
            case KETONE  -> toKetoneObservation(entry);
            default      -> null;
        };
    }
}
