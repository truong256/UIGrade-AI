package com.uigrade.ai.presentation.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.model.ClassMembership
import com.uigrade.ai.domain.model.Classroom
import com.uigrade.ai.domain.usecase.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

// ─── Student Classroom List VM ────────────────────────────────────────────────

data class StudentClassroomListUiState(
    val classrooms: List<Classroom> = emptyList(),
    val filtered: List<Classroom> = emptyList(),
    val searchQuery: String = "",
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class StudentClassroomListViewModel @Inject constructor(
    private val getStudentClassroomsUseCase: GetStudentClassroomsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(StudentClassroomListUiState())
    val uiState: StateFlow<StudentClassroomListUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val list = getStudentClassroomsUseCase()
                _uiState.value = _uiState.value.copy(
                    classrooms = list,
                    filtered = applySearch(list, _uiState.value.searchQuery),
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun onSearchChange(query: String) {
        val filtered = applySearch(_uiState.value.classrooms, query)
        _uiState.value = _uiState.value.copy(searchQuery = query, filtered = filtered)
    }

    private fun applySearch(list: List<Classroom>, query: String): List<Classroom> {
        if (query.isBlank()) return list
        return list.filter {
            it.name.contains(query, ignoreCase = true) ||
                    it.courseCode.contains(query, ignoreCase = true) ||
                    it.lecturerName.contains(query, ignoreCase = true)
        }
    }
}

// ─── Join Classroom VM ────────────────────────────────────────────────────────

data class JoinClassroomUiState(
    val joinCode: String = "",
    val isLoading: Boolean = false,
    val joinedMembership: ClassMembership? = null,
    val joinedClassroomId: String? = null,
    val successMessage: String? = null,
    val error: String? = null
)

@HiltViewModel
class JoinClassroomViewModel @Inject constructor(
    private val joinClassroomUseCase: JoinClassroomUseCase,
    private val classroomRepository: com.uigrade.ai.domain.repository.ClassroomRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(JoinClassroomUiState())
    val uiState: StateFlow<JoinClassroomUiState> = _uiState.asStateFlow()

    fun onCodeChange(code: String) {
        val sanitized = code.uppercase().filter { it.isLetterOrDigit() }.take(8)
        _uiState.value = _uiState.value.copy(joinCode = sanitized, error = null)
    }

    fun joinClassroom(onSuccess: (classroomId: String) -> Unit) {
        val code = _uiState.value.joinCode.trim().uppercase()
        if (code.isBlank()) {
            _uiState.value = _uiState.value.copy(error = "Mã tham gia không hợp lệ")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = joinClassroomUseCase(code)
            result.fold(
                onSuccess = { membership ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        joinedMembership = membership,
                        joinedClassroomId = membership.classroomId,
                        successMessage = "Bạn đã tham gia lớp học thành công"
                    )
                    onSuccess(membership.classroomId)
                },
                onFailure = { err ->
                    val msg = when {
                        err.message?.contains("Không tìm thấy") == true -> "Không tìm thấy lớp học"
                        err.message?.contains("lưu trữ") == true -> "Lớp học này đã được lưu trữ"
                        err.message?.contains("đã tham gia") == true -> "Bạn đã tham gia lớp học này"
                        err.message?.contains("Mã tham gia") == true -> "Mã tham gia không hợp lệ"
                        else -> err.message ?: "Không thể tham gia lớp học. Vui lòng thử lại"
                    }
                    _uiState.value = _uiState.value.copy(isLoading = false, error = msg)
                }
            )
        }
    }

    fun clearError() { _uiState.value = _uiState.value.copy(error = null) }
}

// ─── Student Classroom Detail VM ──────────────────────────────────────────────

data class StudentClassroomDetailUiState(
    val classroom: Classroom? = null,
    val assignments: List<AssignmentWithStatus> = emptyList(),
    val filteredAssignments: List<AssignmentWithStatus> = emptyList(),
    val searchQuery: String = "",
    val filterStatus: com.uigrade.ai.domain.model.AssignmentStatus? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class StudentClassroomDetailViewModel @Inject constructor(
    private val getClassroomByIdUseCase: GetClassroomByIdUseCase,
    private val getAssignmentsForStudentInClassroomUseCase: GetAssignmentsForStudentInClassroomUseCase,
    private val authRepository: com.uigrade.ai.domain.repository.AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(StudentClassroomDetailUiState())
    val uiState: StateFlow<StudentClassroomDetailUiState> = _uiState.asStateFlow()

    fun load(classroomId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val classroom = getClassroomByIdUseCase(classroomId)
                val user = authRepository.getCurrentUser()
                val assignments = if (user != null) {
                    getAssignmentsForStudentInClassroomUseCase(user.id, classroomId)
                } else emptyList()

                _uiState.value = _uiState.value.copy(
                    classroom = classroom,
                    assignments = assignments,
                    filteredAssignments = applyFilters(assignments, _uiState.value.searchQuery, _uiState.value.filterStatus),
                    isLoading = false,
                    error = if (classroom == null) "Không tìm thấy lớp học" else null
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun onSearchChange(query: String) {
        val filtered = applyFilters(_uiState.value.assignments, query, _uiState.value.filterStatus)
        _uiState.value = _uiState.value.copy(searchQuery = query, filteredAssignments = filtered)
    }

    fun onFilterChange(status: com.uigrade.ai.domain.model.AssignmentStatus?) {
        val filtered = applyFilters(_uiState.value.assignments, _uiState.value.searchQuery, status)
        _uiState.value = _uiState.value.copy(filterStatus = status, filteredAssignments = filtered)
    }

    private fun applyFilters(
        list: List<AssignmentWithStatus>,
        query: String,
        status: com.uigrade.ai.domain.model.AssignmentStatus?
    ): List<AssignmentWithStatus> {
        var res = list
        if (query.isNotBlank()) {
            res = res.filter { it.assignment.title.contains(query, ignoreCase = true) || it.assignment.description.contains(query, ignoreCase = true) }
        }
        if (status != null) {
            res = res.filter { it.status == status }
        }
        return res
    }
}
