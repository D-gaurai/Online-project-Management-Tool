package com.projectmanager.backend.dto;

import lombok.*;

@Getter
@Setter
@Builder
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private boolean active;
}
