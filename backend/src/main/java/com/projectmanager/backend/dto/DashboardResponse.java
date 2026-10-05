package com.projectmanager.backend.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
public class DashboardResponse {
    private long totalProjects;
    private long activeProjects;
    private long completedProjects;
    private long totalTasks;
    private long pendingTasks;
    private long completedTasks;
    private long todoTasks;
    private long inProgressTasks;
    private List<TaskResponse> upcomingDeadlines;
    private List<ActivityResponse> recentActivity;
}
