package com.uigrade.ai.presentation.lecturer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.*
import com.uigrade.ai.domain.usecase.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

// ─── Classroom List VM ────────────────────────────────────────────────────────

data class ClassroomListUiState(
    val classrooms: List<Classroom> = emptyList(),
    val filtered: List<Classroom> = emptyList(),
    val searchQuery: String = "",
    val filterStatus: ClassroomStatus? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class LecturerClassroomListViewModel @Inject constructor(
    private val getLecturerClassroomsUseCase: GetLecturerClassroomsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(ClassroomListUiState())
    val uiState: StateFlow<ClassroomListUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val classrooms = getLecturerClassroomsUseCase()
                _uiState.value = _uiState.value.copy(
                    classrooms = classrooms,
                    filtered = applyFilter(classrooms, _uiState.value.searchQuery, _uiState.value.filterStatus),
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun onSearchChange(query: String) {
        val filtered = applyFilter(_uiState.value.classrooms, query, _uiState.value.filterStatus)
        _uiState.value = _uiState.value.copy(searchQuery = query, filtered = filtered)
    }

    fun onFilterChange(status: ClassroomStatus?) {
        val filtered = applyFilter(_uiState.value.classrooms, _uiState.value.searchQuery, status)
        _uiState.value = _uiState.value.copy(filterStatus = status, filtered = filtered)
    }

    private fun applyFilter(
        list: List<Classroom>,
        query: String,
        status: ClassroomStatus?
    ): List<Classroom> {
        var result = list
        if (query.isNotBlank()) {
            result = result.filter {
                it.name.contains(query, ignoreCase = true) ||
                        it.courseCode.contains(query, ignoreCase = true)
            }
        }
        if (status != null) result = result.filter { it.status == status }
        return result
    }
}

// ─── Create Classroom VM ──────────────────────────────────────────────────────

data class CreateClassroomUiState(
    val isLoading: Boolean = false,
    val success: Classroom? = null,
    val error: String? = null
)

@HiltViewModel
class CreateClassroomViewModel @Inject constructor(
    private val createClassroomUseCase: CreateClassroomUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(CreateClassroomUiState())
    val uiState: StateFlow<CreateClassroomUiState> = _uiState.asStateFlow()

    fun create(name: String, courseCode: String, description: String, semester: String) {
        viewModelScope.launch {
            _uiState.value = CreateClassroomUiState(isLoading = true)
            val result = createClassroomUseCase(name, courseCode, description, semester)
            result.fold(
                onSuccess = { _uiState.value = CreateClassroomUiState(success = it) },
                onFailure = { _uiState.value = CreateClassroomUiState(error = it.message) }
            )
        }
    }

    fun clearError() { _uiState.value = _uiState.value.copy(error = null) }
}

// ─── Classroom Detail VM ──────────────────────────────────────────────────────

data class ClassroomDetailUiState(
    val classroom: Classroom? = null,
    val assignments: List<Assignment> = emptyList(),
    val studentCount: Int = 0,
    val isLoading: Boolean = true,
    val error: String? = null,
    val snackbarMessage: String? = null,
    val joinCodeRegenerated: Boolean = false
)

@HiltViewModel
class ClassroomDetailViewModel @Inject constructor(
    private val getClassroomByIdUseCase: GetClassroomByIdUseCase,
    private val getAllAssignmentsForClassroomUseCase: GetAllAssignmentsForClassroomUseCase,
    private val getClassroomStudentsUseCase: GetClassroomStudentsUseCase,
    private val regenerateJoinCodeUseCase: RegenerateJoinCodeUseCase,
    private val archiveClassroomUseCase: ArchiveClassroomUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(ClassroomDetailUiState())
    val uiState: StateFlow<ClassroomDetailUiState> = _uiState.asStateFlow()

    fun load(classroomId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val classroom = getClassroomByIdUseCase(classroomId)
                val assignments = getAllAssignmentsForClassroomUseCase(classroomId)
                val students = getClassroomStudentsUseCase(classroomId)
                _uiState.value = _uiState.value.copy(
                    classroom = classroom,
                    assignments = assignments,
                    studentCount = students.size,
                    isLoading = false,
                    error = if (classroom == null) "Không tìm thấy lớp học" else null
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun regenerateJoinCode(classroomId: String) {
        viewModelScope.launch {
            val result = regenerateJoinCodeUseCase(classroomId)
            result.fold(
                onSuccess = { newCode ->
                    val updated = _uiState.value.classroom?.copy(joinCode = newCode)
                    _uiState.value = _uiState.value.copy(
                        classroom = updated,
                        snackbarMessage = "Đã tạo mã tham gia mới: $newCode",
                        joinCodeRegenerated = true
                    )
                },
                onFailure = { _uiState.value = _uiState.value.copy(snackbarMessage = it.message) }
            )
        }
    }

    fun archiveClassroom(classroomId: String, onDone: () -> Unit) {
        viewModelScope.launch {
            val result = archiveClassroomUseCase(classroomId)
            result.fold(
                onSuccess = { onDone() },
                onFailure = { _uiState.value = _uiState.value.copy(snackbarMessage = it.message) }
            )
        }
    }

    fun clearSnackbar() { _uiState.value = _uiState.value.copy(snackbarMessage = null) }
}

// ─── Classroom Student List VM ─────────────────────────────────────────────────

data class ClassroomStudentListUiState(
    val students: List<User> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class ClassroomStudentListViewModel @Inject constructor(
    private val getClassroomStudentsUseCase: GetClassroomStudentsUseCase,
    private val getSubmissionsForAssignmentUseCase: GetSubmissionsForAssignmentUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(ClassroomStudentListUiState())
    val uiState: StateFlow<ClassroomStudentListUiState> = _uiState.asStateFlow()

    fun load(classroomId: String) {
        viewModelScope.launch {
            _uiState.value = ClassroomStudentListUiState(isLoading = true)
            try {
                val students = getClassroomStudentsUseCase(classroomId)
                _uiState.value = ClassroomStudentListUiState(students = students, isLoading = false)
            } catch (e: Exception) {
                _uiState.value = ClassroomStudentListUiState(isLoading = false, error = e.message)
            }
        }
    }
}
