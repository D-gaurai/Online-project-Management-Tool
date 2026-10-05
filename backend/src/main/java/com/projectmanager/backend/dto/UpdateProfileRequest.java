package com.projectmanager.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name can be at most 100 characters")
    private String name;
}
