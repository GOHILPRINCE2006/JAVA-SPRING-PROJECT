package com.lostfound.lostfound.service;

import com.lostfound.lostfound.dto.ClaimRequest;
import com.lostfound.lostfound.entity.Claim;
import com.lostfound.lostfound.entity.Item;
import com.lostfound.lostfound.entity.User;
import com.lostfound.lostfound.entity.UserRole;
import com.lostfound.lostfound.repository.ClaimRepository;
import com.lostfound.lostfound.repository.ItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Pure unit tests (Mockito only): no Spring context and no database needed. */
class ClaimServiceTest {

    private ClaimRepository claimRepository;
    private ItemRepository itemRepository;
    private ClaimService service;

    private User reporter;
    private User claimant;
    private User admin;
    private Item item;

    private static User user(long id, UserRole role) {
        User u = new User();
        u.setId(id);
        u.setName("User " + id);
        u.setEmail("user" + id + "@example.com");
        u.setPassword("hash");
        u.setRole(role);
        return u;
    }

    private static int statusOf(ResponseStatusException e) {
        return e.getStatusCode().value();
    }

    @BeforeEach
    void setUp() {
        claimRepository = Mockito.mock(ClaimRepository.class);
        itemRepository = Mockito.mock(ItemRepository.class);
        service = new ClaimService(claimRepository, itemRepository);

        reporter = user(1, UserRole.USER);
        claimant = user(2, UserRole.USER);
        admin = user(3, UserRole.ADMIN);

        item = new Item();
        item.setId(10L);
        item.setTitle("Blue wallet");
        item.setStatus(Item.ItemStatus.FOUND);
        item.setReportedBy(reporter);

        when(itemRepository.findById(10L)).thenReturn(Optional.of(item));
        when(claimRepository.findByItemId(10L)).thenReturn(List.of());
        when(claimRepository.save(any(Claim.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private Claim claim(long id, User by, Claim.ClaimStatus status) {
        Claim c = new Claim();
        c.setId(id);
        c.setItem(item);
        c.setClaimedBy(by);
        c.setStatus(status);
        c.setMessage("mine");
        when(claimRepository.findById(id)).thenReturn(Optional.of(c));
        return c;
    }

    @Test
    void submitClaim_createsPendingClaimForAuthenticatedUser() {
        Claim saved = service.submitClaim(new ClaimRequest("  It has my initials inside  "), 10L, claimant);

        assertEquals(Claim.ClaimStatus.PENDING, saved.getStatus());
        assertEquals(2L, saved.getClaimedBy().getId());
        assertEquals("It has my initials inside", saved.getMessage());
        // Submitting a claim must NOT change the item status.
        assertEquals(Item.ItemStatus.FOUND, item.getStatus());
    }

    @Test
    void submitClaim_rejectsBlankMessage() {
        ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> service.submitClaim(new ClaimRequest("   "), 10L, claimant));
        assertEquals(400, statusOf(e));
    }

    @Test
    void submitClaim_rejectsOwnItem() {
        ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> service.submitClaim(new ClaimRequest("mine"), 10L, reporter));
        assertEquals(403, statusOf(e));
    }

    @Test
    void submitClaim_rejectsClaimedOrResolvedItem() {
        item.setStatus(Item.ItemStatus.CLAIMED);
        ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> service.submitClaim(new ClaimRequest("mine"), 10L, claimant));
        assertEquals(409, statusOf(e));
    }

    @Test
    void submitClaim_rejectsDuplicateActiveClaim() {
        Claim existing = new Claim();
        existing.setClaimedBy(claimant);
        existing.setStatus(Claim.ClaimStatus.PENDING);
        when(claimRepository.findByItemId(10L)).thenReturn(List.of(existing));

        ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> service.submitClaim(new ClaimRequest("again"), 10L, claimant));
        assertEquals(409, statusOf(e));
        verify(claimRepository, never()).save(any(Claim.class));
    }

    @Test
    void submitClaim_allowsNewClaimAfterRejection() {
        Claim rejected = new Claim();
        rejected.setClaimedBy(claimant);
        rejected.setStatus(Claim.ClaimStatus.REJECTED);
        when(claimRepository.findByItemId(10L)).thenReturn(List.of(rejected));

        Claim saved = service.submitClaim(new ClaimRequest("second try"), 10L, claimant);
        assertEquals(Claim.ClaimStatus.PENDING, saved.getStatus());
    }

