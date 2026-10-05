package com.projectmanager.backend.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String createdByName;
    private LocalDateTime createdAt;
    private int totalTasks;
    private int completedTasks;
}
