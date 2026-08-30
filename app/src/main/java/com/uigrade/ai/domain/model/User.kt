/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.domain.model

import java.time.LocalDateTime

/**
 * Roles available in UIGrade AI.
 */
enum class UserRole {
    STUDENT,
    LECTURER,
    ADMIN
}

enum class UserAccountStatus {
    ACTIVE,
    LOCKED,
    DISABLED,
    PENDING
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
    val bio: String = "",
    val staffId: String? = null,
    val accountStatus: UserAccountStatus = UserAccountStatus.ACTIVE,
    val createdAt: LocalDateTime = LocalDateTime.of(2026, 1, 1, 8, 0),
    val lastLoginAt: LocalDateTime? = null,
    val isSuperAdmin: Boolean = false
)
