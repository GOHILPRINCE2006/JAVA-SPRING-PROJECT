package com.lostfound.lostfound.dto;

/**
 * Self-service profile update. There is deliberately no role or email field:
 * roles can never be changed through the API and the email is the login identity.
 * newPassword is optional; when present, currentPassword must match.
 */
public record UpdateUserRequest(String name, String currentPassword, String newPassword) {
}
