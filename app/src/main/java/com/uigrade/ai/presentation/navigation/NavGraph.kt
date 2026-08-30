/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

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
import com.uigrade.ai.domain.model.UserAccountStatus
import com.uigrade.ai.domain.model.UserRole
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
import com.uigrade.ai.presentation.lecturer.*
import com.uigrade.ai.presentation.student.*

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
                        "ADMIN" -> Screen.AdminDashboard.route
                        else -> Screen.GetStarted.route
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
                        "ADMIN" -> Screen.AdminDashboard.route
                        else -> Screen.GetStarted.route
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
                        "ADMIN" -> Screen.AdminDashboard.route
                        else -> Screen.GetStarted.route
                    }
                    navController.navigate(dest) {
                        popUpTo(Screen.GetStarted.route) { inclusive = true }
                    }
                }
            )
        }

        // ── Student ───────────────────────────────────────────────────────
        composable(Screen.StudentDashboard.route) {
            StudentOnly(navController) {
                StudentDashboardScreen(
                    onNavigateToAssignments = { filter -> navController.safeNavigate(Screen.StudentAssignments.createRoute(filter)) },
                    onNavigateToAssignment = { id -> navController.safeNavigate(Screen.AssignmentDetail.createRoute(id)) },
                    onNavigateToClassrooms = { navController.safeNavigate(Screen.StudentClassrooms.route) },
                    onNavigateToClassroom = { id -> navController.safeNavigate(Screen.StudentClassroomDetail.createRoute(id)) },
                    onNavigateToJoinClassroom = { navController.safeNavigate(Screen.JoinClassroom.route) },
                    onNavigateToGrades = { navController.safeNavigate(Screen.StudentGrades.route) },
                    onNavigateToProgress = { navController.safeNavigate(Screen.StudentProgress.route) },
                    onNavigateToCalendar = { navController.safeNavigate(Screen.StudentCalendar.route) },
                    onNavigateToNotifications = { navController.safeNavigate(Screen.StudentNotifications.route) },
                    onNavigateToProfile = { navController.safeNavigate(Screen.StudentProfile.route) },
                    onLogout = { navController.clearTo(Screen.GetStarted.route) }
                )
            }
        }

        composable(Screen.StudentClassrooms.route) {
            StudentOnly(navController) {
                StudentClassroomListScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToJoinClassroom = { navController.safeNavigate(Screen.JoinClassroom.route) },
                    onNavigateToJoinRequests = { navController.safeNavigate(Screen.StudentJoinRequests.route) },
                    onNavigateToClassroomDetail = { id -> navController.safeNavigate(Screen.StudentClassroomDetail.createRoute(id)) }
                )
            }
        }

        composable(Screen.JoinClassroom.route) {
            StudentOnly(navController) {
                JoinClassroomScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onJoined = { classroomId ->
                        navController.navigate(Screen.StudentClassroomDetail.createRoute(classroomId)) {
                            popUpTo(Screen.StudentClassrooms.route) { inclusive = false }
                            launchSingleTop = true
                        }
                    },
                    onPending = {
                        navController.navigate(Screen.StudentJoinRequests.route) {
                            popUpTo(Screen.StudentClassrooms.route) { inclusive = false }
                            launchSingleTop = true
                        }
                    }
                )
            }
        }

        composable(Screen.StudentJoinRequests.route) {
            StudentOnly(navController) {
                StudentJoinRequestsScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToClassroom = { id -> navController.safeNavigate(Screen.StudentClassroomDetail.createRoute(id)) }
                )
            }
        }

        composable(
            route = Screen.StudentClassroomDetail.route,
            arguments = listOf(navArgument("classroomId") { type = NavType.StringType })
        ) { backStack ->
            StudentOnly(navController) {
                val classroomId = backStack.arguments?.getString("classroomId").orEmpty()
                StudentClassroomDetailScreen(
                    classroomId = classroomId,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToAssignment = { assignmentId -> navController.safeNavigate(Screen.AssignmentDetail.createRoute(assignmentId)) }
                )
            }
        }

        composable(
            route = Screen.StudentAssignments.route,
            arguments = listOf(navArgument("filter") { type = NavType.StringType; defaultValue = "all" })
        ) { backStack ->
            StudentOnly(navController) {
                AssignmentListScreen(
                    initialFilter = backStack.arguments?.getString("filter"),
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToAssignment = { id -> navController.safeNavigate(Screen.AssignmentDetail.createRoute(id)) }
                )
            }
        }

        composable(
            route = Screen.AssignmentDetail.route,
            arguments = listOf(navArgument("assignmentId") { type = NavType.StringType })
        ) { backStack ->
            StudentOnly(navController) {
                val assignmentId = backStack.arguments?.getString("assignmentId").orEmpty()
                AssignmentDetailScreen(
                    assignmentId = assignmentId,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToEditor = { navController.safeNavigate(Screen.SubmitAssignment.createRoute(assignmentId)) },
                    onNavigateToSubmission = { id -> navController.safeNavigate(Screen.StudentSubmissionDetail.createRoute(id)) },
                    onNavigateToResult = { id -> navController.safeNavigate(Screen.GradingResult.createRoute(id)) },
                    onNavigateToHistory = { navController.safeNavigate(Screen.StudentSubmissionHistory.createRoute(assignmentId)) }
                )
            }
        }

        composable(
            route = Screen.SubmitAssignment.route,
            arguments = listOf(navArgument("assignmentId") { type = NavType.StringType })
        ) { backStack ->
            StudentOnly(navController) {
                val assignmentId = backStack.arguments?.getString("assignmentId").orEmpty()
                SubmitAssignmentScreen(
                    assignmentId = assignmentId,
                    onNavigateBack = { navController.popBackStack() },
                    onSubmitSuccess = { submissionId ->
                        navController.navigate(Screen.StudentSubmissionDetail.createRoute(submissionId)) {
                            popUpTo(Screen.AssignmentDetail.createRoute(assignmentId)) { inclusive = false }
                            launchSingleTop = true
                        }
                    }
                )
            }
        }

        composable(
            route = Screen.StudentSubmissionDetail.route,
            arguments = listOf(navArgument("submissionId") { type = NavType.StringType })
        ) { backStack ->
            StudentOnly(navController) {
                val submissionId = backStack.arguments?.getString("submissionId").orEmpty()
                StudentSubmissionDetailScreen(
                    submissionId = submissionId,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToHistory = { id -> navController.safeNavigate(Screen.StudentSubmissionHistory.createRoute(id)) },
                    onNavigateToResubmit = { id -> navController.safeNavigate(Screen.SubmitAssignment.createRoute(id)) },
                    onNavigateToResult = { id -> navController.safeNavigate(Screen.GradingResult.createRoute(id)) }
                )
            }
        }

        composable(
            route = Screen.StudentSubmissionHistory.route,
            arguments = listOf(navArgument("assignmentId") { type = NavType.StringType })
        ) { backStack ->
            StudentOnly(navController) {
                StudentSubmissionHistoryScreen(
                    assignmentId = backStack.arguments?.getString("assignmentId").orEmpty(),
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToSubmission = { id -> navController.safeNavigate(Screen.StudentSubmissionDetail.createRoute(id)) }
                )
            }
        }

        composable(
            route = Screen.GradingResult.route,
            arguments = listOf(navArgument("submissionId") { type = NavType.StringType })
        ) { backStack ->
            StudentOnly(navController) {
                val submissionId = backStack.arguments?.getString("submissionId").orEmpty()
                GradingResultScreen(
                    submissionId = submissionId,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToSubmission = { id -> navController.safeNavigate(Screen.StudentSubmissionDetail.createRoute(id)) }
                )
            }
        }

        composable(Screen.StudentGrades.route) {
            StudentOnly(navController) {
                StudentGradesScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToResult = { id -> navController.safeNavigate(Screen.GradingResult.createRoute(id)) }
                )
            }
        }

        composable(Screen.StudentProgress.route) {
            StudentOnly(navController) {
                StudentProgressScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToAssignment = { id -> navController.safeNavigate(Screen.AssignmentDetail.createRoute(id)) }
                )
            }
        }

        composable(Screen.StudentCalendar.route) {
            StudentOnly(navController) {
                StudentCalendarScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToAssignment = { id -> navController.safeNavigate(Screen.AssignmentDetail.createRoute(id)) }
                )
            }
        }

        composable(Screen.StudentNotifications.route) {
            StudentOnly(navController) {
                StudentNotificationsScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onOpenClassroom = { id -> navController.safeNavigate(Screen.StudentClassroomDetail.createRoute(id)) },
                    onOpenAssignment = { id -> navController.safeNavigate(Screen.AssignmentDetail.createRoute(id)) },
                    onOpenResult = { id -> navController.safeNavigate(Screen.GradingResult.createRoute(id)) },
                    onOpenJoinRequests = { navController.safeNavigate(Screen.StudentJoinRequests.route) }
                )
            }
        }

        composable(Screen.StudentProfile.route) {
            StudentOnly(navController) {
                StudentProfileScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToChangePassword = { navController.safeNavigate(Screen.StudentChangePassword.route) },
                    onLogout = { navController.clearTo(Screen.GetStarted.route) }
                )
            }
        }

        composable(Screen.StudentChangePassword.route) {
            StudentOnly(navController) {
                StudentChangePasswordScreen(onNavigateBack = { navController.popBackStack() })
            }
        }

        // ── Lecturer ──────────────────────────────────────────────────────
        composable(Screen.LecturerDashboard.route) {
            LecturerOnly(navController) {
                LecturerDashboardScreen(
                    onNavigateToAssignments = { navController.safeNavigate(Screen.LecturerAssignments.route) },
                    onNavigateToCreateAssignment = { navController.safeNavigate(Screen.CreateLecturerAssignment.route) },
                    onNavigateToRubrics = { navController.safeNavigate(Screen.RubricManagement.route) },
                    onNavigateToClassrooms = { navController.safeNavigate(Screen.LecturerClassrooms.route) },
                    onNavigateToClassroom = { id -> navController.safeNavigate(Screen.ClassroomDetail.createRoute(id)) },
                    onNavigateToCreateClassroom = { navController.safeNavigate(Screen.CreateClassroom.route) },
                    onNavigateToSubmissions = { id -> navController.safeNavigate(Screen.LecturerSubmissions.createRoute(id)) },
                    onNavigateToStatistics = { navController.safeNavigate(Screen.LecturerStatistics.route) },
                    onNavigateToNotifications = { navController.safeNavigate(Screen.LecturerNotifications.route) },
                    onNavigateToProfile = { navController.safeNavigate(Screen.LecturerProfile.route) },
                    onLogout = { navController.clearTo(Screen.GetStarted.route) }
                )
            }
        }

        composable(Screen.LecturerClassrooms.route) {
            LecturerOnly(navController) {
                LecturerClassroomListScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToCreateClassroom = { navController.safeNavigate(Screen.CreateClassroom.route) },
                    onNavigateToClassroomDetail = { id -> navController.safeNavigate(Screen.ClassroomDetail.createRoute(id)) }
                )
            }
        }

        composable(Screen.CreateClassroom.route) {
            LecturerOnly(navController) {
                CreateClassroomScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onClassroomCreated = { classroomId ->
                        navController.navigate(Screen.ClassroomDetail.createRoute(classroomId)) {
                            popUpTo(Screen.LecturerClassrooms.route) { inclusive = false }
                            launchSingleTop = true
                        }
                    }
                )
            }
        }

        composable(
            route = Screen.EditClassroom.route,
            arguments = listOf(navArgument("classroomId") { type = NavType.StringType })
        ) { backStack ->
            val classroomId = backStack.arguments?.getString("classroomId") ?: return@composable
            LecturerOnly(navController) {
                CreateClassroomScreen(
                    classroomId = classroomId,
                    onNavigateBack = { navController.popBackStack() },
                    onClassroomCreated = { navController.popBackStack() }
                )
            }
        }

        composable(
            route = Screen.ClassroomDetail.route,
            arguments = listOf(navArgument("classroomId") { type = NavType.StringType })
        ) { backStack ->
            val classroomId = backStack.arguments?.getString("classroomId") ?: return@composable
            LecturerOnly(navController) {
                ClassroomDetailScreen(
                    classroomId = classroomId,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToEditClassroom = { id -> navController.safeNavigate(Screen.EditClassroom.createRoute(id)) },
                    onNavigateToCreateAssignment = { id -> navController.safeNavigate(Screen.CreateAssignment.createRoute(id)) },
                    onNavigateToEditAssignment = { id -> navController.safeNavigate(Screen.EditAssignment.createRoute(id)) },
                    onNavigateToStudents = { id -> navController.safeNavigate(Screen.ClassroomStudents.createRoute(id)) },
                    onNavigateToJoinRequests = { id -> navController.safeNavigate(Screen.ClassroomJoinRequests.createRoute(id)) },
                    onNavigateToSubmissions = { id -> navController.safeNavigate(Screen.LecturerSubmissions.createRoute(id)) }
                )
            }
        }

        composable(
            route = Screen.ClassroomStudents.route,
            arguments = listOf(navArgument("classroomId") { type = NavType.StringType })
        ) { backStack ->
            val classroomId = backStack.arguments?.getString("classroomId") ?: return@composable
            LecturerOnly(navController) {
                ClassroomStudentListScreen(classroomId, onNavigateBack = { navController.popBackStack() })
            }
        }

        composable(
            route = Screen.ClassroomJoinRequests.route,
            arguments = listOf(navArgument("classroomId") { type = NavType.StringType })
        ) { backStack ->
            val classroomId = backStack.arguments?.getString("classroomId") ?: return@composable
            LecturerOnly(navController) {
                JoinRequestsScreen(classroomId, onNavigateBack = { navController.popBackStack() })
            }
        }

        composable(Screen.CreateLecturerAssignment.route) {
            LecturerOnly(navController) {
                CreateEditAssignmentScreen(
                    classroomId = "",
                    onNavigateBack = { navController.popBackStack() },
                    onSaved = { navController.popBackStack() }
                )
            }
        }

        composable(
            route = Screen.CreateAssignment.route,
            arguments = listOf(navArgument("classroomId") { type = NavType.StringType })
        ) { backStack ->
            val classroomId = backStack.arguments?.getString("classroomId") ?: return@composable
            LecturerOnly(navController) {
                CreateEditAssignmentScreen(
                    classroomId = classroomId,
                    onNavigateBack = { navController.popBackStack() },
                    onSaved = { navController.popBackStack() }
                )
            }
        }

        composable(
            route = Screen.EditAssignment.route,
            arguments = listOf(navArgument("assignmentId") { type = NavType.StringType })
        ) { backStack ->
            val assignmentId = backStack.arguments?.getString("assignmentId") ?: return@composable
            LecturerOnly(navController) {
                CreateEditAssignmentScreen(
                    classroomId = "",
                    assignmentId = assignmentId,
                    onNavigateBack = { navController.popBackStack() },
                    onSaved = { navController.popBackStack() }
                )
            }
        }

        composable(Screen.LecturerAssignments.route) {
            LecturerOnly(navController) {
                AssignmentManagementScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToCreate = { navController.safeNavigate(Screen.CreateLecturerAssignment.route) },
                    onNavigateToDetail = { id -> navController.safeNavigate(Screen.LecturerAssignmentDetail.createRoute(id)) },
                    onNavigateToEdit = { id -> navController.safeNavigate(Screen.EditAssignment.createRoute(id)) },
                    onNavigateToSubmissions = { id -> navController.safeNavigate(Screen.LecturerSubmissions.createRoute(id)) }
                )
            }
        }

        composable(
            route = Screen.LecturerAssignmentDetail.route,
            arguments = listOf(navArgument("assignmentId") { type = NavType.StringType })
        ) { backStack ->
            val assignmentId = backStack.arguments?.getString("assignmentId") ?: return@composable
            LecturerOnly(navController) {
                LecturerAssignmentDetailScreen(
                    assignmentId = assignmentId,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToEdit = { id -> navController.safeNavigate(Screen.EditAssignment.createRoute(id)) },
                    onNavigateToSubmissions = { id -> navController.safeNavigate(Screen.LecturerSubmissions.createRoute(id)) }
                )
            }
        }

        composable(Screen.RubricManagement.route) {
            LecturerOnly(navController) {
                RubricManagementScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onCreateRubric = { navController.safeNavigate(Screen.CreateRubric.route) },
                    onNavigateToRubric = { id -> navController.safeNavigate(Screen.RubricDetail.createRoute(id)) },
                    onEditRubric = { id -> navController.safeNavigate(Screen.EditRubric.createRoute(id)) }
                )
            }
        }

        composable(Screen.CreateRubric.route) {
            LecturerOnly(navController) {
                RubricEditorScreen(
                    rubricId = null,
                    onNavigateBack = { navController.popBackStack() },
                    onSaved = { navController.popBackStack() }
                )
            }
        }

        composable(
            route = Screen.EditRubric.route,
            arguments = listOf(navArgument("rubricId") { type = NavType.StringType })
        ) { backStack ->
            val rubricId = backStack.arguments?.getString("rubricId") ?: return@composable
            LecturerOnly(navController) {
                RubricEditorScreen(
                    rubricId = rubricId,
                    onNavigateBack = { navController.popBackStack() },
                    onSaved = { navController.popBackStack() }
                )
            }
        }

        composable(
            route = Screen.RubricDetail.route,
            arguments = listOf(navArgument("rubricId") { type = NavType.StringType })
        ) { backStack ->
            val rubricId = backStack.arguments?.getString("rubricId") ?: return@composable
            LecturerOnly(navController) {
                RubricDetailScreen(rubricId, onNavigateBack = { navController.popBackStack() })
            }
        }

        composable(
            route = Screen.LecturerSubmissions.route,
            arguments = listOf(navArgument("assignmentId") { type = NavType.StringType })
        ) { backStack ->
            val assignmentId = backStack.arguments?.getString("assignmentId") ?: return@composable
            LecturerOnly(navController) {
                SubmissionListScreen(
                    assignmentId = assignmentId,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToSubmission = { id -> navController.safeNavigate(Screen.SubmissionDetail.createRoute(id)) },
                    onNavigateToGrading = { id -> navController.safeNavigate(Screen.GradingScreen.createRoute(id)) }
                )
            }
        }

        composable(
            route = Screen.SubmissionDetail.route,
            arguments = listOf(navArgument("submissionId") { type = NavType.StringType })
        ) { backStack ->
            val submissionId = backStack.arguments?.getString("submissionId") ?: return@composable
            LecturerOnly(navController) {
                SubmissionDetailScreen(
                    submissionId = submissionId,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToGrading = { id -> navController.safeNavigate(Screen.GradingScreen.createRoute(id)) }
                )
            }
        }

        composable(
            route = Screen.GradingScreen.route,
            arguments = listOf(navArgument("submissionId") { type = NavType.StringType })
        ) { backStack ->
            val submissionId = backStack.arguments?.getString("submissionId") ?: return@composable
            LecturerOnly(navController) {
                GradingScreen(
                    submissionId = submissionId,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToGrading = { id ->
                        navController.navigate(Screen.GradingScreen.createRoute(id)) {
                            popUpTo(Screen.GradingScreen.route) { inclusive = true }
                            launchSingleTop = true
                        }
                    }
                )
            }
        }

        composable(Screen.LecturerStatistics.route) {
            LecturerOnly(navController) {
                LecturerAnalyticsScreen(onNavigateBack = { navController.popBackStack() })
            }
        }

        composable(Screen.LecturerNotifications.route) {
            LecturerOnly(navController) {
                LecturerNotificationsScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onOpenNotification = { notification ->
                        val route = when {
                            notification.submissionId != null -> Screen.SubmissionDetail.createRoute(notification.submissionId)
                            notification.assignmentId != null -> Screen.LecturerSubmissions.createRoute(notification.assignmentId)
                            notification.classroomId != null -> Screen.ClassroomDetail.createRoute(notification.classroomId)
                            else -> Screen.LecturerDashboard.route
                        }
                        navController.safeNavigate(route)
                    }
                )
            }
        }

        composable(Screen.LecturerProfile.route) {
            LecturerOnly(navController) {
                LecturerProfileScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onLogout = { navController.clearTo(Screen.GetStarted.route) }
                )
            }
        }

        // ── Admin ─────────────────────────────────────────────────────────
        composable(Screen.AdminDashboard.route) {
            AdminOnly(navController) {
                AdminDashboardScreen(
                    onNavigateToUsers = { role, status ->
                        navController.safeNavigate(Screen.UserManagement.createRoute(role?.name, status?.name))
                    },
                    onNavigateToRubrics = { navController.safeNavigate(Screen.AdminRubrics.route) },
                    onNavigateToRules = { navController.safeNavigate(Screen.RuleManagement.route) },
                    onNavigateToMetrics = { navController.safeNavigate(Screen.MetricManagement.route) },
                    onNavigateToLogs = { navController.safeNavigate(Screen.SystemLogs.route) },
                    onLogout = { navController.clearTo(Screen.GetStarted.route) }
                )
            }
        }

        composable(
            route = Screen.UserManagement.route,
            arguments = listOf(
                navArgument("role") { type = NavType.StringType; defaultValue = "all" },
                navArgument("status") { type = NavType.StringType; defaultValue = "all" }
            )
        ) { entry ->
            AdminOnly(navController) {
                val role = entry.arguments?.getString("role")?.takeUnless { it == "all" }
                    ?.let { runCatching { UserRole.valueOf(it) }.getOrNull() }
                val status = entry.arguments?.getString("status")?.takeUnless { it == "all" }
                    ?.let { runCatching { UserAccountStatus.valueOf(it) }.getOrNull() }
                UserManagementScreen(
                    onNavigateBack = { navController.popBackStack() },
                    initialRole = role,
                    initialStatus = status
                )
            }
        }

        composable(Screen.AdminRubrics.route) {
            AdminOnly(navController) {
                RubricAdminScreen(onNavigateBack = { navController.popBackStack() })
            }
        }

        composable(Screen.RuleManagement.route) {
            AdminOnly(navController) {
                RuleManagementScreen(onNavigateBack = { navController.popBackStack() })
            }
        }

        composable(Screen.MetricManagement.route) {
            AdminOnly(navController) {
                MetricManagementScreen(onNavigateBack = { navController.popBackStack() })
            }
        }

        composable(Screen.SystemLogs.route) {
            AdminOnly(navController) {
                SystemLogsScreen(onNavigateBack = { navController.popBackStack() })
            }
        }
    }
}

