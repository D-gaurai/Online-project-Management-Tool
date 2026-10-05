package com.projectmanager.backend.service;

import com.projectmanager.backend.dto.*;
import com.projectmanager.backend.entity.*;
import com.projectmanager.backend.exception.BadRequestException;
import com.projectmanager.backend.exception.ResourceNotFoundException;
import com.projectmanager.backend.exception.UnauthorizedException;
import com.projectmanager.backend.repository.*;
import com.projectmanager.backend.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;


    // Service layer: Here is where the actual business logic happens. We separate this from the controller to keep the code clean.
    @Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;
    private final NotificationService notificationService;

    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository,
                        UserRepository userRepository, CurrentUserProvider currentUserProvider,
                        NotificationService notificationService) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.currentUserProvider = currentUserProvider;
        this.notificationService = notificationService;
    }

    public TaskResponse createTask(TaskRequest request) {
        User currentUser = currentUserProvider.getCurrentUser();
        if (currentUser.getRole() == Role.MEMBER) {
            throw new UnauthorizedException("Members are not allowed to create tasks");
        }

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Project not found with id: " + request.getProjectId()));

        TaskPriority priority;
        try {
            priority = TaskPriority.valueOf(request.getPriority().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Priority must be LOW, MEDIUM or HIGH");
        }

        User assignedUser = null;
        if (request.getAssignedToId() != null) {
            assignedUser = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found with id: " + request.getAssignedToId()));
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(priority)
                .status(TaskStatus.TODO)
                .deadline(request.getDeadline())
                .project(project)
                .assignedTo(assignedUser)
                .createdBy(currentUser)
                .build();

        taskRepository.save(task);

        if (assignedUser != null) {
            notificationService.notifyUser(assignedUser, "New task assigned: " + task.getTitle());
        }

        return toResponse(task);
    }

    public List<TaskResponse> getTasksByProject(Long projectId) {
        return taskRepository.findByProjectId(projectId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getMyTasks() {
        User currentUser = currentUserProvider.getCurrentUser();
        return taskRepository.findByAssignedToId(currentUser.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> searchTasks(String keyword) {
        return taskRepository.findByTitleContainingIgnoreCase(keyword).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Status and priority filters, applied within one project's task list.
    public List<TaskResponse> filterTasks(Long projectId, String status, String priority) {
        List<Task> tasks = taskRepository.findByProjectId(projectId);

        if (status != null && !status.isBlank()) {
            TaskStatus taskStatus;
            try {
                taskStatus = TaskStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Status must be TODO, IN_PROGRESS or COMPLETED");
            }
            tasks = tasks.stream().filter(t -> t.getStatus() == taskStatus).collect(Collectors.toList());
        }

        if (priority != null && !priority.isBlank()) {
            TaskPriority taskPriority;
            try {
                taskPriority = TaskPriority.valueOf(priority.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Priority must be LOW, MEDIUM or HIGH");
            }
            tasks = tasks.stream().filter(t -> t.getPriority() == taskPriority).collect(Collectors.toList());
        }

        return tasks.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public TaskResponse getTaskById(Long id) {
        return toResponse(findTaskOrThrow(id));
    }

    public TaskResponse updateTask(Long id, TaskRequest request) {
        Task task = findTaskOrThrow(id);
        checkManagerOrAdmin();

        TaskPriority priority;
        try {
            priority = TaskPriority.valueOf(request.getPriority().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Priority must be LOW, MEDIUM or HIGH");
        }

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPriority(priority);
        task.setDeadline(request.getDeadline());

        if (request.getAssignedToId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found with id: " + request.getAssignedToId()));
            task.setAssignedTo(assignedUser);
        }

        taskRepository.save(task);
        return toResponse(task);
    }

    // Status can be updated by the assignee themselves, OR by a manager/admin.
    public TaskResponse updateTaskStatus(Long id, String status) {
        Task task = findTaskOrThrow(id);
        User currentUser = currentUserProvider.getCurrentUser();

        boolean isAssignee = task.getAssignedTo() != null
                && task.getAssignedTo().getId().equals(currentUser.getId());
        boolean isManagerOrAdmin = currentUser.getRole() != Role.MEMBER;

        if (!isAssignee && !isManagerOrAdmin) {
            throw new UnauthorizedException("You can only update the status of tasks assigned to you");
        }

        try {
            task.setStatus(TaskStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Status must be TODO, IN_PROGRESS or COMPLETED");
        }

        taskRepository.save(task);
        return toResponse(task);
    }

    // Lets a manager/admin change a task's priority after it has already been created.
    public TaskResponse updateTaskPriority(Long id, String priority) {
        Task task = findTaskOrThrow(id);
        checkManagerOrAdmin();

        try {
            task.setPriority(TaskPriority.valueOf(priority.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Priority must be LOW, MEDIUM or HIGH");
        }

        taskRepository.save(task);
        return toResponse(task);
    }

    public void deleteTask(Long id) {
        Task task = findTaskOrThrow(id);
        checkManagerOrAdmin();
        taskRepository.delete(task);
    }

    private void checkManagerOrAdmin() {
        User currentUser = currentUserProvider.getCurrentUser();
        if (currentUser.getRole() == Role.MEMBER) {
            throw new UnauthorizedException("Only managers and admins can perform this action");
        }
    }

    private Task findTaskOrThrow(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
    }

    private TaskResponse toResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .priority(task.getPriority().name())
                .status(task.getStatus().name())
                .deadline(task.getDeadline())
                .projectId(task.getProject().getId())
                .projectName(task.getProject().getName())
                .assignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null)
                .assignedToName(task.getAssignedTo() != null ? task.getAssignedTo().getName() : "Unassigned")
                .createdByName(task.getCreatedBy().getName())
                .createdAt(task.getCreatedAt())
                .build();
    }
}