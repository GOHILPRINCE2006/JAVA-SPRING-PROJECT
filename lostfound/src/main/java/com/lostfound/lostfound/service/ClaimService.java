package com.lostfound.lostfound.service;

import com.lostfound.lostfound.entity.Claim;
import com.lostfound.lostfound.entity.Item;
import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.repository.ClaimRepository;
import com.lostfound.lostfound.repository.ItemRepository;
import com.lostfound.lostfound.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;

    // Submit a new claim
    public Claim submitClaim(Claim claim, Long itemId, Long userId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found with id: " + itemId));

        // Prevent claim if item is already CLAIMED or RESOLVED
        if (item.getStatus() == Item.ItemStatus.CLAIMED || item.getStatus() == Item.ItemStatus.RESOLVED) {
            throw new RuntimeException("This item has already been claimed and is no longer available.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        claim.setItem(item);
        claim.setClaimedBy(user);
        claim.setStatus(Claim.ClaimStatus.PENDING);   // ✅ nested enum
        return claimRepository.save(claim);
    }

    // Get all claims (admin only)
    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    // Get claim by ID
    public Claim getClaimById(Long id) {
        return claimRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found with id: " + id));
    }

    // Get claims for a specific item
    public List<Claim> getClaimsByItem(Long itemId) {
        return claimRepository.findByItemId(itemId);
    }

    // Get claims by a specific user
    public List<Claim> getClaimsByUser(Long userId) {
        return claimRepository.findByClaimedById(userId);
    }

    // Approve or reject a claim – auto‑rejects other pending claims on approval
    public Claim updateClaimStatus(Long id, Claim.ClaimStatus status) {   // ✅ nested enum parameter
        Claim claim = getClaimById(id);

        if (status == Claim.ClaimStatus.APPROVED) {
            // Approve this claim
            claim.setStatus(Claim.ClaimStatus.APPROVED);

            // Reject all other pending claims for the same item
            List<Claim> otherClaims = claimRepository.findByItemIdAndStatus(
                    claim.getItem().getId(), Claim.ClaimStatus.PENDING);
            for (Claim other : otherClaims) {
                if (!other.getId().equals(id)) {
                    other.setStatus(Claim.ClaimStatus.REJECTED);
                    claimRepository.save(other);
                }
            }

            // Update item status to CLAIMED
            Item item = claim.getItem();
            item.setStatus(Item.ItemStatus.CLAIMED);
            itemRepository.save(item);
        } else {
            claim.setStatus(status);
        }

        return claimRepository.save(claim);
    }

    // Delete claim
    public void deleteClaim(Long id) {
        if (!claimRepository.existsById(id)) {
            throw new RuntimeException("Claim not found with id: " + id);
        }
        claimRepository.deleteById(id);
    }
}