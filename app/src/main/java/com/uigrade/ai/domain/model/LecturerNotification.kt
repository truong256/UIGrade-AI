/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.domain.model

import java.time.LocalDateTime

enum class LecturerNotificationType {
    STUDENT_JOINED,
    JOIN_REQUEST,
    SUBMISSION_RECEIVED,
    LATE_SUBMISSION,
    DEADLINE_APPROACHING,
    AI_ERROR,
    CLASSROOM_ACTIVITY
}

data class LecturerNotification(
    val id: String,
    val lecturerId: String,
    val title: String,
    val message: String,
    val type: LecturerNotificationType,
    val createdAt: LocalDateTime,
    val isRead: Boolean = false,
    val classroomId: String? = null,
    val assignmentId: String? = null,
    val submissionId: String? = null
)
