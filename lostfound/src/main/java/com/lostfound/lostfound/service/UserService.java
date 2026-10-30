package com.lostfound.lostfound.service;

import com.lostfound.lostfound.dto.RegisterRequest;
import com.lostfound.lostfound.dto.UpdateUserRequest;
import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.entity.UserRole;
import com.lostfound.lostfound.repository.UserRepository;
import com.lostfound.lostfound.security.AccessRules;
import com.lostfound.lostfound.util.Validation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /** Registers a new account. The role is ALWAYS USER; nothing from the client can change that. */
    @Transactional
    public User register(RegisterRequest request) {
        String name = Validation.requireText(request.getName(), "Name", 100);
        String email = Validation.requireEmail(request.getEmail());
        Validation.requirePassword(request.getPassword());

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.USER);
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Self-service update of name and (optionally) password. Only the account owner may do this.
     * Email and role are intentionally not updatable here.
     */
    @Transactional
    public User updateProfile(Long id, UpdateUserRequest request, User current) {
        if (!AccessRules.isSelf(current, id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own profile");
        }
        User user = getUserById(id);

        if (request.name() != null) {
            user.setName(Validation.requireText(request.name(), "Name", 100));
        }

        if (request.newPassword() != null && !request.newPassword().isEmpty()) {
            if (request.currentPassword() == null
                    || !passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
                throw Validation.badRequest("Current password is incorrect");
            }
            Validation.requirePassword(request.newPassword());
            user.setPassword(passwordEncoder.encode(request.newPassword()));
        }
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id, User current) {
        if (AccessRules.isSelf(current, id)) {
            throw Validation.badRequest("You cannot delete your own account");
        }
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        userRepository.deleteById(id);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}
