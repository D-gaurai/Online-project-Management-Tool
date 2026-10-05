package com.projectmanager.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class NotificationResponse {
    private Long id;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
}
