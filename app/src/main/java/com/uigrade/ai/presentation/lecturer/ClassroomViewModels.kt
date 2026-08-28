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
    val classroom: Classroom? = null,
    val success: Classroom? = null,
    val error: String? = null
)

@HiltViewModel
class CreateClassroomViewModel @Inject constructor(
    private val createClassroomUseCase: CreateClassroomUseCase,
    private val getClassroomByIdUseCase: GetClassroomByIdUseCase,
    private val updateClassroomUseCase: UpdateClassroomUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(CreateClassroomUiState())
    val uiState: StateFlow<CreateClassroomUiState> = _uiState.asStateFlow()

    fun create(
        name: String,
        courseCode: String,
        description: String,
        semester: String,
        courseName: String = "",
        academicYear: String = "",
        schedule: String = "",
        room: String = ""
    ) {
        if (_uiState.value.isLoading) return
        viewModelScope.launch {
            _uiState.value = CreateClassroomUiState(isLoading = true)
            val result = createClassroomUseCase(
                name, courseCode, description, semester,
                courseName, academicYear, schedule, room
            )
            result.fold(
                onSuccess = { _uiState.value = CreateClassroomUiState(success = it) },
                onFailure = { _uiState.value = CreateClassroomUiState(error = it.message) }
            )
        }
    }

    fun loadForEdit(classroomId: String) {
        viewModelScope.launch {
            _uiState.value = CreateClassroomUiState(isLoading = true)
            runCatching { getClassroomByIdUseCase(classroomId) }.fold(
                onSuccess = { classroom ->
                    _uiState.value = CreateClassroomUiState(
                        classroom = classroom,
                        error = if (classroom == null) "Không tìm thấy lớp học" else null
                    )
                },
                onFailure = { _uiState.value = CreateClassroomUiState(error = friendlyMessage(it)) }
            )
        }
    }

    fun update(
        original: Classroom,
        name: String,
        courseCode: String,
        description: String,
        semester: String,
        courseName: String,
        academicYear: String,
        schedule: String,
        room: String
    ) {
        if (_uiState.value.isLoading) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            updateClassroomUseCase(
                original.copy(
                    name = name.trim(),
                    courseCode = courseCode.trim().uppercase(),
                    description = description.trim(),
                    semester = semester.trim(),
                    courseName = courseName.trim(),
                    academicYear = academicYear.trim(),
                    schedule = schedule.trim(),
                    room = room.trim()
                )
            ).fold(
                onSuccess = { _uiState.value = CreateClassroomUiState(classroom = it, success = it) },
                onFailure = { _uiState.value = _uiState.value.copy(isLoading = false, error = friendlyMessage(it)) }
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
    val joinCodeRegenerated: Boolean = false,
    val isSubmitting: Boolean = false,
    val deleted: Boolean = false
)

@HiltViewModel
class ClassroomDetailViewModel @Inject constructor(
    private val getClassroomByIdUseCase: GetClassroomByIdUseCase,
    private val getAllAssignmentsForClassroomUseCase: GetAllAssignmentsForClassroomUseCase,
    private val getClassroomStudentsUseCase: GetClassroomStudentsUseCase,
    private val regenerateJoinCodeUseCase: RegenerateJoinCodeUseCase,
    private val archiveClassroomUseCase: ArchiveClassroomUseCase,
    private val restoreClassroomUseCase: RestoreClassroomUseCase,
    private val deleteClassroomUseCase: DeleteClassroomUseCase,
    private val setClassroomJoinEnabledUseCase: SetClassroomJoinEnabledUseCase
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
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true)
            val result = regenerateJoinCodeUseCase(classroomId)
            result.fold(
                onSuccess = { newCode ->
                    val updated = _uiState.value.classroom?.copy(joinCode = newCode)
                    _uiState.value = _uiState.value.copy(
                        classroom = updated,
                        snackbarMessage = "Đã tạo mã tham gia mới: $newCode",
                        joinCodeRegenerated = true,
                        isSubmitting = false
                    )
                },
                onFailure = { _uiState.value = _uiState.value.copy(isSubmitting = false, snackbarMessage = friendlyMessage(it)) }
            )
        }
    }

    fun archiveClassroom(classroomId: String, onDone: () -> Unit) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true)
            val result = archiveClassroomUseCase(classroomId)
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(isSubmitting = false)
                    onDone()
                },
                onFailure = { _uiState.value = _uiState.value.copy(isSubmitting = false, snackbarMessage = friendlyMessage(it)) }
            )
        }
    }

    fun restoreClassroom(classroomId: String) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true)
            restoreClassroomUseCase(classroomId).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        classroom = _uiState.value.classroom?.copy(status = ClassroomStatus.ACTIVE),
                        isSubmitting = false,
                        snackbarMessage = "Đã khôi phục lớp học."
                    )
                },
                onFailure = { _uiState.value = _uiState.value.copy(isSubmitting = false, snackbarMessage = friendlyMessage(it)) }
            )
        }
    }

    fun setJoinEnabled(classroomId: String, enabled: Boolean) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true)
            setClassroomJoinEnabledUseCase(classroomId, enabled).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        classroom = it,
                        isSubmitting = false,
                        snackbarMessage = if (enabled) "Đã bật nhận sinh viên mới." else "Đã tạm dừng nhận sinh viên mới."
                    )
                },
                onFailure = { _uiState.value = _uiState.value.copy(isSubmitting = false, snackbarMessage = friendlyMessage(it)) }
            )
        }
    }

    fun deleteClassroom(classroomId: String, onDone: () -> Unit) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true)
            deleteClassroomUseCase(classroomId).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, deleted = true)
                    onDone()
                },
                onFailure = { _uiState.value = _uiState.value.copy(isSubmitting = false, snackbarMessage = friendlyMessage(it)) }
            )
        }
    }

    fun clearSnackbar() { _uiState.value = _uiState.value.copy(snackbarMessage = null) }
}

