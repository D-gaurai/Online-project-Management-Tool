package com.projectmanager.backend.service;

import com.projectmanager.backend.dto.NotificationResponse;
import com.projectmanager.backend.entity.Notification;
import com.projectmanager.backend.entity.User;
import com.projectmanager.backend.exception.ResourceNotFoundException;
import com.projectmanager.backend.repository.NotificationRepository;
import com.projectmanager.backend.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;


    // Service layer: Here is where the actual business logic happens. We separate this from the controller to keep the code clean.
    @Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final CurrentUserProvider currentUserProvider;

    public NotificationService(NotificationRepository notificationRepository,
                                CurrentUserProvider currentUserProvider) {
        this.notificationRepository = notificationRepository;
        this.currentUserProvider = currentUserProvider;
    }

    // Called internally by other services (Project/Task) when something
    // notification-worthy happens - not exposed directly as an API.
    public void notifyUser(User user, String message) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .read(false)
                .emailSent(false)
                .build();
        notificationRepository.save(notification);
        // Actual email sending is added in Phase 15 - for now we only store it in-app.
    }

    public List<NotificationResponse> getMyNotifications() {
        User currentUser = currentUserProvider.getCurrentUser();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public long getUnreadCount() {
        User currentUser = currentUserProvider.getCurrentUser();
        return notificationRepository.countByUserIdAndReadFalse(currentUser.getId());
    }

    public void markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead() {
        User currentUser = currentUserProvider.getCurrentUser();
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalse(currentUser.getId());
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
