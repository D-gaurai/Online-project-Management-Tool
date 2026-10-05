package com.projectmanager.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskStatusUpdateRequest {

    @NotBlank(message = "Status is required")
    private String status;
}