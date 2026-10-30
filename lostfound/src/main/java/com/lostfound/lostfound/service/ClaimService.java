package com.lostfound.lostfound.service;

import com.lostfound.lostfound.dto.ClaimRequest;
import com.lostfound.lostfound.entity.Claim;
import com.lostfound.lostfound.entity.Item;
import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.repository.ClaimRepository;
import com.lostfound.lostfound.repository.ItemRepository;
import com.lostfound.lostfound.security.AccessRules;
import com.lostfound.lostfound.util.Validation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final ItemRepository itemRepository;

    // Submit a new claim. The claimant is always the authenticated user.
    @Transactional
    public Claim submitClaim(ClaimRequest request, Long itemId, User claimant) {
        String message = Validation.requireText(request.message(), "Message", 1000);

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));

        if (item.getStatus() == Item.ItemStatus.CLAIMED || item.getStatus() == Item.ItemStatus.RESOLVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This item has already been claimed and is no longer available");
        }
        if (AccessRules.isSelf(claimant, item.getReportedBy().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot claim an item you reported yourself");
        }
        boolean alreadyClaimed = claimRepository.findByItemId(itemId).stream().anyMatch(existing ->
                AccessRules.isSelf(claimant, existing.getClaimedBy().getId())
                        && (existing.getStatus() == Claim.ClaimStatus.PENDING
                        || existing.getStatus() == Claim.ClaimStatus.APPROVED));
        if (alreadyClaimed) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have an active claim on this item");
        }

        Claim claim = new Claim();
        claim.setMessage(message);
        claim.setItem(item);
        claim.setClaimedBy(claimant);
        claim.setStatus(Claim.ClaimStatus.PENDING);
        return claimRepository.save(claim);
    }

    // Get all claims (admin only, enforced in SecurityConfig)
    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    // Get claim by ID: claimant or admin
    public Claim getClaimForUser(Long id, User current) {
        Claim claim = getClaimById(id);
        AccessRules.requireSelfOrAdmin(current, claim.getClaimedBy().getId());
        return claim;
    }

    private Claim getClaimById(Long id) {
        return claimRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
    }

    // Get claims for a specific item
    public List<Claim> getClaimsByItem(Long itemId) {
        return claimRepository.findByItemId(itemId);
    }

    // Get claims by a specific user
    public List<Claim> getClaimsByUser(Long userId) {
        return claimRepository.findByClaimedById(userId);
    }

    /**
     * Admin decision on a claim. Allowed transitions:
     *   PENDING  -> APPROVED  (item becomes CLAIMED, other pending claims on it are rejected)
     *   PENDING  -> REJECTED
     *   APPROVED -> RESOLVED  (item handed over; item becomes RESOLVED)
     * Everything else is a 409.
     */
    @Transactional
    public Claim updateClaimStatus(Long id, Claim.ClaimStatus newStatus) {
        Claim claim = getClaimById(id);
        Claim.ClaimStatus current = claim.getStatus();
        Item item = claim.getItem();

        if (current == Claim.ClaimStatus.PENDING && newStatus == Claim.ClaimStatus.APPROVED) {
            if (item.getStatus() == Item.ItemStatus.CLAIMED || item.getStatus() == Item.ItemStatus.RESOLVED) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "This item has already been claimed");
            }
            claim.setStatus(Claim.ClaimStatus.APPROVED);

            List<Claim> otherPending = claimRepository.findByItemIdAndStatus(item.getId(), Claim.ClaimStatus.PENDING);
            for (Claim other : otherPending) {
                if (!other.getId().equals(claim.getId())) {
                    other.setStatus(Claim.ClaimStatus.REJECTED);
                    claimRepository.save(other);
                }
            }
            item.setStatus(Item.ItemStatus.CLAIMED);
            itemRepository.save(item);
        } else if (current == Claim.ClaimStatus.PENDING && newStatus == Claim.ClaimStatus.REJECTED) {
            claim.setStatus(Claim.ClaimStatus.REJECTED);
        } else if (current == Claim.ClaimStatus.APPROVED && newStatus == Claim.ClaimStatus.RESOLVED) {
            claim.setStatus(Claim.ClaimStatus.RESOLVED);
            item.setStatus(Item.ItemStatus.RESOLVED);
            itemRepository.save(item);
        } else {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A claim cannot be changed from " + current + " to " + newStatus);
        }
        return claimRepository.save(claim);
    }

    /** Claimants may withdraw their own PENDING claim; admins may delete any claim. */
    @Transactional
    public void deleteClaim(Long id, User current) {
        Claim claim = getClaimById(id);
        boolean admin = AccessRules.isAdmin(current);
        boolean owner = AccessRules.isSelf(current, claim.getClaimedBy().getId());
        if (!admin && !owner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only withdraw your own claims");
        }
        if (!admin && claim.getStatus() != Claim.ClaimStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending claims can be withdrawn");
        }
        claimRepository.delete(claim);
    }
}
