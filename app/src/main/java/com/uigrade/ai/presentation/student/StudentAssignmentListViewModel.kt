package com.uigrade.ai.presentation.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.usecase.GetSecureStudentAssignmentsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import java.time.LocalDateTime
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class StudentAssignmentFilter {
    ALL,
    MISSING,
    UPCOMING,
    DRAFT,
    SUBMITTED,
    GRADED,
    OVERDUE
}

enum class StudentAssignmentSort { DEADLINE, ASSIGNED_DATE, TITLE }

data class StudentAssignmentListUiState(
    val assignments: List<AssignmentWithStatus> = emptyList(),
    val filtered: List<AssignmentWithStatus> = emptyList(),
    val query: String = "",
    val classId: String? = null,
    val filter: StudentAssignmentFilter = StudentAssignmentFilter.ALL,
    val sort: StudentAssignmentSort = StudentAssignmentSort.DEADLINE,
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class StudentAssignmentListViewModel @Inject constructor(
    private val getSecureStudentAssignmentsUseCase: GetSecureStudentAssignmentsUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(StudentAssignmentListUiState())
    val uiState: StateFlow<StudentAssignmentListUiState> = _uiState.asStateFlow()
    private var initialFilterApplied = false

    init { load() }

    fun applyInitialFilter(value: String?) {
        if (initialFilterApplied) return
        initialFilterApplied = true
        val filter = when (value?.lowercase()) {
            "missing" -> StudentAssignmentFilter.MISSING
            "upcoming" -> StudentAssignmentFilter.UPCOMING
            "submitted" -> StudentAssignmentFilter.SUBMITTED
            "graded" -> StudentAssignmentFilter.GRADED
            "draft" -> StudentAssignmentFilter.DRAFT
            else -> StudentAssignmentFilter.ALL
        }
        update { copy(filter = filter) }
    }

    fun load(refresh: Boolean = false) {
        if (_uiState.value.isRefreshing) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = !refresh && _uiState.value.assignments.isEmpty(),
                isRefreshing = refresh,
                error = null
            )
            getSecureStudentAssignmentsUseCase().fold(
                onSuccess = { assignments ->
                    val state = _uiState.value.copy(
                        assignments = assignments,
                        isLoading = false,
                        isRefreshing = false
                    )
                    _uiState.value = state.copy(filtered = filter(state))
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        error = it.message ?: "Không thể tải danh sách bài tập. Vui lòng thử lại."
                    )
                }
            )
        }
    }

    fun onQueryChange(value: String) = update { copy(query = value) }
    fun onClassChange(value: String?) = update { copy(classId = value) }
    fun onFilterChange(value: StudentAssignmentFilter) = update { copy(filter = value) }
    fun onSortChange(value: StudentAssignmentSort) = update { copy(sort = value) }

    private fun update(block: StudentAssignmentListUiState.() -> StudentAssignmentListUiState) {
        val state = _uiState.value.block()
        _uiState.value = state.copy(filtered = filter(state))
    }

    private fun filter(state: StudentAssignmentListUiState): List<AssignmentWithStatus> {
        val now = LocalDateTime.now()
        return state.assignments.asSequence()
            .filter {
                state.query.isBlank() || it.assignment.title.contains(state.query, true) ||
                    it.assignment.description.contains(state.query, true) ||
                    it.assignment.courseName.contains(state.query, true)
            }
            .filter { state.classId == null || it.assignment.classroomId == state.classId }
            .filter { item ->
                when (state.filter) {
                    StudentAssignmentFilter.ALL -> true
                    StudentAssignmentFilter.MISSING -> item.status == AssignmentStatus.NOT_SUBMITTED || item.status == AssignmentStatus.OVERDUE
                    StudentAssignmentFilter.UPCOMING -> item.status in setOf(AssignmentStatus.UPCOMING, AssignmentStatus.NOT_SUBMITTED) &&
                        !item.assignment.deadline.isAfter(now.plusDays(7))
                    StudentAssignmentFilter.DRAFT -> item.status == AssignmentStatus.DRAFT
                    StudentAssignmentFilter.SUBMITTED -> item.status in setOf(
                        AssignmentStatus.SUBMITTED,
                        AssignmentStatus.LATE,
                        AssignmentStatus.GRADING,
                        AssignmentStatus.RESUBMISSION_REQUIRED
                    )
                    StudentAssignmentFilter.GRADED -> item.status == AssignmentStatus.GRADED
                    StudentAssignmentFilter.OVERDUE -> item.status in setOf(AssignmentStatus.OVERDUE, AssignmentStatus.CLOSED)
                }
            }
            .let { sequence ->
                when (state.sort) {
                    StudentAssignmentSort.DEADLINE -> sequence.sortedBy { it.assignment.deadline }
                    StudentAssignmentSort.ASSIGNED_DATE -> sequence.sortedByDescending { it.assignment.createdAt }
                    StudentAssignmentSort.TITLE -> sequence.sortedBy { it.assignment.title.lowercase() }
                }
            }
            .toList()
    }
}
