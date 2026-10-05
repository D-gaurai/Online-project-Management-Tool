package com.projectmanager.backend.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private Long userId;
    private String name;
    private String email;
    private String role;
}
