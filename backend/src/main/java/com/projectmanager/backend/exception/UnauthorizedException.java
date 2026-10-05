package com.projectmanager.backend.exception;

// Thrown when a logged-in user tries to do something their role doesn't allow
// (e.g. a MEMBER trying to create a project). Results in a 403 response.
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
