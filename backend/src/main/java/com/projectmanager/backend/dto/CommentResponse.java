package com.projectmanager.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class CommentResponse {
    private Long id;
    private String content;
    private String authorName;
    private LocalDateTime createdAt;
}
