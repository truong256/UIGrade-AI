package com.uigrade.ai.presentation.navigation

/**
 * All navigation routes in the UIGrade AI app.
 * Using sealed class ensures exhaustive handling and no typo-based route bugs.
 */
sealed class Screen(val route: String) {

    // ─── Auth & Onboarding ──────────────────────────────────────────────────
    object Splash      : Screen("splash")
    object GetStarted  : Screen("get_started")
    object SignUp      : Screen("sign_up")
    object Login       : Screen("login")

    // ─── Student ──────────────────────────────────────────────────────────
    object StudentDashboard      : Screen("student/dashboard")
    object StudentClassrooms     : Screen("student/classrooms")
    object JoinClassroom         : Screen("student/classrooms/join")
    object StudentClassroomDetail: Screen("student/classroom/{classroomId}") {
        fun createRoute(classroomId: String) = "student/classroom/$classroomId"
    }
    object StudentAssignments    : Screen("student/assignments")
    object AssignmentDetail      : Screen("student/assignments/{assignmentId}") {
        fun createRoute(assignmentId: String) = "student/assignments/$assignmentId"
    }
    object SubmitAssignment      : Screen("student/submit/{assignmentId}") {
        fun createRoute(assignmentId: String) = "student/submit/$assignmentId"
    }
    object GradingResult         : Screen("student/result/{submissionId}") {
        fun createRoute(submissionId: String) = "student/result/$submissionId"
    }
    object StudentProfile        : Screen("student/profile")

    // ─── Lecturer ─────────────────────────────────────────────────────────
    object LecturerDashboard     : Screen("lecturer/dashboard")
    object LecturerClassrooms    : Screen("lecturer/classrooms")
    object CreateClassroom       : Screen("lecturer/classroom/create")
    object EditClassroom         : Screen("lecturer/classroom/{classroomId}/edit") {
        fun createRoute(classroomId: String) = "lecturer/classroom/$classroomId/edit"
    }
    object ClassroomDetail       : Screen("lecturer/classroom/{classroomId}") {
        fun createRoute(classroomId: String) = "lecturer/classroom/$classroomId"
    }
    object ClassroomStudents     : Screen("lecturer/classroom/{classroomId}/students") {
        fun createRoute(classroomId: String) = "lecturer/classroom/$classroomId/students"
    }
    object ClassroomJoinRequests : Screen("lecturer/classroom/{classroomId}/join-requests") {
        fun createRoute(classroomId: String) = "lecturer/classroom/$classroomId/join-requests"
    }
    object CreateLecturerAssignment : Screen("lecturer/assignment/create")
    object CreateAssignment      : Screen("lecturer/classroom/{classroomId}/assignment/create") {
        fun createRoute(classroomId: String) = "lecturer/classroom/$classroomId/assignment/create"
    }
    object EditAssignment        : Screen("lecturer/assignment/edit/{assignmentId}") {
        fun createRoute(assignmentId: String) = "lecturer/assignment/edit/$assignmentId"
    }
    object LecturerAssignmentDetail : Screen("lecturer/assignment/{assignmentId}") {
        fun createRoute(assignmentId: String) = "lecturer/assignment/$assignmentId"
    }
    object LecturerAssignments   : Screen("lecturer/assignments")
    object RubricManagement      : Screen("lecturer/rubrics")
    object RubricDetail          : Screen("lecturer/rubrics/{rubricId}") {
        fun createRoute(rubricId: String) = "lecturer/rubrics/$rubricId"
    }
    object CreateRubric          : Screen("lecturer/rubric/create")
    object EditRubric            : Screen("lecturer/rubric/{rubricId}/edit") {
        fun createRoute(rubricId: String) = "lecturer/rubric/$rubricId/edit"
    }
    object LecturerSubmissions   : Screen("lecturer/submissions/{assignmentId}") {
        fun createRoute(assignmentId: String) = "lecturer/submissions/$assignmentId"
    }
    object SubmissionDetail      : Screen("lecturer/submission/{submissionId}") {
        fun createRoute(submissionId: String) = "lecturer/submission/$submissionId"
    }
    object GradingScreen         : Screen("lecturer/submission/{submissionId}/grade") {
        fun createRoute(submissionId: String) = "lecturer/submission/$submissionId/grade"
    }
    object LecturerStatistics    : Screen("lecturer/statistics")
    object LecturerNotifications : Screen("lecturer/notifications")
    object LecturerProfile       : Screen("lecturer/profile")

    // ─── Admin ────────────────────────────────────────────────────────────
    object AdminDashboard        : Screen("admin/dashboard")
    object UserManagement        : Screen("admin/users")
    object AdminRubrics          : Screen("admin/rubrics")
    object RuleManagement        : Screen("admin/rules")
    object MetricManagement      : Screen("admin/metrics")
    object SystemLogs            : Screen("admin/logs")
}
