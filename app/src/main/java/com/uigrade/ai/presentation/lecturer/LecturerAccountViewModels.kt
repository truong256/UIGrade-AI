/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.presentation.lecturer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.model.LecturerNotification
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.model.SubmissionStatus
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.usecase.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LecturerNotificationsUiState(
    val notifications: List<LecturerNotification> = emptyList(),
    val isLoading: Boolean = true,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val message: String? = null
)

@HiltViewModel
class LecturerNotificationsViewModel @Inject constructor(
    private val getNotifications: GetLecturerNotificationsUseCase,
    private val markRead: MarkLecturerNotificationReadUseCase,
    private val markAllReadUseCase: MarkAllLecturerNotificationsReadUseCase,
    private val deleteNotification: DeleteLecturerNotificationUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(LecturerNotificationsUiState())
    val uiState: StateFlow<LecturerNotificationsUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            getNotifications().fold(
                onSuccess = { _uiState.value = LecturerNotificationsUiState(notifications = it, isLoading = false) },
                onFailure = {
                    _uiState.value = LecturerNotificationsUiState(
                        isLoading = false,
                        error = it.message ?: "Không thể tải thông báo. Vui lòng thử lại."
                    )
                }
            )
        }
    }

    fun open(notification: LecturerNotification, onOpen: (LecturerNotification) -> Unit) {
        if (notification.isRead) {
            onOpen(notification)
            return
        }
        viewModelScope.launch {
            markRead(notification.id).fold(
                onSuccess = { updated ->
                    _uiState.value = _uiState.value.copy(
                        notifications = _uiState.value.notifications.map {
                            if (it.id == updated.id) updated else it
                        }
                    )
                    onOpen(updated)
                },
                onFailure = { _uiState.value = _uiState.value.copy(error = it.message) }
            )
        }
    }

    fun markAllRead() {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true)
            markAllReadUseCase().fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        notifications = _uiState.value.notifications.map { it.copy(isRead = true) },
                        isSubmitting = false,
                        message = "Đã đánh dấu tất cả là đã đọc."
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message)
                }
            )
        }
    }

    fun delete(id: String) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true)
            deleteNotification(id).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        notifications = _uiState.value.notifications.filterNot { it.id == id },
                        isSubmitting = false,
                        message = "Đã xóa thông báo."
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message)
                }
            )
        }
    }

    fun consumeMessage() { _uiState.value = _uiState.value.copy(message = null, error = null) }
}

data class LecturerProfileUiState(
    val user: User? = null,
    val isLoading: Boolean = true,
    val isSubmitting: Boolean = false,
    val saved: Boolean = false,
    val error: String? = null,
    val message: String? = null
)

@HiltViewModel
class LecturerProfileViewModel @Inject constructor(
    private val getCurrentUser: GetCurrentUserUseCase,
    private val updateProfile: UpdateLecturerProfileUseCase,
    private val changePasswordUseCase: ChangePasswordUseCase,
    private val logoutUseCase: LogoutUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(LecturerProfileUiState())
    val uiState: StateFlow<LecturerProfileUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = LecturerProfileUiState(isLoading = true)
            runCatching { getCurrentUser() }.fold(
                onSuccess = {
                    _uiState.value = LecturerProfileUiState(
                        user = it,
                        isLoading = false,
                        error = if (it == null) "Bạn chưa đăng nhập" else null
                    )
                },
                onFailure = { _uiState.value = LecturerProfileUiState(isLoading = false, error = it.message) }
            )
        }
    }

    fun save(
        name: String,
        phone: String,
        department: String,
        organization: String,
        bio: String,
        avatarUrl: String?
    ) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            updateProfile(name, phone, department, organization, bio, avatarUrl).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        user = it,
                        isSubmitting = false,
                        saved = true,
                        message = "Đã cập nhật hồ sơ."
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message)
                }
            )
        }
    }

    fun changePassword(current: String, new: String, confirm: String) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            changePasswordUseCase(current, new, confirm).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        message = "Đã đổi mật khẩu."
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message)
                }
            )
        }
    }

    fun logout(onDone: () -> Unit) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true)
            logoutUseCase()
            onDone()
        }
    }

    fun consumeMessage() { _uiState.value = _uiState.value.copy(message = null, error = null, saved = false) }
}

data class StudentProgressItem(
    val id: String,
    val name: String,
    val submitted: Int,
    val totalAssignments: Int,
    val averageScore: Float?
)

data class AssignmentAnalyticsItem(
    val id: String,
    val title: String,
    val submitted: Int,
    val expected: Int,
    val averageScore: Float?
)

data class CriterionAnalyticsItem(
    val name: String,
    val averagePercent: Float,
    val gradedCount: Int
)

