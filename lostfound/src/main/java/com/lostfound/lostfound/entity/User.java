package com.lostfound.lostfound.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @ToString.Exclude
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.USER;

    @JsonIgnore
    @OneToMany(mappedBy = "reportedBy", cascade = CascadeType.ALL)
    private List<Item> reportedItems;

    @JsonIgnore
    @OneToMany(mappedBy = "claimedBy", cascade = CascadeType.ALL)
    private List<Claim> claims;

}

