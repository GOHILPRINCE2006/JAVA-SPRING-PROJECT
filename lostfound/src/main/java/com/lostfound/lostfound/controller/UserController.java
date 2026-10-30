package com.lostfound.lostfound.controller;

import com.lostfound.lostfound.dto.ApiResponse;
import com.lostfound.lostfound.dto.LoginRequest;
import com.lostfound.lostfound.dto.LoginResponse;
import com.lostfound.lostfound.dto.RegisterRequest;
import com.lostfound.lostfound.dto.UpdateUserRequest;
import com.lostfound.lostfound.dto.UserResponse;
import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.security.AccessRules;
import com.lostfound.lostfound.security.CurrentUserResolver;
import com.lostfound.lostfound.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final CurrentUserResolver currentUserResolver;

    private final SecurityContextHolderStrategy securityContextHolderStrategy =
            SecurityContextHolder.getContextHolderStrategy();

    // REGISTER - Create new user account (role is always USER)
    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@RequestBody RegisterRequest request) {
        User savedUser = userService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", UserResponse.from(savedUser)));
    }

    // LOGIN - Authenticate and store the authentication in the HTTP session (JSESSIONID cookie)
    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@RequestBody LoginRequest loginRequest,
                                             HttpServletRequest request,
                                             HttpServletResponse response) {
        String email = loginRequest.getEmail() == null ? "" : loginRequest.getEmail().trim();
        String password = loginRequest.getPassword() == null ? "" : loginRequest.getPassword();
        if (email.isEmpty() || password.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Email and password are required"));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(email, password));

            // Session-fixation protection: new session id for the authenticated session.
            if (request.getSession(false) != null) {
                request.changeSessionId();
            }

            // Persist the security context so that LATER requests are authenticated.
            SecurityContext context = securityContextHolderStrategy.createEmptyContext();
            context.setAuthentication(authentication);
            securityContextHolderStrategy.setContext(context);
            securityContextRepository.saveContext(context, request, response);

            User user = userService.getUserByEmail(authentication.getName());
            LoginResponse body = new LoginResponse(
                    "Login successful",
                    user.getEmail(),
                    user.getName(),
                    user.getRole().toString(),
                    user.getId());
            return ResponseEntity.ok(ApiResponse.success("Login successful", body));

        } catch (AuthenticationException e) {
            // Deliberately generic: never reveal whether the email exists.
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid email or password"));
        }
    }

    // GET ALL USERS - Admin only (SecurityConfig)
    @GetMapping
    public ResponseEntity<ApiResponse> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers().stream().map(UserResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }

    // GET USER BY ID - the user themself or an admin
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getUserById(@PathVariable Long id, Authentication authentication) {
        User current = currentUserResolver.resolve(authentication);
        AccessRules.requireSelfOrAdmin(current, id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully",
                UserResponse.from(userService.getUserById(id))));
    }

    // GET CURRENT USER PROFILE
    @GetMapping("/profile/me")
    public ResponseEntity<ApiResponse> getCurrentUser(Authentication authentication) {
        User user = currentUserResolver.resolve(authentication);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", UserResponse.from(user)));
    }

    // UPDATE USER - own name / password only; role and email cannot be changed here
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateUser(@PathVariable Long id,
                                                  @RequestBody UpdateUserRequest request,
                                                  Authentication authentication) {
        User current = currentUserResolver.resolve(authentication);
        User updated = userService.updateProfile(id, request, current);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", UserResponse.from(updated)));
    }

    // DELETE USER - Admin only (SecurityConfig); an admin cannot delete themself
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long id, Authentication authentication) {
        User current = currentUserResolver.resolve(authentication);
        userService.deleteUser(id, current);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }
}
