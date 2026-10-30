package com.lostfound.lostfound.dto;

import com.lostfound.lostfound.entity.User;

/** Safe user representation returned to the browser. Never contains the password hash. */
public record UserResponse(Long id, String name, String email, String role) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole() == null ? null : user.getRole().name());
    }
}
