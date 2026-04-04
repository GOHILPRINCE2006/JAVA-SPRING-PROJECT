package com.lostfound.lostfound.controller;

import com.lostfound.lostfound.entity.Claim;
import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.service.ClaimService;
import com.lostfound.lostfound.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;
    private final UserService userService;  // Add this

    // POST /api/claims?itemId=1 — Submit a new claim (userId from authenticated user)
    @PostMapping
    public ResponseEntity<Claim> submitClaim(@RequestBody Claim claim,
                                             @RequestParam Long itemId,
                                             Authentication authentication) {
        // Get logged-in user's email from authentication
        String email = authentication.getName();
        User loggedInUser = userService.getUserByEmail(email);
        Long userId = loggedInUser.getId();

        return ResponseEntity.ok(claimService.submitClaim(claim, itemId, userId));
    }

    // GET /api/claims — Get all claims (admin only)
    @GetMapping
    public ResponseEntity<List<Claim>> getAllClaims() {
        return ResponseEntity.ok(claimService.getAllClaims());
    }

    // GET /api/claims/{id} — Get claim by ID
    @GetMapping("/{id}")
    public ResponseEntity<Claim> getClaimById(@PathVariable Long id) {
        return ResponseEntity.ok(claimService.getClaimById(id));
    }

    // GET /api/claims/item/{itemId} — Get claims for a specific item
    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<Claim>> getClaimsByItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(claimService.getClaimsByItem(itemId));
    }

    // GET /api/claims/user/me — Get my claims (authenticated user)
    @GetMapping("/user/me")
    public ResponseEntity<List<Claim>> getMyClaims(Authentication authentication) {
        String email = authentication.getName();
        User loggedInUser = userService.getUserByEmail(email);
        Long userId = loggedInUser.getId();
        return ResponseEntity.ok(claimService.getClaimsByUser(userId));
    }

    // GET /api/claims/user/{userId} — Get claims by a specific user (admin only)
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Claim>> getClaimsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(claimService.getClaimsByUser(userId));
    }

    // PUT /api/claims/{id}/status?status=APPROVED — Approve or reject claim
    @PutMapping("/{id}/status")
    public ResponseEntity<Claim> updateClaimStatus(@PathVariable Long id,
                                                   @RequestParam Claim.ClaimStatus status) {
        return ResponseEntity.ok(claimService.updateClaimStatus(id, status));
    }

    // DELETE /api/claims/{id} — Delete claim
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteClaim(@PathVariable Long id) {
        claimService.deleteClaim(id);
        return ResponseEntity.ok("Claim deleted successfully");
    }
}