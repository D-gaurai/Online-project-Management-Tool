package com.projectmanager.backend.service;

import com.projectmanager.backend.entity.Task;
import com.projectmanager.backend.entity.TaskStatus;
import com.projectmanager.backend.repository.NotificationRepository;
import com.projectmanager.backend.repository.TaskRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

// Runs automatically in the background (once an hour) and sends an in-app
// notification to the assignee when a task's deadline is today or tomorrow.
// The same reminder is never sent twice, because we check whether a
// notification with the same message already exists for that user.
@Service
public class DeadlineReminderService {

    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    public DeadlineReminderService(TaskRepository taskRepository,
                                    NotificationRepository notificationRepository,
                                    NotificationService notificationService) {
        this.taskRepository = taskRepository;
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedRate = 3600000, initialDelay = 30000)
    @Transactional
    public void sendDeadlineReminders() {
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        List<Task> dueSoon = taskRepository.findByDeadlineBetween(today, tomorrow);

        for (Task task : dueSoon) {
            if (task.getAssignedTo() == null || task.getStatus() == TaskStatus.COMPLETED) {
                continue;
            }

            String when = task.getDeadline().equals(today) ? "today" : "tomorrow";
            String message = "Deadline " + when + ": " + task.getTitle();
            Long userId = task.getAssignedTo().getId();

            if (!notificationRepository.existsByUserIdAndMessage(userId, message)) {
                notificationService.notifyUser(task.getAssignedTo(), message);
            }
        }
    }
}
