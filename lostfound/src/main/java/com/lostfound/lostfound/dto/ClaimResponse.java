package com.lostfound.lostfound.dto;

import com.lostfound.lostfound.entity.Claim;

import java.time.LocalDateTime;

/** claimantEmail is only populated for ADMIN callers; it is null otherwise. */
public record ClaimResponse(
        Long id,
        String message,
        Claim.ClaimStatus status,
        LocalDateTime claimedAt,
        ItemSummary item,
        UserSummary claimedBy,
        String claimantEmail) {

    public static ClaimResponse from(Claim claim, boolean includeClaimantEmail) {
        return new ClaimResponse(
                claim.getId(),
                claim.getMessage(),
                claim.getStatus(),
                claim.getClaimedAt(),
                ItemSummary.from(claim.getItem()),
                UserSummary.from(claim.getClaimedBy()),
                includeClaimantEmail && claim.getClaimedBy() != null ? claim.getClaimedBy().getEmail() : null);
    }
}
