package com.projectmanager.backend.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
public class ApiError {
    private int status;
    private String message;
    private LocalDateTime timestamp;
    private List<String> details;
}
