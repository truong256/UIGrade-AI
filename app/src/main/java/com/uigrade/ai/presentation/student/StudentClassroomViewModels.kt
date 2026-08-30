/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.presentation.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.model.ClassAnnouncement
import com.uigrade.ai.domain.model.Classroom
import com.uigrade.ai.domain.model.ClassroomStatus
import com.uigrade.ai.domain.model.JoinClassResult
import com.uigrade.ai.domain.model.LearningMaterial
import com.uigrade.ai.domain.usecase.CancelStudentJoinRequestUseCase
import com.uigrade.ai.domain.usecase.GetStudentClassroomDataUseCase
import com.uigrade.ai.domain.usecase.GetStudentDashboardUseCase
import com.uigrade.ai.domain.usecase.GetStudentJoinRequestsUseCase
import com.uigrade.ai.domain.usecase.LeaveStudentClassroomUseCase
import com.uigrade.ai.domain.usecase.PreviewJoinClassroomUseCase
import com.uigrade.ai.domain.usecase.RequestStudentJoinClassroomUseCase
import com.uigrade.ai.domain.usecase.StudentJoinRequestItem
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class StudentClassFilter { ALL, ACTIVE, ARCHIVED }
enum class StudentClassSort { NAME, JOINED_RECENTLY }

data class StudentClassroomListUiState(
    val classrooms: List<Classroom> = emptyList(),
    val filtered: List<Classroom> = emptyList(),
    val requests: List<StudentJoinRequestItem> = emptyList(),
    val assignmentCounts: Map<String, Int> = emptyMap(),
    val missingCounts: Map<String, Int> = emptyMap(),
    val searchQuery: String = "",
    val filter: StudentClassFilter = StudentClassFilter.ALL,
    val sort: StudentClassSort = StudentClassSort.JOINED_RECENTLY,
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val leavingClassroomId: String? = null,
    val message: String? = null,
    val error: String? = null
)

@HiltViewModel
class StudentClassroomListViewModel @Inject constructor(
    private val getStudentDashboardUseCase: GetStudentDashboardUseCase,
    private val getStudentJoinRequestsUseCase: GetStudentJoinRequestsUseCase,
    private val leaveStudentClassroomUseCase: LeaveStudentClassroomUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(StudentClassroomListUiState())
    val uiState: StateFlow<StudentClassroomListUiState> = _uiState.asStateFlow()

    init { load() }

    fun load(refresh: Boolean = false) {
        if (_uiState.value.isRefreshing) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = !refresh && _uiState.value.classrooms.isEmpty(),
                isRefreshing = refresh,
                error = null
            )
            val dashboard = getStudentDashboardUseCase()
            val requests = getStudentJoinRequestsUseCase().getOrDefault(emptyList())
            dashboard.fold(
                onSuccess = { data ->
                    val state = _uiState.value.copy(
                        classrooms = data.classrooms,
                        requests = requests,
                        assignmentCounts = data.assignments.groupingBy { it.assignment.classroomId }.eachCount(),
                        missingCounts = data.assignments
                            .filter { it.status == AssignmentStatus.NOT_SUBMITTED || it.status == AssignmentStatus.OVERDUE }
                            .groupingBy { it.assignment.classroomId }
                            .eachCount(),
                        isLoading = false,
                        isRefreshing = false
                    )
                    _uiState.value = state.copy(filtered = applyFilters(state))
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        error = it.message ?: "Không thể tải danh sách lớp. Vui lòng thử lại."
                    )
                }
            )
        }
    }

    fun onSearchChange(query: String) = update { copy(searchQuery = query) }
    fun onFilterChange(filter: StudentClassFilter) = update { copy(filter = filter) }
    fun onSortChange(sort: StudentClassSort) = update { copy(sort = sort) }

    fun leaveClassroom(classroomId: String) {
        if (_uiState.value.leavingClassroomId != null) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(leavingClassroomId = classroomId, error = null)
            leaveStudentClassroomUseCase(classroomId).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        leavingClassroomId = null,
                        message = "Đã rời lớp học. Lịch sử tài khoản của bạn không bị xóa."
                    )
                    load(refresh = true)
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        leavingClassroomId = null,
                        error = it.message ?: "Không thể rời lớp học."
                    )
                }
            )
        }
    }

    fun consumeMessage() { _uiState.value = _uiState.value.copy(message = null, error = null) }

    private fun update(block: StudentClassroomListUiState.() -> StudentClassroomListUiState) {
        val state = _uiState.value.block()
        _uiState.value = state.copy(filtered = applyFilters(state))
    }

    private fun applyFilters(state: StudentClassroomListUiState): List<Classroom> {
        val query = state.searchQuery.trim()
        return state.classrooms.asSequence()
            .filter { classroom ->
                query.isBlank() || classroom.name.contains(query, true) ||
                    classroom.courseCode.contains(query, true) ||
                    classroom.courseName.contains(query, true) ||
                    classroom.lecturerName.contains(query, true)
            }
            .filter { classroom ->
                when (state.filter) {
                    StudentClassFilter.ALL -> true
                    StudentClassFilter.ACTIVE -> classroom.status == ClassroomStatus.ACTIVE
                    StudentClassFilter.ARCHIVED -> classroom.status == ClassroomStatus.ARCHIVED
                }
            }
            .let { sequence ->
                when (state.sort) {
                    StudentClassSort.NAME -> sequence.sortedBy { it.name.lowercase() }
                    StudentClassSort.JOINED_RECENTLY -> sequence.sortedByDescending { it.createdAt }
                }
            }
            .toList()
    }
}