@Composable
private fun StudentOnly(
    navController: NavHostController,
    content: @Composable () -> Unit
) {
    RoleGuard(
        requiredRole = UserRole.STUDENT,
        onDenied = { role ->
            val destination = when (role) {
                UserRole.STUDENT -> Screen.StudentDashboard.route
                UserRole.LECTURER -> Screen.LecturerDashboard.route
                UserRole.ADMIN -> Screen.AdminDashboard.route
                null -> Screen.GetStarted.route
            }
            navController.clearTo(destination)
        },
        content = content
    )
}

@Composable
private fun LecturerOnly(
    navController: NavHostController,
    content: @Composable () -> Unit
) {
    RoleGuard(
        requiredRole = UserRole.LECTURER,
        onDenied = { role ->
            val destination = when (role) {
                UserRole.STUDENT -> Screen.StudentDashboard.route
                UserRole.ADMIN -> Screen.AdminDashboard.route
                UserRole.LECTURER -> Screen.LecturerDashboard.route
                null -> Screen.GetStarted.route
            }
            navController.clearTo(destination)
        },
        content = content
    )
}

@Composable
private fun AdminOnly(
    navController: NavHostController,
    content: @Composable () -> Unit
) {
    RoleGuard(
        requiredRole = UserRole.ADMIN,
        onDenied = { role ->
            val destination = when (role) {
                UserRole.STUDENT -> Screen.StudentDashboard.route
                UserRole.LECTURER -> Screen.LecturerDashboard.route
                UserRole.ADMIN -> Screen.AdminDashboard.route
                null -> Screen.GetStarted.route
            }
            navController.clearTo(destination)
        },
        content = content
    )
}

private fun NavHostController.safeNavigate(route: String) {
    navigate(route) { launchSingleTop = true }
}

private fun NavHostController.clearTo(route: String) {
    navigate(route) {
        popUpTo(0) { inclusive = true }
        launchSingleTop = true
    }
}
