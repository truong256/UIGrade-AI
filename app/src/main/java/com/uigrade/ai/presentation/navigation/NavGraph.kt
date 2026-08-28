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
import com.uigrade.ai.presentation.student.AssignmentDetailScreen
import com.uigrade.ai.presentation.student.AssignmentListScreen
import com.uigrade.ai.presentation.student.GradingResultScreen
import com.uigrade.ai.presentation.student.JoinClassroomScreen
import com.uigrade.ai.presentation.student.StudentClassroomDetailScreen
import com.uigrade.ai.presentation.student.StudentClassroomListScreen
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
                onNavigateToClassrooms = { navController.navigate(Screen.StudentClassrooms.route) },
                onNavigateToClassroom = { id -> navController.navigate(Screen.StudentClassroomDetail.createRoute(id)) },
                onNavigateToJoinClassroom = { navController.navigate(Screen.JoinClassroom.route) },
                onNavigateToProfile = { navController.navigate(Screen.StudentProfile.route) },
                onLogout = {
                    navController.navigate(Screen.GetStarted.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.StudentClassrooms.route) {
            StudentClassroomListScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToJoinClassroom = { navController.navigate(Screen.JoinClassroom.route) },
                onNavigateToClassroomDetail = { id -> navController.navigate(Screen.StudentClassroomDetail.createRoute(id)) }
            )
        }

        composable(Screen.JoinClassroom.route) {
            JoinClassroomScreen(
                onNavigateBack = { navController.popBackStack() },
                onJoinSuccess = { classroomId ->
                    navController.navigate(Screen.StudentClassroomDetail.createRoute(classroomId)) {
                        popUpTo(Screen.StudentClassrooms.route) { inclusive = false }
                    }
                }
            )
        }

        composable(
            route = Screen.StudentClassroomDetail.route,
            arguments = listOf(navArgument("classroomId") { type = NavType.StringType })
        ) { backStack ->
            val classroomId = backStack.arguments?.getString("classroomId") ?: return@composable
            StudentClassroomDetailScreen(
                classroomId = classroomId,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToAssignment = { assignmentId ->
                    navController.navigate(Screen.AssignmentDetail.createRoute(assignmentId))
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

private fun NavHostController.safeNavigate(route: String) {
    navigate(route) { launchSingleTop = true }
}

private fun NavHostController.clearTo(route: String) {
    navigate(route) {
        popUpTo(0) { inclusive = true }
        launchSingleTop = true
    }
}
