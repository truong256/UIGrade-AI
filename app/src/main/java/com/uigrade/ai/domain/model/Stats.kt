package com.uigrade.ai.domain.model

/**
 * System-level log entry for admin monitoring.
 */
data class SystemLog(
    val id: String,
    val level: LogLevel,
    val tag: String,
    val message: String,
    val timestamp: String,
    val userId: String? = null
)

enum class LogLevel {
    INFO,
    WARNING,
    ERROR
}

/**
 * Summary statistics for grading jobs.
 */
data class GradingJobStats(
    val completed: Int,
    val failed: Int,
    val pending: Int
)

/**
 * Summary statistics for AI feedback generation.
 */
data class FeedbackStats(
    val generated: Int,
    val failed: Int
)

/**
 * Admin dashboard overview data.
 */
data class AdminStats(
    val totalStudents: Int,
    val totalLecturers: Int,
    val totalAdmins: Int,
    val gradingJobs: GradingJobStats,
    val feedbackStats: FeedbackStats,
    val aiEnabled: Boolean
)

/**
 * Lecturer dashboard overview data.
 */
data class LecturerStats(
    val totalAssignments: Int,
    val totalSubmissions: Int,
    val averageScore: Float,
    val pendingGrading: Int
)
