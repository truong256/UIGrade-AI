package com.uigrade.ai.domain.model

import java.time.LocalDateTime

/**
 * Status of a student's submission for an assignment.
 */
enum class AssignmentStatus {
    UPCOMING,
    NOT_SUBMITTED,
    DRAFT,
    SUBMITTED,
    LATE,
    GRADING,
    GRADED,
    OVERDUE,
    CLOSED,
    RESUBMISSION_REQUIRED
}

/**
 * Publish lifecycle of an assignment created by a lecturer.
 */
enum class AssignmentPublishStatus {
    DRAFT,
    PUBLISHED,
    CLOSED
}

/**
 * An assignment created by a lecturer, linked to a rubric.
 * classroomId links this assignment to a specific classroom.
 * publishStatus controls student visibility.
 */
data class Assignment(
    val id: String,
    val title: String,
    val description: String,
    val deadline: LocalDateTime,
    val rubricId: String,
    val lecturerId: String,
    val courseId: String,               // kept for backward compat
    val courseName: String,             // kept for backward compat
    val createdAt: LocalDateTime,
    val totalMaxScore: Int = 100,
    // Classroom integration
    val classroomId: String = "",
    val publishStatus: AssignmentPublishStatus = AssignmentPublishStatus.PUBLISHED,
    val startAt: LocalDateTime? = null,
    val allowLateSubmission: Boolean = false,
    val allowResubmission: Boolean = false,
    val maxAttempts: Int = 1,
    val publishedAt: LocalDateTime? = null,
    val allowedFileTypes: List<String> = listOf("apk", "aab", "zip"),
    val instructions: String = "",
    val closeAt: LocalDateTime? = null,
    val assignmentType: String = "Bài tập",
    val attachmentUri: String? = null,
    val resourceUrl: String = "",
    val latePenaltyPercent: Int = 0,
    val isArchived: Boolean = false
)

/**
 * Assignment with the current student's submission status attached.
 */
data class AssignmentWithStatus(
    val assignment: Assignment,
    val status: AssignmentStatus,
    val score: Int? = null,
    val submissionId: String? = null,
    val latestSubmission: Submission? = null,
    val attemptsUsed: Int = 0,
    val attemptsRemaining: Int = assignment.maxAttempts,
    val disabledReason: String? = null
)
