/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.data.mock

import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.ClassMembership
import com.uigrade.ai.domain.model.ClassAnnouncement
import com.uigrade.ai.domain.model.Classroom
import com.uigrade.ai.domain.model.Feedback
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.model.JoinRequest
import com.uigrade.ai.domain.model.LecturerNotification
import com.uigrade.ai.domain.model.LearningMaterial
import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.model.Rule
import com.uigrade.ai.domain.model.Metric
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.model.StudentNotification
import com.uigrade.ai.domain.model.SystemLog
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserAccountStatus
import java.time.LocalDateTime
import javax.inject.Inject
import javax.inject.Singleton

/**
 * In-memory source of truth shared by every mock repository for the lifetime of the app.
 * Keeping the collections here prevents a submission made on one screen from being
 * invisible to dashboards and grading-result screens backed by another repository.
 */
@Singleton
class MockDataStore @Inject constructor() {
    val users: MutableList<User> = MockData.allUsers.mapIndexed { index, user ->
        user.copy(
            staffId = if (user.role.name == "LECTURER") "GV${(index + 1).toString().padStart(3, '0')}" else user.staffId,
            accountStatus = if (user.id == "s4") UserAccountStatus.LOCKED else UserAccountStatus.ACTIVE,
            createdAt = LocalDateTime.of(2025, 9, 1, 8, 0).plusDays(index.toLong() * 17),
            lastLoginAt = LocalDateTime.of(2026, 8, 28, 9, 0).minusHours(index.toLong() * 3),
            isSuperAdmin = user.id == "a1"
        )
    }.toMutableList()
    val assignments: MutableList<Assignment> = MockData.assignments
        .sortedByDescending { it.id == "a3" }
        .map { assignment ->
        when (assignment.id) {
            "a1" -> assignment.copy(
                startAt = LocalDateTime.of(2026, 8, 1, 10, 0),
                instructions = "Nộp tệp APK hoặc ZIP kèm mô tả ngắn về quyết định thiết kế.",
                allowResubmission = true,
                maxAttempts = 3,
                resourceUrl = "https://developer.android.com/develop/ui/compose/designsystems/material3"
            )
            "a2" -> assignment.copy(
                startAt = LocalDateTime.of(2026, 8, 10, 10, 0),
                instructions = "Cung cấp APK hoặc ZIP và liên kết dự án nếu có.",
                allowLateSubmission = true,
                allowResubmission = true,
                maxAttempts = 3
            )
            "a3" -> assignment.copy(
                startAt = LocalDateTime.of(2026, 8, 15, 10, 0),
                instructions = "Nộp APK, AAB hoặc ZIP của dự án hoàn chỉnh.",
                allowLateSubmission = true,
                allowResubmission = true,
                maxAttempts = 2
            )
            else -> assignment
        }
    }.toMutableList()
    val rubrics: MutableList<Rubric> = MockData.allRubrics.map { rubric ->
        rubric.copy(usedByAssignmentIds = assignments.filter { it.rubricId == rubric.id }.map { it.id })
    }.toMutableList()
    val submissions: MutableList<Submission> = MockData.submissions.toMutableList()
    val gradingResults: MutableList<GradingResult> = MockData.allGradingResults.map {
        it.copy(
            isReleased = true,
            lecturerComment = "Bài làm đã được đánh giá theo rubric và công bố cho sinh viên.",
            lecturerId = "l1"
        )
    }.toMutableList()
    val feedbacks: MutableList<Feedback> = MockData.allFeedbacks.toMutableList()
    val adminRules: MutableList<Rule> = rubrics
        .flatMap { rubric -> rubric.criteria.flatMap { it.rules } }
        .distinctBy { it.id }
        .mapIndexed { index, rule -> rule.copy(isCritical = index == 0) }
        .toMutableList()
    val adminMetrics: MutableList<Metric> = gradingResults
        .flatMap { result -> result.criteriaScores.flatMap { it.metrics } }
        .distinctBy { it.id }
        .toMutableList()
    val systemLogs: MutableList<SystemLog> = MockData.systemLogs.toMutableList()

    // Classroom data
    val classrooms: MutableList<Classroom> = MockData.classrooms.map { classroom ->
        when (classroom.id) {
            "cls1" -> classroom.copy(
                courseName = "Phát triển giao diện Android",
                academicYear = "2026-2027",
                schedule = "Thứ 3, 08:00–10:30",
                room = "A2.304"
            )
            "cls2" -> classroom.copy(
                courseName = "Phát triển giao diện Android nâng cao",
                academicYear = "2026-2027",
                schedule = "Thứ 5, 13:30–16:00",
                room = "B1.202",
                requiresApproval = true
            )
            else -> classroom
        }
    }.toMutableList()
    val memberships: MutableList<ClassMembership> = MockData.memberships.toMutableList()
    val joinRequests: MutableList<JoinRequest> = MockData.joinRequests.toMutableList()
    val notifications: MutableList<LecturerNotification> = MockData.lecturerNotifications.toMutableList()
    val studentNotifications: MutableList<StudentNotification> = MockStudentData.notifications.toMutableList()
    val announcements: MutableList<ClassAnnouncement> = MockStudentData.announcements.toMutableList()
    val learningMaterials: MutableList<LearningMaterial> = MockStudentData.materials.toMutableList()

    var aiFeedbackEnabled: Boolean = true
}
