package com.projectmanager.backend.controller;

import com.projectmanager.backend.dto.*;
import com.projectmanager.backend.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


    // Controller to handle HTTP requests for this entity. Maps the endpoints to frontend calls.
    @RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody ProjectRequest request) {
        return new ResponseEntity<>(projectService.createProject(request), HttpStatus.CREATED);
    }

    @GetMapping("/my")
    public ResponseEntity<List<ProjectResponse>> getMyProjects() {
        return ResponseEntity.ok(projectService.getMyProjects());
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAllProjects(
            @RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(projectService.searchProjects(search));
        }
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable Long id,
                                                          @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id, @RequestParam String status) {
        projectService.updateProjectStatus(id, status);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<Void> addMember(@PathVariable Long id, @Valid @RequestBody AddMemberRequest request) {
        projectService.addMember(id, request.getUserId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        projectService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<UserResponse>> getMembers(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectMembers(id));
    }
}