// ─── Classroom Student List VM ─────────────────────────────────────────────────

data class ClassroomStudentListUiState(
    val students: List<User> = emptyList(),
    val filteredStudents: List<User> = emptyList(),
    val searchQuery: String = "",
    val progress: Map<String, ClassroomStudentProgress> = emptyMap(),
    val isLoading: Boolean = true,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val snackbarMessage: String? = null
)

data class ClassroomStudentProgress(
    val submitted: Int = 0,
    val missing: Int = 0,
    val averageScore: Float? = null
)

@HiltViewModel
class ClassroomStudentListViewModel @Inject constructor(
    private val getClassroomStudentsUseCase: GetClassroomStudentsUseCase,
    private val removeStudentFromClassroomUseCase: RemoveStudentFromClassroomUseCase,
    private val getAssignmentsUseCase: GetAllAssignmentsForClassroomUseCase,
    private val getSubmissionsUseCase: GetAllSubmissionsUseCase,
    private val getResultsUseCase: GetAllGradingResultsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(ClassroomStudentListUiState())
    val uiState: StateFlow<ClassroomStudentListUiState> = _uiState.asStateFlow()

    fun load(classroomId: String) {
        viewModelScope.launch {
            _uiState.value = ClassroomStudentListUiState(isLoading = true)
            try {
                val students = getClassroomStudentsUseCase(classroomId)
                val assignments = getAssignmentsUseCase(classroomId).filterNot { it.isArchived }
                val assignmentIds = assignments.map { it.id }.toSet()
                val submissions = getSubmissionsUseCase().filter { it.assignmentId in assignmentIds }
                val resultsBySubmission = getResultsUseCase().associateBy { it.submissionId }
                val progress = students.associate { student ->
                    val studentSubmissions = submissions.filter { it.studentId == student.id }
                    val percentages = studentSubmissions.mapNotNull { resultsBySubmission[it.id] }
                        .filter { it.maxScore > 0 }
                        .map { it.percentage * 100f }
                    student.id to ClassroomStudentProgress(
                        submitted = studentSubmissions.map { it.assignmentId }.distinct().size,
                        missing = (assignments.size - studentSubmissions.map { it.assignmentId }.distinct().size).coerceAtLeast(0),
                        averageScore = percentages.takeIf { it.isNotEmpty() }?.average()?.toFloat()
                    )
                }
                _uiState.value = ClassroomStudentListUiState(
                    students = students,
                    filteredStudents = filterStudents(students, _uiState.value.searchQuery),
                    searchQuery = _uiState.value.searchQuery,
                    progress = progress,
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = ClassroomStudentListUiState(isLoading = false, error = e.message)
            }
        }
    }

    fun onSearchChange(query: String) {
        _uiState.value = _uiState.value.copy(
            searchQuery = query,
            filteredStudents = filterStudents(_uiState.value.students, query)
        )
    }

    fun removeStudent(classroomId: String, studentId: String) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true)
            removeStudentFromClassroomUseCase(classroomId, studentId).fold(
                onSuccess = {
                    val students = _uiState.value.students.filterNot { it.id == studentId }
                    _uiState.value = _uiState.value.copy(
                        students = students,
                        filteredStudents = filterStudents(students, _uiState.value.searchQuery),
                        progress = _uiState.value.progress - studentId,
                        isSubmitting = false,
                        snackbarMessage = "Đã xóa sinh viên khỏi lớp."
                    )
                },
                onFailure = { _uiState.value = _uiState.value.copy(isSubmitting = false, error = friendlyMessage(it)) }
            )
        }
    }

    fun clearMessage() { _uiState.value = _uiState.value.copy(snackbarMessage = null, error = null) }

    private fun filterStudents(students: List<User>, query: String): List<User> =
        if (query.isBlank()) students else students.filter {
            it.name.contains(query, ignoreCase = true) ||
                it.email.contains(query, ignoreCase = true) ||
                it.studentId.orEmpty().contains(query, ignoreCase = true)
        }
}

