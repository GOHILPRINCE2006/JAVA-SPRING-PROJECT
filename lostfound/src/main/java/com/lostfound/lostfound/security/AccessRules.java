package com.lostfound.lostfound.security;

import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.entity.UserRole;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Central ownership / role checks used by controllers and services. Authorization is enforced server-side. */
public final class AccessRules {

    private AccessRules() {
    }

    public static boolean isAdmin(User user) {
        return user != null && user.getRole() == UserRole.ADMIN;
    }

    public static boolean isSelf(User user, Long ownerId) {
        return user != null && user.getId() != null && user.getId().equals(ownerId);
    }

    public static void requireSelfOrAdmin(User current, Long ownerId) {
        if (!isAdmin(current) && !isSelf(current, ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to access this resource");
        }
    }
}
