package com.projectmanager.backend.service;

import com.projectmanager.backend.dto.CommentRequest;
import com.projectmanager.backend.dto.CommentResponse;
import com.projectmanager.backend.entity.Comment;
import com.projectmanager.backend.entity.Task;
import com.projectmanager.backend.entity.User;
import com.projectmanager.backend.exception.ResourceNotFoundException;
import com.projectmanager.backend.repository.CommentRepository;
import com.projectmanager.backend.repository.TaskRepository;
import com.projectmanager.backend.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;


    // Service layer: Here is where the actual business logic happens. We separate this from the controller to keep the code clean.
    @Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final CurrentUserProvider currentUserProvider;

    public CommentService(CommentRepository commentRepository, TaskRepository taskRepository,
                           CurrentUserProvider currentUserProvider) {
        this.commentRepository = commentRepository;
        this.taskRepository = taskRepository;
        this.currentUserProvider = currentUserProvider;
    }

    public CommentResponse addComment(Long taskId, CommentRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        User currentUser = currentUserProvider.getCurrentUser();

        Comment comment = Comment.builder()
                .content(request.getContent())
                .task(task)
                .author(currentUser)
                .build();

        commentRepository.save(comment);
        return toResponse(comment);
    }

    public List<CommentResponse> getCommentsByTask(Long taskId) {
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private CommentResponse toResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .authorName(comment.getAuthor().getName())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
