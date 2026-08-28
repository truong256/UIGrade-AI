package com.uigrade.ai.domain.model

/**
 * Roles available in UIGrade AI.
 */
enum class UserRole {
    STUDENT,
    LECTURER,
    ADMIN
}

/**
 * Represents an authenticated user of UIGrade AI.
 */
data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: UserRole,
    val studentId: String? = null,  // Only for STUDENT role
    val avatarUrl: String? = null,
    val phone: String = "",
    val department: String = "",
    val organization: String = "",
    val bio: String = ""
)
