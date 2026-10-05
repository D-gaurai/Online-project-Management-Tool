package com.projectmanager.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

// A single line in the "Recent Activity" feed on the dashboard.
// e.g. "Deepanshu created project College Website Redesign"
@Getter
@Setter
@Builder
public class ActivityResponse {
    private String description;
    private LocalDateTime timestamp;
}