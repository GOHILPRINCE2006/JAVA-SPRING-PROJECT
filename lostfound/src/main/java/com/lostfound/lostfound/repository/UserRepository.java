package com.lostfound.lostfound.repository;

import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Find user by email (for login)
    Optional<User> findByEmail(String email);

    // Check if email exists (for registration)
    boolean existsByEmail(String email);

    // Find users by role (optional)
    List<User> findByRole(UserRole role);
}