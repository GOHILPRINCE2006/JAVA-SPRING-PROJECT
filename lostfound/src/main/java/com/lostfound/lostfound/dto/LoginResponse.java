package com.lostfound.lostfound.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String message;
    private String email;
    private String name;
    private String role;
    private Long userId;
}