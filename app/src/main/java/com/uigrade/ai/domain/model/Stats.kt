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
    val userId: String? = null,
    val action: AuditAction = AuditAction.SYSTEM_EVENT,
    val actorName: String = "Hệ thống",
    val targetType: String = "Hệ thống",
    val targetId: String? = null,
    val outcome: AuditOutcome = AuditOutcome.SUCCESS,
    val description: String = message
)

enum class AuditAction {
    LOGIN,
    LOGOUT,
    CREATE_USER,
    UPDATE_USER,
    LOCK_USER,
    UNLOCK_USER,
    CHANGE_ROLE,
    DELETE_USER,
    RESET_PASSWORD,
    COPY_RUBRIC,
    UPDATE_RUBRIC,
    DELETE_RUBRIC,
    UPDATE_RULE,
    UPDATE_METRIC,
    PERMISSION_DENIED,
    SYSTEM_EVENT
}

enum class AuditOutcome {
    SUCCESS,
    FAILURE
}

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
    val aiEnabled: Boolean,
    val totalUsers: Int = totalStudents + totalLecturers + totalAdmins,
    val activeUsers: Int = totalUsers,
    val lockedUsers: Int = 0,
    val totalClassrooms: Int = 0,
    val totalAssignments: Int = 0,
    val totalSubmissions: Int = 0,
    val pendingGrading: Int = gradingJobs.pending,
    val activeRubrics: Int = 0,
    val recentAlerts: Int = 0
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
