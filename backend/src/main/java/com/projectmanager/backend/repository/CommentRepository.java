package com.projectmanager.backend.repository;

import com.projectmanager.backend.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByTaskIdOrderByCreatedAtAsc(Long taskId);

    void deleteByTaskId(Long taskId);
}