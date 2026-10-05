package com.projectmanager.backend.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private String priority;
    private String status;
    private LocalDate deadline;
    private Long projectId;
    private String projectName;
    private Long assignedToId;
    private String assignedToName;
    private String createdByName;
    private LocalDateTime createdAt;
}
