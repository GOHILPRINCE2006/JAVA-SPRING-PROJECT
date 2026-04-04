package com.lostfound.lostfound.repository;

import com.lostfound.lostfound.entity.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByItemId(Long itemId);
    List<Claim> findByClaimedById(Long userId);
    List<Claim> findByStatus(Claim.ClaimStatus status);
    List<Claim> findByItemIdAndStatus(Long itemId, Claim.ClaimStatus status);
}