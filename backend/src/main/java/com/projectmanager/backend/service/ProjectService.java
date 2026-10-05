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
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;
    private final NotificationService notificationService;

    public ProjectService(ProjectRepository projectRepository, ProjectMemberRepository projectMemberRepository,
                           TaskRepository taskRepository, CommentRepository commentRepository,
                           UserRepository userRepository, CurrentUserProvider currentUserProvider,
                           NotificationService notificationService) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.taskRepository = taskRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.currentUserProvider = currentUserProvider;
        this.notificationService = notificationService;
    }

    public ProjectResponse createProject(ProjectRequest request) {
        User currentUser = currentUserProvider.getCurrentUser();

        if (currentUser.getRole() == Role.MEMBER) {
            throw new UnauthorizedException("Members are not allowed to create projects");
        }

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .status(ProjectStatus.ACTIVE)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .createdBy(currentUser)
                .build();

        projectRepository.save(project);

        // The creator is automatically added as a project member.
        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(currentUser)
                .build();
        projectMemberRepository.save(member);

        return toResponse(project);
    }

    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Projects the current user created, or was added to as a member.
    public List<ProjectResponse> getMyProjects() {
        User currentUser = currentUserProvider.getCurrentUser();

        List<Project> memberOf = projectMemberRepository.findByUserId(currentUser.getId())
                .stream().map(ProjectMember::getProject).collect(Collectors.toList());

        List<Project> created = projectRepository.findByCreatedById(currentUser.getId());

        java.util.Map<Long, Project> merged = new java.util.LinkedHashMap<>();
        for (Project p : created) merged.put(p.getId(), p);
        for (Project p : memberOf) merged.put(p.getId(), p);

        return merged.values().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProjectResponse> searchProjects(String keyword) {
        return projectRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(Long id) {
        return toResponse(findProjectOrThrow(id));
    }

    public ProjectResponse updateProject(Long id, ProjectRequest request) {
        Project project = findProjectOrThrow(id);
        checkManagerOrAdmin();

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());

        projectRepository.save(project);
        return toResponse(project);
    }

    public void updateProjectStatus(Long id, String status) {
        Project project = findProjectOrThrow(id);
        checkManagerOrAdmin();

        try {
            project.setStatus(ProjectStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Status must be ACTIVE, COMPLETED or ON_HOLD");
        }
        projectRepository.save(project);
    }

    public void deleteProject(Long id) {
        Project project = findProjectOrThrow(id);
        checkManagerOrAdmin();

        // A project can't be deleted while tasks/members still reference it
        // (foreign key constraint), so we clean up child records first:
        // 1. delete comments on every task of this project
        // 2. delete the tasks themselves
        // 3. delete the project's membership records
        // 4. finally delete the project
        List<Task> tasks = taskRepository.findByProjectId(id);
        for (Task task : tasks) {
            commentRepository.deleteByTaskId(task.getId());
        }
        taskRepository.deleteAll(tasks);

        projectMemberRepository.deleteByProjectId(id);

        projectRepository.delete(project);
    }

    public void addMember(Long projectId, Long userId) {
        Project project = findProjectOrThrow(projectId);
        checkManagerOrAdmin();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new BadRequestException("This user is already a member of the project");
        }

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(user)
                .build();
        projectMemberRepository.save(member);

        notificationService.notifyUser(user, "You were added to project: " + project.getName());
    }

    public void removeMember(Long projectId, Long userId) {
        findProjectOrThrow(projectId);
        checkManagerOrAdmin();
        projectMemberRepository.deleteByProjectIdAndUserId(projectId, userId);
    }

    public List<UserResponse> getProjectMembers(Long projectId) {
        findProjectOrThrow(projectId);
        return projectMemberRepository.findByProjectId(projectId).stream()
                .map(pm -> UserResponse.builder()
                        .id(pm.getUser().getId())
                        .name(pm.getUser().getName())
                        .email(pm.getUser().getEmail())
                        .role(pm.getUser().getRole().name())
                        .active(pm.getUser().isActive())
                        .build())
                .collect(Collectors.toList());
    }

    private void checkManagerOrAdmin() {
        User currentUser = currentUserProvider.getCurrentUser();
        if (currentUser.getRole() == Role.MEMBER) {
            throw new UnauthorizedException("Only managers and admins can perform this action");
        }
    }

    private Project findProjectOrThrow(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    private ProjectResponse toResponse(Project project) {
        List<Task> tasks = taskRepository.findByProjectId(project.getId());
        long completed = tasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus().name())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .createdByName(project.getCreatedBy().getName())
                .createdAt(project.getCreatedAt())
                .totalTasks(tasks.size())
                .completedTasks((int) completed)
                .build();
    }
}
