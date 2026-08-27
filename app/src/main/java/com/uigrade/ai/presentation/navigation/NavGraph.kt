package com.uigrade.ai.presentation.navigation

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.uigrade.ai.presentation.admin.AdminDashboardScreen
import com.uigrade.ai.presentation.admin.MetricManagementScreen
import com.uigrade.ai.presentation.admin.RubricAdminScreen
import com.uigrade.ai.presentation.admin.RuleManagementScreen
import com.uigrade.ai.presentation.admin.SystemLogsScreen
import com.uigrade.ai.presentation.admin.UserManagementScreen
import com.uigrade.ai.presentation.auth.GetStartedScreen
import com.uigrade.ai.presentation.auth.LoginScreen
import com.uigrade.ai.presentation.auth.SignUpScreen
import com.uigrade.ai.presentation.auth.SplashScreen
import com.uigrade.ai.presentation.lecturer.AssignmentManagementScreen
import com.uigrade.ai.presentation.lecturer.LecturerDashboardScreen
import com.uigrade.ai.presentation.lecturer.LecturerStatisticsScreen
import com.uigrade.ai.presentation.lecturer.RubricDetailScreen
import com.uigrade.ai.presentation.lecturer.RubricManagementScreen
import com.uigrade.ai.presentation.lecturer.SubmissionDetailScreen
import com.uigrade.ai.presentation.lecturer.SubmissionListScreen
import com.uigrade.ai.presentation.student.AssignmentDetailScreen
import com.uigrade.ai.presentation.student.AssignmentListScreen
import com.uigrade.ai.presentation.student.GradingResultScreen
import com.uigrade.ai.presentation.student.StudentDashboardScreen
import com.uigrade.ai.presentation.student.StudentProfileScreen
import com.uigrade.ai.presentation.student.SubmitAssignmentScreen

