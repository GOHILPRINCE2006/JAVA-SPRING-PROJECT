package com.lostfound.lostfound.util;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;

/** Small server-side validation helpers. Failures become HTTP 400 with a safe message. */
public final class Validation {

    private Validation() {
    }

    public static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    /** Required, trimmed, non-blank text with a maximum length. */
    public static String requireText(String value, String field, int maxLength) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.isEmpty()) {
            throw badRequest(field + " is required");
        }
        if (trimmed.length() > maxLength) {
            throw badRequest(field + " must be at most " + maxLength + " characters");
        }
        return trimmed;
    }

    /** Optional text: null/blank becomes null; otherwise trimmed and length-checked. */
    public static String optionalText(String value, String field, int maxLength) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw badRequest(field + " must be at most " + maxLength + " characters");
        }
        return trimmed;
    }

    public static String requireEmail(String value) {
        String email = requireText(value, "Email", 254);
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw badRequest("Email address is not valid");
        }
        return email;
    }

    /** 8+ characters and at most 72 bytes (the BCrypt limit). */
    public static void requirePassword(String password) {
        if (password == null || password.length() < 8) {
            throw badRequest("Password must be at least 8 characters");
        }
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw badRequest("Password is too long (maximum 72 bytes)");
        }
    }
}
