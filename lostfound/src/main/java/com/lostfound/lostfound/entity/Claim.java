package com.lostfound.lostfound.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "claims")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClaimStatus status;

    @Column(nullable = false)
    private LocalDateTime claimedAt;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne
    @JoinColumn(name = "claimed_by", nullable = false)
    private User claimedBy;

    @PrePersist
    public void prePersist() {
        this.claimedAt = LocalDateTime.now();
        this.status = ClaimStatus.PENDING;
    }

    public enum ClaimStatus {
        PENDING, APPROVED, REJECTED, RESOLVED
    }
    public String getOwnerLabel() {
        if (this.status == ClaimStatus.APPROVED) {
            return "claimedBy: " + this.claimedBy.getName();
        } else {
            return "requestedBy: " + this.claimedBy.getName();
        }
    }
}