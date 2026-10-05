package com.projectmanager.backend.entity;

// User role - kept as Enum instead of String so invalid values (like typos)
// are caught at compile time instead of causing bugs at runtime.
public enum Role {
    ADMIN, MANAGER, MEMBER
}
