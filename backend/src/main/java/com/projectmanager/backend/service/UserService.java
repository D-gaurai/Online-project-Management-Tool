package com.projectmanager.backend.service;

import com.projectmanager.backend.dto.ChangePasswordRequest;
import com.projectmanager.backend.dto.UpdateProfileRequest;
import com.projectmanager.backend.dto.UserResponse;
import com.projectmanager.backend.entity.Role;
import com.projectmanager.backend.entity.User;
import com.projectmanager.backend.exception.BadRequestException;
import com.projectmanager.backend.exception.ResourceNotFoundException;
import com.projectmanager.backend.exception.UnauthorizedException;
import com.projectmanager.backend.repository.UserRepository;
import com.projectmanager.backend.security.CurrentUserProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;


    // Service layer: Here is where the actual business logic happens. We separate this from the controller to keep the code clean.
    @Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserProvider currentUserProvider;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                        CurrentUserProvider currentUserProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.currentUserProvider = currentUserProvider;
    }

    public UserResponse getMyProfile() {
        return toResponse(currentUserProvider.getCurrentUser());
    }

    // Managers need this list to pick people while adding project members,
    // and admins need it for the user management page. Members can't see it.
    public List<UserResponse> getAllUsers() {
        User currentUser = currentUserProvider.getCurrentUser();
        if (currentUser.getRole() == Role.MEMBER) {
            throw new UnauthorizedException("Only managers and admins can view the user list");
        }
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public UserResponse updateMyProfile(UpdateProfileRequest request) {
        User currentUser = currentUserProvider.getCurrentUser();
        currentUser.setName(request.getName().trim());
        userRepository.save(currentUser);
        return toResponse(currentUser);
    }

    public void changeMyPassword(ChangePasswordRequest request) {
        User currentUser = currentUserProvider.getCurrentUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        currentUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(currentUser);
    }

    // Admin-only: users are never deleted, only activated/deactivated.
    public UserResponse setUserActive(Long userId, boolean active) {
        User currentUser = currentUserProvider.getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Only admins can activate or deactivate accounts");
        }
        if (currentUser.getId().equals(userId)) {
            throw new BadRequestException("You cannot deactivate your own account");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setActive(active);
        userRepository.save(user);
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .active(user.isActive())
                .build();
    }
}
