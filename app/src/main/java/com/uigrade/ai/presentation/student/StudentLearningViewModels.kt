package com.uigrade.ai.presentation.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.model.Classroom
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.model.StudentNotification
import com.uigrade.ai.domain.model.StudentProgress
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.usecase.DeleteStudentNotificationUseCase
import com.uigrade.ai.domain.usecase.GetStudentDashboardUseCase
import com.uigrade.ai.domain.usecase.GetStudentNotificationsUseCase
import com.uigrade.ai.domain.usecase.GetStudentProgressUseCase
import com.uigrade.ai.domain.usecase.MarkAllStudentNotificationsReadUseCase
import com.uigrade.ai.domain.usecase.MarkStudentNotificationReadUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class StudentGradeItem(
    val grade: GradingResult,
    val assignment: AssignmentWithStatus?,
    val submission: Submission?
)

data class StudentGradesUiState(
    val grades: List<StudentGradeItem> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class StudentGradesViewModel @Inject constructor(
    private val getStudentDashboardUseCase: GetStudentDashboardUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(StudentGradesUiState())
    val uiState: StateFlow<StudentGradesUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = StudentGradesUiState(isLoading = true)
            getStudentDashboardUseCase().fold(
                onSuccess = { data ->
                    _uiState.value = StudentGradesUiState(
                        grades = data.grades.sortedByDescending { it.gradedAt }.map { grade ->
                            StudentGradeItem(
                                grade = grade,
                                assignment = data.assignments.find { it.assignment.id == grade.assignmentId },
                                submission = data.submissions.find { it.id == grade.submissionId }
                            )
                        },
                        isLoading = false
                    )
                },
                onFailure = { _uiState.value = StudentGradesUiState(isLoading = false, error = it.message) }
            )
        }
    }
}

data class StudentProgressUiState(
    val progress: StudentProgress? = null,
    val assignments: List<AssignmentWithStatus> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class StudentProgressViewModel @Inject constructor(
    private val getStudentProgressUseCase: GetStudentProgressUseCase,
    private val getStudentDashboardUseCase: GetStudentDashboardUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(StudentProgressUiState())
    val uiState: StateFlow<StudentProgressUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = StudentProgressUiState(isLoading = true)
            val progress = getStudentProgressUseCase()
            val dashboard = getStudentDashboardUseCase()
            progress.fold(
                onSuccess = {
                    _uiState.value = StudentProgressUiState(
                        progress = it,
                        assignments = dashboard.getOrNull()?.assignments.orEmpty(),
                        isLoading = false
                    )
                },
                onFailure = { _uiState.value = StudentProgressUiState(isLoading = false, error = it.message) }
            )
        }
    }
}

data class StudentCalendarUiState(
    val assignments: List<AssignmentWithStatus> = emptyList(),
    val filtered: List<AssignmentWithStatus> = emptyList(),
    val classrooms: List<Classroom> = emptyList(),
    val selectedClassId: String? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class StudentCalendarViewModel @Inject constructor(
    private val getStudentDashboardUseCase: GetStudentDashboardUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(StudentCalendarUiState())
    val uiState: StateFlow<StudentCalendarUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            getStudentDashboardUseCase().fold(
                onSuccess = { data ->
                    val assignments = data.assignments.sortedBy { it.assignment.deadline }
                    _uiState.value = StudentCalendarUiState(
                        assignments = assignments,
                        filtered = applyFilter(assignments, _uiState.value.selectedClassId),
                        classrooms = data.classrooms,
                        selectedClassId = _uiState.value.selectedClassId,
                        isLoading = false
                    )
                },
                onFailure = { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
            )
        }
    }

    fun selectClass(classroomId: String?) {
        _uiState.value = _uiState.value.copy(
            selectedClassId = classroomId,
            filtered = applyFilter(_uiState.value.assignments, classroomId)
        )
    }

    private fun applyFilter(list: List<AssignmentWithStatus>, classroomId: String?): List<AssignmentWithStatus> =
        list.filter { classroomId == null || it.assignment.classroomId == classroomId }
}

data class StudentNotificationsUiState(
    val notifications: List<StudentNotification> = emptyList(),
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val busyId: String? = null,
    val message: String? = null,
    val error: String? = null
)

@HiltViewModel
class StudentNotificationsViewModel @Inject constructor(
    private val getStudentNotificationsUseCase: GetStudentNotificationsUseCase,
    private val markStudentNotificationReadUseCase: MarkStudentNotificationReadUseCase,
    private val markAllStudentNotificationsReadUseCase: MarkAllStudentNotificationsReadUseCase,
    private val deleteStudentNotificationUseCase: DeleteStudentNotificationUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(StudentNotificationsUiState())
    val uiState: StateFlow<StudentNotificationsUiState> = _uiState.asStateFlow()

    init { load() }

    fun load(refresh: Boolean = false) {
        if (_uiState.value.isRefreshing) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = !refresh && _uiState.value.notifications.isEmpty(),
                isRefreshing = refresh,
                error = null
            )
            getStudentNotificationsUseCase().fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        notifications = it,
                        isLoading = false,
                        isRefreshing = false
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        error = it.message ?: "Không thể tải thông báo."
                    )
                }
            )
        }
    }

    fun open(notification: StudentNotification, onReady: (StudentNotification) -> Unit) {
        if (_uiState.value.busyId != null) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(busyId = notification.id, error = null)
            val result = if (notification.isRead) Result.success(notification)
            else markStudentNotificationReadUseCase(notification.id)
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(busyId = null)
                    onReady(it)
                    load(refresh = true)
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(busyId = null, error = it.message)
                }
            )
        }
    }

    fun markAllRead() {
        if (_uiState.value.busyId != null) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(busyId = "all")
            markAllStudentNotificationsReadUseCase().fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(busyId = null, message = "Đã đánh dấu tất cả là đã đọc.")
                    load(refresh = true)
                },
                onFailure = { _uiState.value = _uiState.value.copy(busyId = null, error = it.message) }
            )
        }
    }

    fun delete(notificationId: String) {
        if (_uiState.value.busyId != null) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(busyId = notificationId)
            deleteStudentNotificationUseCase(notificationId).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(busyId = null, message = "Đã xóa thông báo.")
                    load(refresh = true)
                },
                onFailure = { _uiState.value = _uiState.value.copy(busyId = null, error = it.message) }
            )
        }
    }

    fun reportMissingTarget() {
        _uiState.value = _uiState.value.copy(message = "Nội dung liên quan không còn tồn tại.")
    }

    fun consumeMessage() { _uiState.value = _uiState.value.copy(message = null, error = null) }
}