data class LecturerAnalyticsUiState(
    val averageScore: Float = 0f,
    val highestScore: Float = 0f,
    val lowestScore: Float = 0f,
    val submissionRate: Float = 0f,
    val onTimeRate: Float = 0f,
    val missingCount: Int = 0,
    val ungradedCount: Int = 0,
    val gradeDistribution: Map<String, Int> = emptyMap(),
    val studentProgress: List<StudentProgressItem> = emptyList(),
    val assignmentResults: List<AssignmentAnalyticsItem> = emptyList(),
    val criterionResults: List<CriterionAnalyticsItem> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class LecturerAnalyticsViewModel @Inject constructor(
    private val getCurrentUser: GetCurrentUserUseCase,
    private val getAssignments: GetAssignmentsForLecturerUseCase,
    private val getSubmissions: GetAllSubmissionsUseCase,
    private val getResults: GetAllGradingResultsUseCase,
    private val getClassrooms: GetLecturerClassroomsUseCase,
    private val getStudents: GetClassroomStudentsUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(LecturerAnalyticsUiState())
    val uiState: StateFlow<LecturerAnalyticsUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = LecturerAnalyticsUiState(isLoading = true)
            runCatching {
                val user = getCurrentUser() ?: error("Bạn chưa đăng nhập")
                val assignments = getAssignments(user.id).filterNot { it.isArchived }
                val assignmentIds = assignments.map { it.id }.toSet()
                val submissions = getSubmissions().filter { it.assignmentId in assignmentIds }
                val results = getResults().filter { it.assignmentId in assignmentIds }
                val classrooms = getClassrooms()
                val studentsByClass = classrooms.associate { classroom ->
                    classroom.id to getStudents(classroom.id)
                }
                buildAnalytics(assignments, submissions, results, studentsByClass)
            }.fold(
                onSuccess = { _uiState.value = it },
                onFailure = {
                    _uiState.value = LecturerAnalyticsUiState(
                        isLoading = false,
                        error = it.message ?: "Không thể tải thống kê. Vui lòng thử lại."
                    )
                }
            )
        }
    }

    private fun buildAnalytics(
        assignments: List<com.uigrade.ai.domain.model.Assignment>,
        submissions: List<Submission>,
        results: List<GradingResult>,
        studentsByClass: Map<String, List<User>>
    ): LecturerAnalyticsUiState {
        val percentages = results.filter { it.maxScore > 0 }.map { it.percentage * 100f }
        val possibleSubmissions = assignments.sumOf { assignment ->
            studentsByClass[assignment.classroomId]?.size ?: 0
        }
        val submittedPairs = submissions.map { it.assignmentId to it.studentId }.toSet().size
        val onTimeCount = submissions.count { !it.isLate }
        val ungraded = submissions.count {
            it.status in setOf(
                SubmissionStatus.PENDING,
                SubmissionStatus.SUBMITTED,
                SubmissionStatus.LATE,
                SubmissionStatus.GRADING
            )
        }
        val resultByStudent = results.groupBy { it.studentId }
        val allStudents = studentsByClass.values.flatten().distinctBy { it.id }
        val progress = allStudents.map { student ->
            val studentSubmissions = submissions.count { it.studentId == student.id }
            val studentScores = resultByStudent[student.id].orEmpty().filter { it.maxScore > 0 }
            StudentProgressItem(
                id = student.id,
                name = student.name,
                submitted = studentSubmissions,
                totalAssignments = assignments.count { assignment ->
                    studentsByClass[assignment.classroomId].orEmpty().any { it.id == student.id }
                },
                averageScore = studentScores.takeIf { it.isNotEmpty() }
                    ?.map { it.percentage * 100f }
                    ?.average()
                    ?.toFloat()
            )
        }.sortedBy { it.name }
        val distribution = linkedMapOf(
            "90–100" to percentages.count { it >= 90f },
            "80–89" to percentages.count { it in 80f..<90f },
            "65–79" to percentages.count { it in 65f..<80f },
            "50–64" to percentages.count { it in 50f..<65f },
            "Dưới 50" to percentages.count { it < 50f }
        )
        val assignmentResults = assignments.map { assignment ->
            val assignmentSubmissions = submissions.filter { it.assignmentId == assignment.id }
            val assignmentScores = results.filter { it.assignmentId == assignment.id && it.maxScore > 0 }
                .map { it.percentage * 100f }
            AssignmentAnalyticsItem(
                id = assignment.id,
                title = assignment.title,
                submitted = assignmentSubmissions.map { it.studentId }.distinct().size,
                expected = studentsByClass[assignment.classroomId]?.size ?: 0,
                averageScore = assignmentScores.takeIf { it.isNotEmpty() }?.average()?.toFloat()
            )
        }
        val criterionResults = results.flatMap { it.criteriaScores }
            .filter { it.maxScore > 0 }
            .groupBy { it.criterionName }
            .map { (name, scores) ->
                CriterionAnalyticsItem(
                    name = name,
                    averagePercent = scores.map { it.earned * 100f / it.maxScore }.average().toFloat(),
                    gradedCount = scores.size
                )
            }
            .sortedBy { it.name }
        return LecturerAnalyticsUiState(
            averageScore = percentages.takeIf { it.isNotEmpty() }?.average()?.toFloat() ?: 0f,
            highestScore = percentages.maxOrNull() ?: 0f,
            lowestScore = percentages.minOrNull() ?: 0f,
            submissionRate = if (possibleSubmissions == 0) 0f else submittedPairs * 100f / possibleSubmissions,
            onTimeRate = if (submissions.isEmpty()) 0f else onTimeCount * 100f / submissions.size,
            missingCount = (possibleSubmissions - submittedPairs).coerceAtLeast(0),
            ungradedCount = ungraded,
            gradeDistribution = distribution,
            studentProgress = progress,
            assignmentResults = assignmentResults,
            criterionResults = criterionResults,
            isLoading = false
        )
    }
}
