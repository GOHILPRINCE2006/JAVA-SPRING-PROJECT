package com.lostfound.lostfound.exception;

import com.lostfound.lostfound.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.TypeMismatchException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/**
 * Turns every exception into the same JSON envelope the frontend expects:
 * {"success":false,"message":"...","data":null}. Stack traces and internals are logged, never returned.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handle(Exception ex) {
        if (ex instanceof AccessDeniedException) {
            return build(HttpStatus.FORBIDDEN, "You do not have permission to perform this action.");
        }
        if (ex instanceof AuthenticationException) {
            return build(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (ex instanceof ResponseStatusException rse) {
            String reason = rse.getReason();
            return build(rse.getStatusCode(),
                    reason != null && !reason.isBlank() ? reason : defaultMessage(rse.getStatusCode()));
        }
        if (ex instanceof ErrorResponse errorResponse) {
            return build(errorResponse.getStatusCode(), defaultMessage(errorResponse.getStatusCode()));
        }
        if (ex instanceof HttpMessageNotReadableException) {
            return build(HttpStatus.BAD_REQUEST, "The request body is missing or malformed.");
        }
        if (ex instanceof TypeMismatchException) {
            return build(HttpStatus.BAD_REQUEST, "A request parameter has an invalid value.");
        }
        if (ex instanceof DataIntegrityViolationException dive) {
            // Log the real database reason so it is visible in the IntelliJ Run window.
            String cause = dive.getMostSpecificCause() != null ? dive.getMostSpecificCause().getMessage() : dive.getMessage();
            log.warn("Data integrity violation: {}", cause);
            if (cause != null && cause.contains("Duplicate entry")) {
                String lower = cause.toLowerCase();
                return build(HttpStatus.CONFLICT, lower.contains("email")
                        ? "Email is already in use"
                        : "A record with the same value already exists.");
            }
            return build(HttpStatus.CONFLICT, "The request conflicts with existing data.");
        }
        log.error("Unhandled exception", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred. Please try again later.");
    }

    private static ResponseEntity<ApiResponse> build(HttpStatusCode status, String message) {
        return ResponseEntity.status(status).body(ApiResponse.error(message));
    }

    private static String defaultMessage(HttpStatusCode status) {
        int code = status.value();
        if (code == 400) return "The request is not valid.";
        if (code == 401) return "Authentication required";
        if (code == 403) return "You do not have permission to perform this action.";
        if (code == 404) return "The requested resource was not found.";
        if (code == 405) return "This operation is not supported.";
        if (code == 409) return "The request conflicts with existing data.";
        if (code == 415) return "Unsupported content type.";
        if (code >= 500) return "An unexpected error occurred. Please try again later.";
        return "The request could not be completed.";
    }
}