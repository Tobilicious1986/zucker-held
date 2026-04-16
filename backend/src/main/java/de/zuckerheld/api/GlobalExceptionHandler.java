package de.zuckerheld.api;

import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Zentraler Exception-Handler für alle REST-Controller.
 * Gibt einheitliche JSON-Fehlerantworten zurück.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── 404 Not Found ──────────────────────────────────────────────────────

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException ex) {
        log.debug("Entity nicht gefunden: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", ex.getMessage(), 404));
    }

    // ── 403 Forbidden ─────────────────────────────────────────────────────

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        log.debug("Zugriff verweigert: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("FORBIDDEN", "Zugriff verweigert", 403));
    }

    // ── 401 Unauthorized (wird hier als RuntimeException mit passendem Msg behandelt) ──

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.debug("Ungültiges Argument: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("BAD_REQUEST", ex.getMessage(), 400));
    }

    // ── 400 Bad Request (Validation) ──────────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Ungültiger Wert",
                        (a, b) -> a  // bei doppelten Feldern ersten Fehler behalten
                ));

        log.debug("Validierungsfehler: {}", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ValidationErrorResponse("VALIDATION_ERROR",
                        "Eingabe enthält Fehler", 400, fieldErrors));
    }

    // ── ResponseStatusException (4xx/5xx aus Controllern) ────────────────
    // MUSS vor dem RuntimeException-Handler stehen, da ResponseStatusException
    // eine Unterklasse von RuntimeException ist.

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex) {
        int statusCode = ex.getStatusCode().value();
        if (statusCode >= 500) {
            log.error("ResponseStatusException: {} — {}", statusCode, ex.getReason());
        } else {
            log.debug("ResponseStatusException: {} — {}", statusCode, ex.getReason());
        }
        String reason = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        return ResponseEntity.status(ex.getStatusCode())
                .body(new ErrorResponse(ex.getStatusCode().toString(), reason, statusCode));
    }

    // ── 500 Internal Server Error ─────────────────────────────────────────

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntime(RuntimeException ex) {
        log.error("Unerwarteter Fehler: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("INTERNAL_ERROR",
                        "Ein interner Fehler ist aufgetreten. Bitte versuche es später erneut.", 500));
    }

    // ── Response-Records ──────────────────────────────────────────────────

    public record ErrorResponse(
            String error,
            String message,
            int    status
    ) {
        // timestamp für Debugging
        private static final OffsetDateTime BOOT_TIME = OffsetDateTime.now();
    }

    public record ValidationErrorResponse(
            String              error,
            String              message,
            int                 status,
            Map<String, String> fields
    ) {}
}
