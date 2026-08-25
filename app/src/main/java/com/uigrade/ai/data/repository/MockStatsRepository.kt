package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockData
import com.uigrade.ai.domain.model.*
import com.uigrade.ai.domain.repository.StatsRepository
import kotlinx.coroutines.delay
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockStatsRepository @Inject constructor() : StatsRepository {

    private var aiEnabled = true

    override suspend fun getAdminStats(): AdminStats {
        delay(500)
        val completed = MockData.allGradingResults.size
        val failed = 12
        return AdminStats(
            totalStudents = MockData.students.size,
            totalLecturers = MockData.lecturers.size,
            totalAdmins = MockData.admins.size,
            gradingJobs = GradingJobStats(completed = completed + 1244, failed = failed, pending = 2),
            feedbackStats = FeedbackStats(generated = MockData.allFeedbacks.size + 1178, failed = 7),
            aiEnabled = aiEnabled
        )
    }

    override suspend fun getLecturerStats(lecturerId: String): LecturerStats {
        delay(400)
        val assignments = MockData.assignments.filter { it.lecturerId == lecturerId }
        val assignmentIds = assignments.map { it.id }.toSet()
        val submissions = MockData.submissions.filter { it.assignmentId in assignmentIds }
        val results = MockData.allGradingResults.filter { it.assignmentId in assignmentIds }
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
        delay(400)
        return MockData.systemLogs
    }

    override suspend fun setAiFeedbackEnabled(enabled: Boolean) {
        delay(300)
        aiEnabled = enabled
    }
}
