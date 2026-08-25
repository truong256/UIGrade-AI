package com.uigrade.ai.domain.model

import java.time.LocalDateTime

/**
 * Status of a student's submission for an assignment.
 */
enum class AssignmentStatus {
    NOT_SUBMITTED,
    SUBMITTED,
    GRADING,
    GRADED
}

/**
 * An assignment created by a lecturer, linked to a rubric.
 */
data class Assignment(
    val id: String,
    val title: String,
    val description: String,
    val deadline: LocalDateTime,
    val rubricId: String,
    val lecturerId: String,
    val courseId: String,
    val courseName: String,
    val createdAt: LocalDateTime,
    val totalMaxScore: Int = 100
)

/**
 * Assignment with the current student's submission status attached.
 */
data class AssignmentWithStatus(
    val assignment: Assignment,
    val status: AssignmentStatus,
    val score: Int? = null,
    val submissionId: String? = null
)
