package com.projectmanager.backend.exception;

// Thrown when the request data itself is invalid (e.g. duplicate email, bad enum value).
// Results in a 400 response - handled by GlobalExceptionHandler.
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
