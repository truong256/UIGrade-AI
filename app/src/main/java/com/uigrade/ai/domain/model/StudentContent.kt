/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.domain.model

import java.time.LocalDateTime

data class ClassAnnouncement(
    val id: String,
    val classroomId: String,
    val authorId: String,
    val authorName: String,
    val title: String,
    val content: String,
    val createdAt: LocalDateTime,
    val attachmentUri: String? = null
)

data class LearningMaterial(
    val id: String,
    val classroomId: String,
    val title: String,
    val description: String,
    val type: String,
    val uri: String,
    val createdAt: LocalDateTime
)

enum class StudentNotificationType {
    JOIN_APPROVED,
    JOIN_REJECTED,
    NEW_ASSIGNMENT,
    ASSIGNMENT_UPDATED,
    DEADLINE_APPROACHING,
    ASSIGNMENT_EXPIRED,
    RESUBMISSION_REQUESTED,
    SUBMISSION_RECEIVED,
    GRADE_RELEASED,
    NEW_FEEDBACK,
    CLASS_ANNOUNCEMENT
}

data class StudentNotification(
    val id: String,
    val studentId: String,
    val title: String,
    val message: String,
    val type: StudentNotificationType,
    val createdAt: LocalDateTime,
    val isRead: Boolean = false,
    val classroomId: String? = null,
    val assignmentId: String? = null,
    val submissionId: String? = null,
    val joinRequestId: String? = null
)

data class StudentProgress(
    val assignedCount: Int,
    val submittedCount: Int,
    val missingCount: Int,
    val lateCount: Int,
    val gradedCount: Int,
    val averagePercent: Float?,
    val byClassroom: List<StudentClassProgress>
)

data class StudentClassProgress(
    val classroom: Classroom,
    val assignedCount: Int,
    val submittedCount: Int,
    val gradedCount: Int,
    val averagePercent: Float?
)
