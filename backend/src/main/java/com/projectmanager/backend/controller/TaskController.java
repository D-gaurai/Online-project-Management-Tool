package com.projectmanager.backend.controller;

import com.projectmanager.backend.dto.*;
import com.projectmanager.backend.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


    // Controller to handle HTTP requests for this entity. Maps the endpoints to frontend calls.
    @RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request) {
        return new ResponseEntity<>(taskService.createTask(request), HttpStatus.CREATED);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<TaskResponse>> getTasksByProject(
            @PathVariable Long projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority) {

        if (status != null || priority != null) {
            return ResponseEntity.ok(taskService.filterTasks(projectId, status, priority));
        }
        return ResponseEntity.ok(taskService.getTasksByProject(projectId));
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<List<TaskResponse>> getMyTasks() {
        return ResponseEntity.ok(taskService.getMyTasks());
    }

    @GetMapping("/search")
    public ResponseEntity<List<TaskResponse>> searchTasks(@RequestParam String keyword) {
        return ResponseEntity.ok(taskService.searchTasks(keyword));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable Long id,
                                                    @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateStatus(@PathVariable Long id,
                                                       @Valid @RequestBody TaskStatusUpdateRequest request) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, request.getStatus()));
    }

    @PatchMapping("/{id}/priority")
    public ResponseEntity<TaskResponse> updatePriority(@PathVariable Long id,
                                                         @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.updateTaskPriority(id, request.getPriority()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}