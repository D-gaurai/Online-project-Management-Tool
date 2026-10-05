package com.projectmanager.backend.controller;

import com.projectmanager.backend.dto.CommentRequest;
import com.projectmanager.backend.dto.CommentResponse;
import com.projectmanager.backend.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


    // Controller to handle HTTP requests for this entity. Maps the endpoints to frontend calls.
    @RestController
@RequestMapping("/api/tasks/{taskId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(@PathVariable Long taskId,
                                                        @Valid @RequestBody CommentRequest request) {
        return new ResponseEntity<>(commentService.addComment(taskId, request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long taskId) {
        return ResponseEntity.ok(commentService.getCommentsByTask(taskId));
    }
}
