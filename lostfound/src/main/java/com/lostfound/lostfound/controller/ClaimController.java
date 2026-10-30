package com.lostfound.lostfound.controller;

import com.lostfound.lostfound.dto.ApiResponse;
import com.lostfound.lostfound.dto.ClaimRequest;
import com.lostfound.lostfound.dto.ClaimResponse;
import com.lostfound.lostfound.entity.Claim;
import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.security.AccessRules;
import com.lostfound.lostfound.security.CurrentUserResolver;
import com.lostfound.lostfound.service.ClaimService;
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
    private final CurrentUserResolver currentUserResolver;

    // The claimant's email is only included for admins.
    private static List<ClaimResponse> toResponses(List<Claim> claims, User viewer) {
        boolean admin = AccessRules.isAdmin(viewer);
        return claims.stream().map(claim -> ClaimResponse.from(claim, admin)).toList();
    }

    // POST /api/claims?itemId=1 - Submit a new claim (claimant = authenticated user)
    @PostMapping
    public ResponseEntity<ClaimResponse> submitClaim(@RequestBody ClaimRequest request,
                                                     @RequestParam Long itemId,
                                                     Authentication authentication) {
        User user = currentUserResolver.resolve(authentication);
        Claim claim = claimService.submitClaim(request, itemId, user);
        return ResponseEntity.ok(ClaimResponse.from(claim, false));
    }

    // GET /api/claims - all claims (admin only)
    @GetMapping
    public ResponseEntity<List<ClaimResponse>> getAllClaims(Authentication authentication) {
        User user = currentUserResolver.resolve(authentication);
        return ResponseEntity.ok(toResponses(claimService.getAllClaims(), user));
    }

    // GET /api/claims/{id} - the claimant or an admin
    @GetMapping("/{id}")
    public ResponseEntity<ClaimResponse> getClaimById(@PathVariable Long id, Authentication authentication) {
        User user = currentUserResolver.resolve(authentication);
        Claim claim = claimService.getClaimForUser(id, user);
        return ResponseEntity.ok(ClaimResponse.from(claim, AccessRules.isAdmin(user)));
    }

    // GET /api/claims/item/{itemId} - claims for an item (admin only)
    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<ClaimResponse>> getClaimsByItem(@PathVariable Long itemId,
                                                               Authentication authentication) {
        User user = currentUserResolver.resolve(authentication);
        return ResponseEntity.ok(toResponses(claimService.getClaimsByItem(itemId), user));
    }

    // GET /api/claims/user/me - the authenticated user's claims
    @GetMapping("/user/me")
    public ResponseEntity<List<ClaimResponse>> getMyClaims(Authentication authentication) {
        User user = currentUserResolver.resolve(authentication);
        return ResponseEntity.ok(toResponses(claimService.getClaimsByUser(user.getId()), user));
    }

    // GET /api/claims/user/{userId} - admin only (SecurityConfig); re-checked here to prevent IDOR
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ClaimResponse>> getClaimsByUser(@PathVariable Long userId,
                                                               Authentication authentication) {
        User user = currentUserResolver.resolve(authentication);
        AccessRules.requireSelfOrAdmin(user, userId);
        return ResponseEntity.ok(toResponses(claimService.getClaimsByUser(userId), user));
    }

    // PUT /api/claims/{id}/status?status=APPROVED - admin only (SecurityConfig)
    @PutMapping("/{id}/status")
    public ResponseEntity<ClaimResponse> updateClaimStatus(@PathVariable Long id,
                                                           @RequestParam Claim.ClaimStatus status,
                                                           Authentication authentication) {
        User user = currentUserResolver.resolve(authentication);
        return ResponseEntity.ok(ClaimResponse.from(claimService.updateClaimStatus(id, status), AccessRules.isAdmin(user)));
    }

    // DELETE /api/claims/{id} - claimant (pending only) or admin
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteClaim(@PathVariable Long id, Authentication authentication) {
        User user = currentUserResolver.resolve(authentication);
        claimService.deleteClaim(id, user);
        return ResponseEntity.ok(ApiResponse.success("Claim deleted successfully", null));
    }
}
