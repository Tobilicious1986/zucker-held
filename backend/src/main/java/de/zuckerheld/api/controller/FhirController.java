package de.zuckerheld.api.controller;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.parser.IParser;
import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.fhir.FhirR4Mapper;
import de.zuckerheld.infrastructure.repository.EntryRepository;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import org.hl7.fhir.r4.model.*;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * FHIR R4 Read-Only Endpunkte.
 * Zugriff: mind. Observer-Rolle (Arzt, Familie).
 * Content-Type: application/fhir+json
 */
@RestController
@RequestMapping("/fhir/R4")
@PreAuthorize("hasAnyRole('OBSERVER', 'CAREGIVER', 'PATIENT', 'ADMIN')")
@Tag(name = "FHIR R4", description = "FHIR R4-kompatible Read-Only Endpunkte")
public class FhirController {

    private final ProfileRepository profileRepository;
    private final EntryRepository   entryRepository;
    private final FhirR4Mapper      mapper;
    private final FhirContext       fhirContext = FhirContext.forR4();

    public FhirController(ProfileRepository profileRepository,
                          EntryRepository entryRepository,
                          FhirR4Mapper mapper) {
        this.profileRepository = profileRepository;
        this.entryRepository   = entryRepository;
        this.mapper            = mapper;
    }

    // ── Patient ───────────────────────────────────────────────────────────

    @GetMapping(value = "/Patient/{id}", produces = "application/fhir+json")
    @Operation(summary = "Profil als FHIR Patient-Ressource")
    public String getPatient(@PathVariable String id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profil nicht gefunden: " + id));
        Patient patient = mapper.toPatient(profile);
        return toJson(patient);
    }

    // ── Observations (BZ + Ketone) ────────────────────────────────────────

    @GetMapping(value = "/Observation/{id}", produces = "application/fhir+json")
    @Operation(summary = "Einzelner Eintrag als FHIR Observation")
    public String getObservation(@PathVariable String id) {
        Entry entry = entryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Eintrag nicht gefunden: " + id));

        var resource = mapper.toFhirResource(entry);
        if (resource == null) {
            throw new EntityNotFoundException("Eintrag ist kein BZ/Ketone-Wert: " + id);
        }
        return toJson(resource);
    }

    @GetMapping(value = "/Observation", produces = "application/fhir+json")
    @Operation(summary = "BZ + Ketone-Messungen als FHIR Bundle",
               description = "Parameter: patient (required), date (optional, Format YYYY-MM-DD), code (optional, LOINC)")
    public String searchObservations(
            @RequestParam String patient,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String code) {

        // BZ + Ketone-Einträge laden
        List<Entry> entries = entryRepository.findByProfileAndTimeRange(
                patient,
                0L,
                Long.MAX_VALUE
        ).stream()
         .filter(e -> e.getType() == Entry.EntryType.BZ || e.getType() == Entry.EntryType.KETONE)
         .toList();

        // LOINC-Code-Filter
        if (code != null && !code.isBlank()) {
            boolean wantGlucose = "15074-8".equals(code);
            boolean wantKetone  = "53061-6".equals(code);
            entries = entries.stream()
                .filter(e -> (wantGlucose && e.getType() == Entry.EntryType.BZ)
                          || (wantKetone  && e.getType() == Entry.EntryType.KETONE))
                .toList();
        }

        // Bundle zusammenbauen
        Bundle bundle = new Bundle();
        bundle.setType(Bundle.BundleType.SEARCHSET);
        bundle.setTotal(entries.size());

        for (Entry entry : entries) {
            var resource = mapper.toFhirResource(entry);
            if (resource != null) {
                bundle.addEntry()
                      .setResource((Resource) resource)
                      .getRequest().setMethod(Bundle.HTTPVerb.GET);
            }
        }

        return toJson(bundle);
    }

    // ── Capability Statement ──────────────────────────────────────────────

    @GetMapping(value = "/metadata", produces = "application/fhir+json")
    @Operation(summary = "FHIR CapabilityStatement")
    public String capabilityStatement() {
        CapabilityStatement cs = new CapabilityStatement();
        cs.setStatus(Enumerations.PublicationStatus.ACTIVE);
        cs.setFhirVersion(Enumerations.FHIRVersion._4_0_1);
        cs.setKind(CapabilityStatement.CapabilityStatementKind.INSTANCE);

        CapabilityStatement.CapabilityStatementRestComponent rest =
            new CapabilityStatement.CapabilityStatementRestComponent();
        rest.setMode(CapabilityStatement.RestfulCapabilityMode.SERVER);

        // Patient
        CapabilityStatement.CapabilityStatementRestResourceComponent patientRes =
            new CapabilityStatement.CapabilityStatementRestResourceComponent();
        patientRes.setType("Patient");
        patientRes.addInteraction().setCode(CapabilityStatement.TypeRestfulInteraction.READ);
        rest.addResource(patientRes);

        // Observation
        CapabilityStatement.CapabilityStatementRestResourceComponent obsRes =
            new CapabilityStatement.CapabilityStatementRestResourceComponent();
        obsRes.setType("Observation");
        obsRes.addInteraction().setCode(CapabilityStatement.TypeRestfulInteraction.READ);
        obsRes.addInteraction().setCode(CapabilityStatement.TypeRestfulInteraction.SEARCHTYPE);
        rest.addResource(obsRes);

        cs.addRest(rest);
        return toJson(cs);
    }

    // ── Hilfsmethode ──────────────────────────────────────────────────────

    private String toJson(IBaseResource resource) {
        IParser parser = fhirContext.newJsonParser().setPrettyPrint(true);
        return parser.encodeResourceToString(resource);
    }

    // Hilfsmethode für Bundle
    private interface IBaseResource extends org.hl7.fhir.instance.model.api.IBaseResource {}

    private String toJson(Object resource) {
        IParser parser = fhirContext.newJsonParser().setPrettyPrint(true);
        return parser.encodeResourceToString((org.hl7.fhir.instance.model.api.IBaseResource) resource);
    }
}
