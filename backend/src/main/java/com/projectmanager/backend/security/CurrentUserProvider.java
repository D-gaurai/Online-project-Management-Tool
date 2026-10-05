package com.projectmanager.backend.security;

import com.projectmanager.backend.entity.User;
import com.projectmanager.backend.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

// Small helper used across services to find out WHO is currently logged in,
// based on the JWT that was validated by JwtAuthFilter.
@Component
public class CurrentUserProvider {

    private final UserRepository userRepository;

    public CurrentUserProvider(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Logged in user not found in database"));
    }
}
