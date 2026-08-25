package com.uigrade.ai.presentation.navigation

/**
 * All navigation routes in the UIGrade AI app.
 * Using sealed class ensures exhaustive handling and no typo-based route bugs.
 */
sealed class Screen(val route: String) {

    // ─── Auth ──────────────────────────────────────────────────────────────
    object Splash : Screen("splash")
    object Login  : Screen("login")

    // ─── Student ──────────────────────────────────────────────────────────
    object StudentDashboard    : Screen("student/dashboard")
    object StudentAssignments  : Screen("student/assignments")
    object AssignmentDetail    : Screen("student/assignments/{assignmentId}") {
        fun createRoute(assignmentId: String) = "student/assignments/$assignmentId"
    }
    object SubmitAssignment    : Screen("student/submit/{assignmentId}") {
        fun createRoute(assignmentId: String) = "student/submit/$assignmentId"
    }
    object GradingResult       : Screen("student/result/{submissionId}") {
        fun createRoute(submissionId: String) = "student/result/$submissionId"
    }
    object StudentProfile      : Screen("student/profile")

    // ─── Lecturer ─────────────────────────────────────────────────────────
    object LecturerDashboard   : Screen("lecturer/dashboard")
    object LecturerAssignments : Screen("lecturer/assignments")
    object RubricManagement    : Screen("lecturer/rubrics")
    object RubricDetail        : Screen("lecturer/rubrics/{rubricId}") {
        fun createRoute(rubricId: String) = "lecturer/rubrics/$rubricId"
    }
    object LecturerSubmissions : Screen("lecturer/submissions/{assignmentId}") {
        fun createRoute(assignmentId: String) = "lecturer/submissions/$assignmentId"
    }
    object SubmissionDetail    : Screen("lecturer/submission/{submissionId}") {
        fun createRoute(submissionId: String) = "lecturer/submission/$submissionId"
    }
    object LecturerStatistics  : Screen("lecturer/statistics")

    // ─── Admin ────────────────────────────────────────────────────────────
    object AdminDashboard      : Screen("admin/dashboard")
    object UserManagement      : Screen("admin/users")
    object AdminRubrics        : Screen("admin/rubrics")
    object RuleManagement      : Screen("admin/rules")
    object MetricManagement    : Screen("admin/metrics")
    object SystemLogs          : Screen("admin/logs")
}
