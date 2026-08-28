package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.AssignmentPublishStatus
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.model.SubmissionStatus
import java.time.LocalDateTime

/** Single source of truth for the status shown on every student screen. */
object StudentAssignmentPolicy {
    fun resolve(
        assignment: Assignment,
        submissions: List<Submission>,
        releasedGrade: GradingResult?,
        now: LocalDateTime
    ): AssignmentStatus {
        val history = submissions.filter { it.assignmentId == assignment.id }
        val latestSubmitted = history
            .filterNot { it.isDraft }
            .maxWithOrNull(compareBy<Submission> { it.attemptNumber }.thenBy { it.submittedAt })
        val draft = history.filter { it.isDraft }.maxByOrNull { it.savedAt }

        return when {
            draft != null -> AssignmentStatus.DRAFT
            latestSubmitted?.resubmissionRequested == true -> AssignmentStatus.RESUBMISSION_REQUIRED
            releasedGrade?.isReleased == true -> AssignmentStatus.GRADED
            latestSubmitted?.status in setOf(SubmissionStatus.GRADING, SubmissionStatus.GRADED) -> AssignmentStatus.GRADING
            latestSubmitted?.isLate == true -> AssignmentStatus.LATE
            latestSubmitted != null -> AssignmentStatus.SUBMITTED
            assignment.startAt?.let(now::isBefore) == true -> AssignmentStatus.UPCOMING
            assignment.publishStatus == AssignmentPublishStatus.CLOSED -> AssignmentStatus.CLOSED
            assignment.closeAt?.let { !now.isBefore(it) } == true -> AssignmentStatus.CLOSED
            now.isAfter(assignment.deadline) && !assignment.allowLateSubmission -> AssignmentStatus.OVERDUE
            else -> AssignmentStatus.NOT_SUBMITTED
        }
    }

    fun disabledReason(
        assignment: Assignment,
        status: AssignmentStatus,
        attemptsUsed: Int
    ): String? = when (status) {
        AssignmentStatus.UPCOMING -> "Bài tập chưa mở."
        AssignmentStatus.CLOSED -> "Bài tập đã đóng."
        AssignmentStatus.OVERDUE -> "Đã quá hạn nộp bài."
        AssignmentStatus.SUBMITTED,
        AssignmentStatus.LATE,
        AssignmentStatus.GRADED -> if (!assignment.allowResubmission) {
            "Bài tập này không cho phép nộp lại."
        } else if (attemptsUsed >= assignment.maxAttempts) {
            "Bạn đã sử dụng hết số lần nộp."
        } else null
        else -> null
    }
}
