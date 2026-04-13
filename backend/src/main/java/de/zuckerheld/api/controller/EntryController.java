package de.zuckerheld.api.controller;

import de.zuckerheld.api.dto.EntryDtos;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.service.EntryService;
import de.zuckerheld.domain.service.ProfileLinkService;
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
import org.springframework.web.server.ResponseStatusException;

/**
 * Tagebuch-Einträge: BZ, Insulin, Mahlzeiten, Aktivitäten, Ketone.
 */
@RestController
@RequestMapping("/api/v1/entries")
@PreAuthorize("hasAnyRole('CAREGIVER', 'PATIENT', 'ADMIN')")
@Tag(name = "Entries", description = "Diabetes-Tagebuch Einträge")
public class EntryController {

    private final EntryService        entryService;
    private final ProfileLinkService  linkService;

    public EntryController(EntryService entryService, ProfileLinkService linkService) {
        this.entryService = entryService;
        this.linkService  = linkService;
    }

    // ═══════════════════════════════════════════════════════════════════════

    @Operation(summary = "Einträge abrufen (paginiert, optional nach Typ/Zeitraum filtern). " +
               "Mit Header X-Viewing-Profile-Id kann ein Watcher die Daten eines anderen Profils abrufen.")
    @GetMapping
    public Page<EntryDtos.EntryResponse> getEntries(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long   from,
            @RequestParam(required = false) Long   to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestHeader(value = "X-Viewing-Profile-Id", required = false) String viewingProfileId,
            Authentication auth) {

        String   callerId = ((Profile) auth.getPrincipal()).getId();
        String   profileId;

        if (viewingProfileId != null && !viewingProfileId.isBlank()) {
            // Observer-Mode: Prüfe ob Caller Zugriff auf fremdes Profil hat
            if (!linkService.hasAccess(viewingProfileId, callerId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Kein Zugriff auf dieses Profil.");
            }
            profileId = viewingProfileId;
        } else {
            profileId = callerId;
        }

        Pageable pageable = PageRequest.of(page, Math.min(size, 200));
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