data class JoinClassroomUiState(
    val joinCode: String = "",
    val preview: Classroom? = null,
    val isChecking: Boolean = false,
    val isSubmitting: Boolean = false,
    val outcome: JoinClassResult? = null,
    val error: String? = null
)

@HiltViewModel
class JoinClassroomViewModel @Inject constructor(
    private val previewJoinClassroomUseCase: PreviewJoinClassroomUseCase,
    private val requestStudentJoinClassroomUseCase: RequestStudentJoinClassroomUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(JoinClassroomUiState())
    val uiState: StateFlow<JoinClassroomUiState> = _uiState.asStateFlow()

    fun onCodeChange(code: String) {
        val normalized = code.uppercase().filter(Char::isLetterOrDigit).take(8)
        _uiState.value = _uiState.value.copy(joinCode = normalized, preview = null, outcome = null, error = null)
    }

    fun preview() {
        if (_uiState.value.isChecking || _uiState.value.isSubmitting) return
        if (_uiState.value.joinCode.isBlank()) {
            _uiState.value = _uiState.value.copy(error = "Vui lòng nhập mã lớp.")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isChecking = true, error = null)
            previewJoinClassroomUseCase(_uiState.value.joinCode).fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isChecking = false, preview = it) },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isChecking = false,
                        preview = null,
                        error = it.message ?: "Không thể kiểm tra mã lớp. Vui lòng thử lại."
                    )
                }
            )
        }
    }

    fun confirmJoin() {
        if (_uiState.value.isSubmitting || _uiState.value.preview == null) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            requestStudentJoinClassroomUseCase(_uiState.value.joinCode).fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isSubmitting = false, outcome = it) },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        error = it.message ?: "Không thể gửi yêu cầu tham gia. Vui lòng thử lại."
                    )
                }
            )
        }
    }

    fun clearError() { _uiState.value = _uiState.value.copy(error = null) }
}

data class StudentClassroomDetailUiState(
    val classroom: Classroom? = null,
    val assignments: List<AssignmentWithStatus> = emptyList(),
    val filteredAssignments: List<AssignmentWithStatus> = emptyList(),
    val announcements: List<ClassAnnouncement> = emptyList(),
    val materials: List<LearningMaterial> = emptyList(),
    val searchQuery: String = "",
    val filterStatus: AssignmentStatus? = null,
    val selectedTab: Int = 0,
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class StudentClassroomDetailViewModel @Inject constructor(
    private val getStudentClassroomDataUseCase: GetStudentClassroomDataUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(StudentClassroomDetailUiState())
    val uiState: StateFlow<StudentClassroomDetailUiState> = _uiState.asStateFlow()

    fun load(classroomId: String, refresh: Boolean = false) {
        if (_uiState.value.isRefreshing) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = !refresh && _uiState.value.classroom == null,
                isRefreshing = refresh,
                error = null
            )
            getStudentClassroomDataUseCase(classroomId).fold(
                onSuccess = { data ->
                    val state = _uiState.value.copy(
                        classroom = data.classroom,
                        assignments = data.assignments,
                        announcements = data.announcements,
                        materials = data.materials,
                        isLoading = false,
                        isRefreshing = false
                    )
                    _uiState.value = state.copy(filteredAssignments = filterAssignments(state))
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        error = it.message ?: "Không thể tải lớp học. Vui lòng thử lại."
                    )
                }
            )
        }
    }

    fun selectTab(index: Int) { _uiState.value = _uiState.value.copy(selectedTab = index.coerceIn(0, 3)) }
    fun onSearchChange(query: String) = update { copy(searchQuery = query) }
    fun onFilterChange(status: AssignmentStatus?) = update { copy(filterStatus = status) }

    private fun update(block: StudentClassroomDetailUiState.() -> StudentClassroomDetailUiState) {
        val state = _uiState.value.block()
        _uiState.value = state.copy(filteredAssignments = filterAssignments(state))
    }

    private fun filterAssignments(state: StudentClassroomDetailUiState): List<AssignmentWithStatus> =
        state.assignments.filter { item ->
            (state.searchQuery.isBlank() || item.assignment.title.contains(state.searchQuery, true)) &&
                (state.filterStatus == null || item.status == state.filterStatus)
        }
}

data class StudentJoinRequestsUiState(
    val requests: List<StudentJoinRequestItem> = emptyList(),
    val isLoading: Boolean = true,
    val busyRequestId: String? = null,
    val message: String? = null,
    val error: String? = null
)

@HiltViewModel
class StudentJoinRequestsViewModel @Inject constructor(
    private val getStudentJoinRequestsUseCase: GetStudentJoinRequestsUseCase,
    private val cancelStudentJoinRequestUseCase: CancelStudentJoinRequestUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(StudentJoinRequestsUiState())
    val uiState: StateFlow<StudentJoinRequestsUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            getStudentJoinRequestsUseCase().fold(
                onSuccess = { _uiState.value = _uiState.value.copy(requests = it, isLoading = false) },
                onFailure = { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
            )
        }
    }

    fun cancel(requestId: String) {
        if (_uiState.value.busyRequestId != null) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(busyRequestId = requestId, error = null)
            cancelStudentJoinRequestUseCase(requestId).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(busyRequestId = null, message = "Đã hủy yêu cầu tham gia.")
                    load()
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(busyRequestId = null, error = it.message)
                }
            )
        }
    }

    fun consumeMessage() { _uiState.value = _uiState.value.copy(message = null, error = null) }
}
