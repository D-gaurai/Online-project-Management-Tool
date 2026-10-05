package com.projectmanager.backend.repository;

import com.projectmanager.backend.entity.Task;
import com.projectmanager.backend.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProjectId(Long projectId);

    List<Task> findByAssignedToId(Long userId);

    List<Task> findByTitleContainingIgnoreCase(String title);

    List<Task> findByDeadlineBetween(LocalDate start, LocalDate end);

    long countByStatus(TaskStatus status);
}
