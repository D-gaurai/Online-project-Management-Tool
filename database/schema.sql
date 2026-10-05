-- ============================================================
-- GeForce - Online Project Management Tool
-- Database Schema Reference
-- ============================================================
-- NOTE: You do NOT need to run this file manually.
-- Spring Boot (via Hibernate, spring.jpa.hibernate.ddl-auto=update)
-- will automatically create all these tables the first time the
-- backend runs successfully and connects to an empty database.
--
-- This file exists purely as documentation / for viva reference,
-- so you can explain the schema without opening MySQL Workbench.
-- ============================================================

CREATE DATABASE IF NOT EXISTS project_management;
USE project_management;

-- 1. USERS
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,          -- ADMIN, MANAGER, MEMBER
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. PROJECTS
CREATE TABLE projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, COMPLETED, ON_HOLD
    start_date DATE,
    end_date DATE,
    created_by BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 3. PROJECT_MEMBERS (join table - many-to-many between users and projects)
CREATE TABLE project_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_project_member (project_id, user_id)
);

-- 4. TASKS
CREATE TABLE tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    priority VARCHAR(10) NOT NULL,       -- LOW, MEDIUM, HIGH
    status VARCHAR(20) NOT NULL DEFAULT 'TODO',  -- TODO, IN_PROGRESS, COMPLETED
    deadline DATE,
    project_id BIGINT NOT NULL,
    assigned_to BIGINT,
    created_by BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 5. COMMENTS
CREATE TABLE comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    task_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- 6. NOTIFICATIONS
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for frequently-queried columns
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
