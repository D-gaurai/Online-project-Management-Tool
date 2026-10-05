package com.projectmanager.backend.exception;

// Thrown when something is looked up by id (project, task, user...) and doesn't exist.
// Results in a 404 response - handled by GlobalExceptionHandler.
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
