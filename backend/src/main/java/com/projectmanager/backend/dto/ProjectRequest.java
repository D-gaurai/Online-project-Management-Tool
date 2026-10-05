package com.projectmanager.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class ProjectRequest {

    @NotBlank(message = "Project name is required")
    private String name;

    private String description;

    private LocalDate startDate;

    private LocalDate endDate;
}
