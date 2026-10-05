package com.projectmanager.backend.repository;

import com.projectmanager.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByNameContainingIgnoreCase(String name);

    List<Project> findByCreatedById(Long userId);
}
