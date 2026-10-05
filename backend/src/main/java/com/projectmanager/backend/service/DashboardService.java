package com.projectmanager.backend.service;

import com.projectmanager.backend.dto.ActivityResponse;
import com.projectmanager.backend.dto.DashboardResponse;
import com.projectmanager.backend.dto.TaskResponse;
import com.projectmanager.backend.entity.*;
import com.projectmanager.backend.repository.CommentRepository;
import com.projectmanager.backend.repository.ProjectRepository;
import com.projectmanager.backend.repository.TaskRepository;
import com.projectmanager.backend.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;


    // Service layer: Here is where the actual business logic happens. We separate this from the controller to keep the code clean.
    @Service
public class DashboardService {

    private static final int MAX_ACTIVITY_ITEMS = 8;

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final CurrentUserProvider currentUserProvider;

    public DashboardService(ProjectRepository projectRepository, TaskRepository taskRepository,
                             CommentRepository commentRepository, CurrentUserProvider currentUserProvider) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.commentRepository = commentRepository;
        this.currentUserProvider = currentUserProvider;
    }

    public DashboardResponse getDashboard() {
        User currentUser = currentUserProvider.getCurrentUser();

        List<Project> allProjects = projectRepository.findAll();
        long activeProjects = allProjects.stream().filter(p -> p.getStatus() == ProjectStatus.ACTIVE).count();
        long completedProjects = allProjects.stream().filter(p -> p.getStatus() == ProjectStatus.COMPLETED).count();

        List<Task> myTasks = taskRepository.findByAssignedToId(currentUser.getId());
        long pendingTasks = myTasks.stream().filter(t -> t.getStatus() != TaskStatus.COMPLETED).count();
        long completedTasks = myTasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
        long todoTasks = myTasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
        long inProgressTasks = myTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();

        LocalDate today = LocalDate.now();
        LocalDate nextWeek = today.plusDays(7);

        List<TaskResponse> upcoming = myTasks.stream()
                .filter(t -> t.getDeadline() != null
                        && !t.getDeadline().isBefore(today)
                        && !t.getDeadline().isAfter(nextWeek)
                        && t.getStatus() != TaskStatus.COMPLETED)
                .map(t -> TaskResponse.builder()
                        .id(t.getId())
                        .title(t.getTitle())
                        .priority(t.getPriority().name())
                        .status(t.getStatus().name())
                        .deadline(t.getDeadline())
                        .projectName(t.getProject().getName())
                        .build())
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .totalProjects(allProjects.size())
                .activeProjects(activeProjects)
                .completedProjects(completedProjects)
                .totalTasks(myTasks.size())
                .pendingTasks(pendingTasks)
                .completedTasks(completedTasks)
                .todoTasks(todoTasks)
                .inProgressTasks(inProgressTasks)
                .upcomingDeadlines(upcoming)
                .recentActivity(buildRecentActivity(allProjects))
                .build();
    }

    // Combines recent projects, tasks and comments into one timeline,
    // sorted newest first. We don't keep a separate "activity log" table -
    // this is built on the fly from timestamps already stored on each entity,
    // which keeps the schema simple.
    private List<ActivityResponse> buildRecentActivity(List<Project> allProjects) {
        List<ActivityResponse> activity = new ArrayList<>();

        for (Project p : allProjects) {
            activity.add(ActivityResponse.builder()
                    .description(p.getCreatedBy().getName() + " created project \"" + p.getName() + "\"")
                    .timestamp(p.getCreatedAt())
                    .build());
        }

        List<Task> allTasks = taskRepository.findAll();
        for (Task t : allTasks) {
            activity.add(ActivityResponse.builder()
                    .description(t.getCreatedBy().getName() + " created task \"" + t.getTitle()
                            + "\" in " + t.getProject().getName())
                    .timestamp(t.getCreatedAt())
                    .build());

            if (t.getStatus() == TaskStatus.COMPLETED) {
                activity.add(ActivityResponse.builder()
                        .description("Task \"" + t.getTitle() + "\" was marked completed")
                        .timestamp(t.getUpdatedAt())
                        .build());
            }
        }

        List<Comment> allComments = commentRepository.findAll();
        for (Comment c : allComments) {
            activity.add(ActivityResponse.builder()
                    .description(c.getAuthor().getName() + " commented on \"" + c.getTask().getTitle() + "\"")
                    .timestamp(c.getCreatedAt())
                    .build());
        }

        return activity.stream()
                .filter(a -> a.getTimestamp() != null)
                .sorted(Comparator.comparing(ActivityResponse::getTimestamp).reversed())
                .limit(MAX_ACTIVITY_ITEMS)
                .collect(Collectors.toList());
    }
}
