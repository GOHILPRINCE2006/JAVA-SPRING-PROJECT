package com.lostfound.lostfound.dto;

import com.lostfound.lostfound.entity.User;

/** Minimal public view of a user: never contains email, password or role. */
public record UserSummary(Long id, String name) {
    public static UserSummary from(User user) {
        return user == null ? null : new UserSummary(user.getId(), user.getName());
    }
}
