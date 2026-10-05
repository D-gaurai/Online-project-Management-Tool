package com.projectmanager.backend.controller;

import com.projectmanager.backend.dto.ChangePasswordRequest;
import com.projectmanager.backend.dto.UpdateProfileRequest;
import com.projectmanager.backend.dto.UserResponse;
import com.projectmanager.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


    // Controller to handle HTTP requests for this entity. Maps the endpoints to frontend calls.
    @RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile() {
        return ResponseEntity.ok(userService.getMyProfile());
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateMyProfile(request));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changeMyPassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changeMyPassword(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<UserResponse> setUserActive(@PathVariable Long id, @RequestParam boolean active) {
        return ResponseEntity.ok(userService.setUserActive(id, active));
    }
}
