package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.EntryDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.EntryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Tagebuch-Einträge: BZ, Insulin, Mahlzeiten, Aktivitäten, Ketone.
 */
@RestController
@RequestMapping("/api/v1/entries")
@PreAuthorize("hasAnyRole('CAREGIVER', 'PATIENT', 'ADMIN')")
@Tag(name = "Entries", description = "Diabetes-Tagebuch Einträge")
public class EntryController {

    private final EntryService entryService;

    public EntryController(EntryService entryService) {
        this.entryService = entryService;
    }

    // ═══════════════════════════════════════════════════════════════════════

    @Operation(summary = "Einträge abrufen (paginiert, optional nach Typ/Zeitraum filtern)")
    @GetMapping
    public Page<EntryDtos.EntryResponse> getEntries(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long   from,
            @RequestParam(required = false) Long   to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication auth) {

        String   profileId = ((Profile) auth.getPrincipal()).getId();
        Pageable pageable  = PageRequest.of(page, Math.min(size, 200));

        return entryService.getEntries(profileId, type, from, to, pageable)
                .map(EntryDtos.EntryResponse::from);
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Neuen Eintrag erstellen")
    @PostMapping
    public ResponseEntity<EntryDtos.EntryResponse> createEntry(
            @Valid @RequestBody EntryDtos.CreateEntryRequest req,
            Authentication auth) {

        String profileId = ((Profile) auth.getPrincipal()).getId();
        var    entry     = entryService.createEntry(profileId, req);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(EntryDtos.EntryResponse.from(entry));
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Eintrag löschen")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(@PathVariable String id, Authentication auth) {
        String profileId = ((Profile) auth.getPrincipal()).getId();
        entryService.deleteEntry(profileId, id);
        return ResponseEntity.noContent().build();
    }

    // ───────────────────────────────────────────────────────────────────────

    @Operation(summary = "Batch-Sync: Mehrere Einträge auf einmal importieren (Offline-Sync)")
    @PostMapping("/batch")
    public ResponseEntity<EntryDtos.BatchSyncResponse> batchSync(
            @Valid @RequestBody EntryDtos.BatchSyncRequest req,
            Authentication auth) {

        String profileId = ((Profile) auth.getPrincipal()).getId();
        EntryDtos.BatchSyncResponse response = entryService.batchSync(profileId, req.entries());

        return ResponseEntity.ok(response);
    }
}
