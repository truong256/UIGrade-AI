package com.uigrade.ai.presentation.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.model.Classroom
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.model.StudentNotification
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.usecase.GetStudentDashboardUseCase
import com.uigrade.ai.domain.usecase.LogoutUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class StudentDashboardUiState(
    val user: User? = null,
    val classrooms: List<Classroom> = emptyList(),
    val assignments: List<AssignmentWithStatus> = emptyList(),
    val submissions: List<Submission> = emptyList(),
    val grades: List<GradingResult> = emptyList(),
    val notifications: List<StudentNotification> = emptyList(),
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val isLoggingOut: Boolean = false,
    val error: String? = null
) {
    val pendingCount: Int get() = assignments.count {
        it.status == AssignmentStatus.NOT_SUBMITTED || it.status == AssignmentStatus.OVERDUE
    }
    val upcomingCount: Int get() = assignments.count {
        it.status == AssignmentStatus.NOT_SUBMITTED || it.status == AssignmentStatus.UPCOMING
    }
    val submittedCount: Int get() = assignments.count {
        it.status in setOf(
            AssignmentStatus.SUBMITTED,
            AssignmentStatus.LATE,
            AssignmentStatus.GRADING,
            AssignmentStatus.GRADED,
            AssignmentStatus.RESUBMISSION_REQUIRED
        )
    }
    val gradedCount: Int get() = assignments.count { it.status == AssignmentStatus.GRADED }
    val unreadCount: Int get() = notifications.count { !it.isRead }
    val averagePercent: Float? get() {
        val valid = grades.mapNotNull { grade ->
            grade.maxScore.takeIf { it > 0 }?.let {
                (grade.totalScore.coerceIn(0, it) * 100f / it).takeIf(Float::isFinite)
            }
        }
        return valid.takeIf { it.isNotEmpty() }?.average()?.toFloat()
    }
}

@HiltViewModel
class StudentDashboardViewModel @Inject constructor(
    private val getStudentDashboardUseCase: GetStudentDashboardUseCase,
    private val logoutUseCase: LogoutUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(StudentDashboardUiState())
    val uiState: StateFlow<StudentDashboardUiState> = _uiState.asStateFlow()

    init { load() }

    fun load(refresh: Boolean = false) {
        if (_uiState.value.isRefreshing || (_uiState.value.isLoading && refresh)) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = !refresh && _uiState.value.user == null,
                isRefreshing = refresh,
                error = null
            )
            getStudentDashboardUseCase().fold(
                onSuccess = { data ->
                    _uiState.value = _uiState.value.copy(
                        user = data.user,
                        classrooms = data.classrooms,
                        assignments = data.assignments,
                        submissions = data.submissions,
                        grades = data.grades,
                        notifications = data.notifications,
                        isLoading = false,
                        isRefreshing = false
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        error = error.message ?: "Không thể tải dashboard. Vui lòng thử lại."
                    )
                }
            )
        }
    }

    fun logout(onDone: () -> Unit) {
        if (_uiState.value.isLoggingOut) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoggingOut = true)
            runCatching { logoutUseCase() }
                .onSuccess { onDone() }
                .onFailure {
                    _uiState.value = _uiState.value.copy(
                        isLoggingOut = false,
                        error = "Không thể đăng xuất. Vui lòng thử lại."
                    )
                }
        }
    }
}
