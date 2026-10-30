package com.lostfound.lostfound.security;

import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** Derives the acting user from the authenticated principal only, never from request data. */
@Component
@RequiredArgsConstructor
public class CurrentUserResolver {

    private final UserService userService;

    public User resolve(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        // A session may outlive its user (e.g. account deleted): treat as unauthenticated.
        return userService.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required"));
    }
}
