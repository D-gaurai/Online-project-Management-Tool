package com.projectmanager.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;


    // Entity class mapped directly to our MySQL database table using Hibernate.
    @Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean read = false;

    @Column(name = "email_sent", nullable = false)
    @Builder.Default
    private boolean emailSent = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
