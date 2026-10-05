package com.projectmanager.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskPriorityUpdateRequest {

    @NotBlank(message = "Priority is required")
    private String priority;
}