package com.projectmanager.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class TaskRequest {

    @NotBlank(message = "Task title is required")
    private String title;

    private String description;

    @NotNull(message = "Priority is required")
    private String priority;

    private LocalDate deadline;

    @NotNull(message = "Project id is required")
    private Long projectId;

    private Long assignedToId;
}