    @Test
    void approve_setsItemClaimedAndRejectsOtherPendingClaims() {
        Claim target = claim(100L, claimant, Claim.ClaimStatus.PENDING);
        Claim other = claim(101L, user(4, UserRole.USER), Claim.ClaimStatus.PENDING);
        when(claimRepository.findByItemIdAndStatus(10L, Claim.ClaimStatus.PENDING))
                .thenReturn(List.of(target, other));

        Claim result = service.updateClaimStatus(100L, Claim.ClaimStatus.APPROVED);

        assertEquals(Claim.ClaimStatus.APPROVED, result.getStatus());
        assertEquals(Claim.ClaimStatus.REJECTED, other.getStatus());
        assertEquals(Item.ItemStatus.CLAIMED, item.getStatus());
    }

    @Test
    void approve_failsWhenItemAlreadyClaimed() {
        claim(100L, claimant, Claim.ClaimStatus.PENDING);
        item.setStatus(Item.ItemStatus.CLAIMED);
        ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> service.updateClaimStatus(100L, Claim.ClaimStatus.APPROVED));
        assertEquals(409, statusOf(e));
    }

    @Test
    void reject_pendingClaimLeavesItemUntouched() {
        claim(100L, claimant, Claim.ClaimStatus.PENDING);
        Claim result = service.updateClaimStatus(100L, Claim.ClaimStatus.REJECTED);
        assertEquals(Claim.ClaimStatus.REJECTED, result.getStatus());
        assertEquals(Item.ItemStatus.FOUND, item.getStatus());
    }

    @Test
    void invalidTransitionsAreConflicts() {
        claim(100L, claimant, Claim.ClaimStatus.REJECTED);
        claim(101L, claimant, Claim.ClaimStatus.APPROVED);
        claim(102L, claimant, Claim.ClaimStatus.PENDING);

        assertEquals(409, statusOf(assertThrows(ResponseStatusException.class,
                () -> service.updateClaimStatus(100L, Claim.ClaimStatus.APPROVED))));
        assertEquals(409, statusOf(assertThrows(ResponseStatusException.class,
                () -> service.updateClaimStatus(101L, Claim.ClaimStatus.REJECTED))));
        assertEquals(409, statusOf(assertThrows(ResponseStatusException.class,
                () -> service.updateClaimStatus(102L, Claim.ClaimStatus.RESOLVED))));
    }

    @Test
    void resolve_approvedClaimMarksItemResolved() {
        claim(100L, claimant, Claim.ClaimStatus.APPROVED);
        item.setStatus(Item.ItemStatus.CLAIMED);

        Claim result = service.updateClaimStatus(100L, Claim.ClaimStatus.RESOLVED);

        assertEquals(Claim.ClaimStatus.RESOLVED, result.getStatus());
        assertEquals(Item.ItemStatus.RESOLVED, item.getStatus());
    }

    @Test
    void deleteClaim_enforcesOwnershipAndPendingState() {
        Claim pending = claim(100L, claimant, Claim.ClaimStatus.PENDING);
        Claim approved = claim(101L, claimant, Claim.ClaimStatus.APPROVED);

        // someone else
        assertEquals(403, statusOf(assertThrows(ResponseStatusException.class,
                () -> service.deleteClaim(100L, reporter))));
        // owner, but not pending
        assertEquals(409, statusOf(assertThrows(ResponseStatusException.class,
                () -> service.deleteClaim(101L, claimant))));
        // owner withdrawing a pending claim
        service.deleteClaim(100L, claimant);
        verify(claimRepository).delete(pending);
        // admin may delete any claim
        service.deleteClaim(101L, admin);
        verify(claimRepository).delete(approved);
    }

    @Test
    void getClaimForUser_blocksOtherUsers() {
        claim(100L, claimant, Claim.ClaimStatus.PENDING);
        assertEquals(403, statusOf(assertThrows(ResponseStatusException.class,
                () -> service.getClaimForUser(100L, reporter))));
        assertEquals(100L, service.getClaimForUser(100L, claimant).getId());
        assertEquals(100L, service.getClaimForUser(100L, admin).getId());
    }
}
