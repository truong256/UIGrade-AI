/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.*
import com.uigrade.ai.domain.repository.StatsRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockStatsRepository @Inject constructor(
    private val dataStore: MockDataStore
) : StatsRepository {

    override suspend fun getAdminStats(): AdminStats {
        val completed = dataStore.gradingResults.size
        val failed = dataStore.submissions.count { it.status == SubmissionStatus.FAILED }
        return AdminStats(
            totalStudents = dataStore.users.count { it.role == UserRole.STUDENT },
            totalLecturers = dataStore.users.count { it.role == UserRole.LECTURER },
            totalAdmins = dataStore.users.count { it.role == UserRole.ADMIN },
            gradingJobs = GradingJobStats(
                completed = completed,
                failed = failed,
                pending = dataStore.submissions.count {
                    it.status == SubmissionStatus.PENDING || it.status == SubmissionStatus.PROCESSING
                }
            ),
            feedbackStats = FeedbackStats(generated = dataStore.feedbacks.size, failed = 0),
            aiEnabled = dataStore.aiFeedbackEnabled,
            activeUsers = dataStore.users.count { it.accountStatus == UserAccountStatus.ACTIVE },
            lockedUsers = dataStore.users.count { it.accountStatus == UserAccountStatus.LOCKED },
            totalClassrooms = dataStore.classrooms.size,
            totalAssignments = dataStore.assignments.size,
            totalSubmissions = dataStore.submissions.count { !it.isDraft },
            pendingGrading = dataStore.submissions.count {
                !it.isDraft && it.status in setOf(SubmissionStatus.PENDING, SubmissionStatus.PROCESSING, SubmissionStatus.SUBMITTED, SubmissionStatus.LATE)
            },
            activeRubrics = dataStore.rubrics.count { it.isActive },
            recentAlerts = dataStore.systemLogs.count { it.level != LogLevel.INFO }
        )
    }

    override suspend fun getLecturerStats(lecturerId: String): LecturerStats {
        val assignments = dataStore.assignments.filter { it.lecturerId == lecturerId }
        val assignmentIds = assignments.map { it.id }.toSet()
        val submissions = dataStore.submissions.filter { it.assignmentId in assignmentIds }
        val results = dataStore.gradingResults.filter { it.assignmentId in assignmentIds }
        val avg = if (results.isEmpty()) 0f
        else results.map { it.totalScore.toFloat() / it.maxScore * 100 }.average().toFloat()
        return LecturerStats(
            totalAssignments = assignments.size,
            totalSubmissions = submissions.size,
            averageScore = avg,
            pendingGrading = submissions.count { it.status == SubmissionStatus.PENDING || it.status == SubmissionStatus.PROCESSING }
        )
    }

    override suspend fun getSystemLogs(): List<SystemLog> {
        return dataStore.systemLogs.sortedByDescending { it.timestamp }
    }

    override suspend fun setAiFeedbackEnabled(enabled: Boolean) {
        dataStore.aiFeedbackEnabled = enabled
    }
}