data class JoinRequestItem(val request: JoinRequest, val student: User?)

data class JoinRequestsUiState(
    val requests: List<JoinRequestItem> = emptyList(),
    val isLoading: Boolean = true,
    val processingRequestId: String? = null,
    val error: String? = null,
    val message: String? = null
)

@HiltViewModel
class JoinRequestsViewModel @Inject constructor(
    private val getJoinRequestsUseCase: GetJoinRequestsUseCase,
    private val respondToJoinRequestUseCase: RespondToJoinRequestUseCase,
    private val getAllUsersUseCase: GetAllUsersUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(JoinRequestsUiState())
    val uiState: StateFlow<JoinRequestsUiState> = _uiState.asStateFlow()

    fun load(classroomId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            getJoinRequestsUseCase(classroomId).fold(
                onSuccess = { requests ->
                    val users = getAllUsersUseCase().associateBy { it.id }
                    _uiState.value = JoinRequestsUiState(
                        requests = requests.map { JoinRequestItem(it, users[it.studentId]) },
                        isLoading = false
                    )
                },
                onFailure = { _uiState.value = JoinRequestsUiState(isLoading = false, error = friendlyMessage(it)) }
            )
        }
    }

    fun respond(classroomId: String, requestId: String, approve: Boolean) {
        if (_uiState.value.processingRequestId != null) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(processingRequestId = requestId)
            respondToJoinRequestUseCase(classroomId, requestId, approve).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        requests = _uiState.value.requests.filterNot { item -> item.request.id == requestId },
                        processingRequestId = null,
                        message = if (approve) "Đã chấp nhận sinh viên." else "Đã từ chối yêu cầu."
                    )
                },
                onFailure = { _uiState.value = _uiState.value.copy(processingRequestId = null, error = friendlyMessage(it)) }
            )
        }
    }

    fun clearMessage() { _uiState.value = _uiState.value.copy(message = null, error = null) }
}

private fun friendlyMessage(error: Throwable): String =
    error.message?.takeIf { it.isNotBlank() } ?: "Không thể hoàn tất thao tác. Vui lòng thử lại."