@Composable
fun UIGradeNavGraph(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route,
        enterTransition = { fadeIn(tween(260)) + slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.Left, tween(260)) },
        exitTransition = { fadeOut(tween(260)) + slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.Left, tween(260)) },
        popEnterTransition = { fadeIn(tween(260)) + slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.Right, tween(260)) },
        popExitTransition = { fadeOut(tween(260)) + slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.Right, tween(260)) }
    ) {

        // ── Auth & Onboarding Flow ──────────────────────────────────────────
        composable(Screen.Splash.route) {
            SplashScreen(
                onNavigateToGetStarted = {
                    navController.navigate(Screen.GetStarted.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                },
                onAutoLogin = { role ->
                    val dest = when (role) {
                        "STUDENT" -> Screen.StudentDashboard.route
                        "LECTURER" -> Screen.LecturerDashboard.route
                        else -> Screen.AdminDashboard.route
                    }
                    navController.navigate(dest) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.GetStarted.route) {
            GetStartedScreen(
                onNavigateToSignUp = {
                    navController.navigate(Screen.SignUp.route)
                },
                onNavigateToLogin = {
                    navController.navigate(Screen.Login.route)
                }
            )
        }

        composable(Screen.SignUp.route) {
            SignUpScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToLogin = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.GetStarted.route)
                    }
                },
                onSignUpSuccess = { role ->
                    val dest = when (role) {
                        "STUDENT" -> Screen.StudentDashboard.route
                        "LECTURER" -> Screen.LecturerDashboard.route
                        else -> Screen.AdminDashboard.route
                    }
                    navController.navigate(dest) {
                        popUpTo(Screen.GetStarted.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Login.route) {
            LoginScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToSignUp = {
                    navController.navigate(Screen.SignUp.route) {
                        popUpTo(Screen.GetStarted.route)
                    }
                },
                onLoginSuccess = { role ->
                    val dest = when (role) {
                        "STUDENT" -> Screen.StudentDashboard.route
                        "LECTURER" -> Screen.LecturerDashboard.route
                        else -> Screen.AdminDashboard.route
                    }
                    navController.navigate(dest) {
                        popUpTo(Screen.GetStarted.route) { inclusive = true }
                    }
                }
            )
        }

        // ── Student ───────────────────────────────────────────────────────
        composable(Screen.StudentDashboard.route) {
            StudentDashboardScreen(
                onNavigateToAssignments = { navController.navigate(Screen.StudentAssignments.route) },
                onNavigateToAssignment = { id -> navController.navigate(Screen.AssignmentDetail.createRoute(id)) },
                onNavigateToProfile = { navController.navigate(Screen.StudentProfile.route) },
                onLogout = {
                    navController.navigate(Screen.GetStarted.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.StudentAssignments.route) {
            AssignmentListScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToAssignment = { id -> navController.navigate(Screen.AssignmentDetail.createRoute(id)) }
            )
        }

        composable(
            route = Screen.AssignmentDetail.route,
            arguments = listOf(navArgument("assignmentId") { type = NavType.StringType })
        ) { backStack ->
            val assignmentId = backStack.arguments?.getString("assignmentId") ?: return@composable
            AssignmentDetailScreen(
                assignmentId = assignmentId,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToSubmit = { navController.navigate(Screen.SubmitAssignment.createRoute(assignmentId)) },
                onNavigateToResult = { submissionId -> navController.navigate(Screen.GradingResult.createRoute(submissionId)) }
            )
        }

        composable(
            route = Screen.SubmitAssignment.route,
            arguments = listOf(navArgument("assignmentId") { type = NavType.StringType })
        ) { backStack ->
            val assignmentId = backStack.arguments?.getString("assignmentId") ?: return@composable
            SubmitAssignmentScreen(
                assignmentId = assignmentId,
                onNavigateBack = { navController.popBackStack() },
                onSubmitSuccess = { submissionId ->
                    navController.navigate(Screen.GradingResult.createRoute(submissionId)) {
                        popUpTo(Screen.StudentDashboard.route)
                    }
                }
            )
        }

        composable(
            route = Screen.GradingResult.route,
            arguments = listOf(navArgument("submissionId") { type = NavType.StringType })
        ) { backStack ->
            val submissionId = backStack.arguments?.getString("submissionId") ?: return@composable
            GradingResultScreen(
                submissionId = submissionId,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.StudentProfile.route) {
            StudentProfileScreen(
                onNavigateBack = { navController.popBackStack() },
                onLogout = {
                    navController.navigate(Screen.GetStarted.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        // ── Lecturer ──────────────────────────────────────────────────────
        composable(Screen.LecturerDashboard.route) {
            LecturerDashboardScreen(
                onNavigateToAssignments = { navController.navigate(Screen.LecturerAssignments.route) },
                onNavigateToRubrics = { navController.navigate(Screen.RubricManagement.route) },
                onNavigateToSubmissions = { id -> navController.navigate(Screen.LecturerSubmissions.createRoute(id)) },
                onNavigateToStatistics = { navController.navigate(Screen.LecturerStatistics.route) },
                onLogout = {
                    navController.navigate(Screen.GetStarted.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.LecturerAssignments.route) {
            AssignmentManagementScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToSubmissions = { id -> navController.navigate(Screen.LecturerSubmissions.createRoute(id)) }
            )
        }

        composable(Screen.RubricManagement.route) {
            RubricManagementScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToRubric = { id -> navController.navigate(Screen.RubricDetail.createRoute(id)) }
            )
        }

        composable(
            route = Screen.RubricDetail.route,
            arguments = listOf(navArgument("rubricId") { type = NavType.StringType })
        ) { backStack ->
            val rubricId = backStack.arguments?.getString("rubricId") ?: return@composable
            RubricDetailScreen(
                rubricId = rubricId,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.LecturerSubmissions.route,
            arguments = listOf(navArgument("assignmentId") { type = NavType.StringType })
        ) { backStack ->
            val assignmentId = backStack.arguments?.getString("assignmentId") ?: return@composable
            SubmissionListScreen(
                assignmentId = assignmentId,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToSubmission = { id -> navController.navigate(Screen.SubmissionDetail.createRoute(id)) }
            )
        }

        composable(
            route = Screen.SubmissionDetail.route,
            arguments = listOf(navArgument("submissionId") { type = NavType.StringType })
        ) { backStack ->
            val submissionId = backStack.arguments?.getString("submissionId") ?: return@composable
            SubmissionDetailScreen(
                submissionId = submissionId,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.LecturerStatistics.route) {
            LecturerStatisticsScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // ── Admin ─────────────────────────────────────────────────────────
        composable(Screen.AdminDashboard.route) {
            AdminDashboardScreen(
                onNavigateToUsers = { navController.navigate(Screen.UserManagement.route) },
                onNavigateToRubrics = { navController.navigate(Screen.AdminRubrics.route) },
                onNavigateToRules = { navController.navigate(Screen.RuleManagement.route) },
                onNavigateToMetrics = { navController.navigate(Screen.MetricManagement.route) },
                onNavigateToLogs = { navController.navigate(Screen.SystemLogs.route) },
                onLogout = {
                    navController.navigate(Screen.GetStarted.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.UserManagement.route) {
            UserManagementScreen(onNavigateBack = { navController.popBackStack() })
        }

        composable(Screen.AdminRubrics.route) {
            RubricAdminScreen(onNavigateBack = { navController.popBackStack() })
        }

        composable(Screen.RuleManagement.route) {
            RuleManagementScreen(onNavigateBack = { navController.popBackStack() })
        }

        composable(Screen.MetricManagement.route) {
            MetricManagementScreen(onNavigateBack = { navController.popBackStack() })
        }

        composable(Screen.SystemLogs.route) {
            SystemLogsScreen(onNavigateBack = { navController.popBackStack() })
        }
    }
}
