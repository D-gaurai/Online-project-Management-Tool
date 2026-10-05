package com.projectmanager.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddMemberRequest {

    @NotNull(message = "User id is required")
    private Long userId;
}
