package com.uigrade.ai.presentation.lecturer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.*
import com.uigrade.ai.domain.usecase.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

// ─── Lecturer Dashboard VM ────────────────────────────────────────────────────
data class LecturerDashboardUiState(
    val user: User? = null,
    val stats: LecturerStats? = null,
    val classrooms: List<Classroom> = emptyList(),
    val recentSubmissions: List<Submission> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class LecturerDashboardViewModel @Inject constructor(
    private val getCurrentUserUseCase: GetCurrentUserUseCase,
    private val getAllSubmissionsUseCase: GetAllSubmissionsUseCase,
    private val getAssignmentsForLecturerUseCase: GetAssignmentsForLecturerUseCase,
    private val getAllGradingResultsUseCase: GetAllGradingResultsUseCase,
    private val getLecturerClassroomsUseCase: GetLecturerClassroomsUseCase,
    private val logoutUseCase: LogoutUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(LecturerDashboardUiState())
    val uiState: StateFlow<LecturerDashboardUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val user = getCurrentUserUseCase()
                val allSubs = getAllSubmissionsUseCase()
                val lecturerAssignments = if (user != null) getAssignmentsForLecturerUseCase(user.id) else emptyList()
                val classrooms = getLecturerClassroomsUseCase()
                val assignmentIds = lecturerAssignments.map { it.id }.toSet()
                val mySubs = allSubs.filter { it.assignmentId in assignmentIds }
                val results = getAllGradingResultsUseCase().filter { it.assignmentId in assignmentIds }
                val avgScore = if (results.isEmpty()) 0f else results
                    .map { it.percentage * 100 }
                    .average()
                    .toFloat()
                _uiState.value = LecturerDashboardUiState(
                    user = user,
                    stats = LecturerStats(lecturerAssignments.size, mySubs.size, avgScore, mySubs.count { it.status == SubmissionStatus.PENDING || it.status == SubmissionStatus.SUBMITTED || it.status == SubmissionStatus.LATE }),
                    classrooms = classrooms,
                    recentSubmissions = mySubs.takeLast(5).reversed(),
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun logout(onDone: () -> Unit) { viewModelScope.launch { logoutUseCase(); onDone() } }
}

// ─── Rubric Management VM ─────────────────────────────────────────────────────
data class RubricListUiState(val rubrics: List<Rubric> = emptyList(), val isLoading: Boolean = true, val error: String? = null)

@HiltViewModel
class RubricManagementViewModel @Inject constructor(
    private val getAllRubricsUseCase: GetAllRubricsUseCase,
    private val getRubricByIdUseCase: GetRubricByIdUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(RubricListUiState())
    val uiState: StateFlow<RubricListUiState> = _uiState.asStateFlow()

    private val _selectedRubric = MutableStateFlow<Rubric?>(null)
    val selectedRubric: StateFlow<Rubric?> = _selectedRubric.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                _uiState.value = RubricListUiState(rubrics = getAllRubricsUseCase(), isLoading = false)
            } catch (e: Exception) {
                _uiState.value = RubricListUiState(isLoading = false, error = e.message)
            }
        }
    }

    fun loadRubric(id: String) {
        viewModelScope.launch { _selectedRubric.value = getRubricByIdUseCase(id) }
    }
}

// ─── Submission List VM (Upgraded) ────────────────────────────────────────────

enum class SubmissionSortOption(val displayName: String) {
    NAME_AZ("Tên A–Z"),
    NEWEST("Mới nộp nhất"),
    OLDEST("Cũ nhất"),
    SCORE_HIGH("Điểm cao nhất"),
    SCORE_LOW("Điểm thấp nhất")
}

data class SubmissionSummary(
    val totalStudents: Int = 0,
    val submitted: Int = 0,
    val notSubmitted: Int = 0,
    val late: Int = 0,
    val grading: Int = 0,
    val graded: Int = 0
)

data class SubmissionListUiState(
    val assignment: Assignment? = null,
    val allSubmissions: List<Submission> = emptyList(),
    val filteredSubmissions: List<Submission> = emptyList(),
    val students: List<User> = emptyList(),
    val gradingResults: Map<String, GradingResult> = emptyMap(), // submissionId -> result
    val summary: SubmissionSummary = SubmissionSummary(),
    val searchQuery: String = "",
    val selectedStatus: SubmissionStatus? = null,
    val sortOption: SubmissionSortOption = SubmissionSortOption.NEWEST,
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class SubmissionListViewModel @Inject constructor(
    private val getSubmissionsForAssignmentUseCase: GetSubmissionsForAssignmentUseCase,
    private val getAssignmentByIdUseCase: GetAssignmentByIdUseCase,
    private val getClassroomStudentsUseCase: GetClassroomStudentsUseCase,
    private val getAllGradingResultsUseCase: GetAllGradingResultsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SubmissionListUiState())
    val uiState: StateFlow<SubmissionListUiState> = _uiState.asStateFlow()

    fun load(assignmentId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val assignment = getAssignmentByIdUseCase(assignmentId)
                val subs = getSubmissionsForAssignmentUseCase(assignmentId)
                val students = if (assignment?.classroomId?.isNotBlank() == true) {
                    getClassroomStudentsUseCase(assignment.classroomId)
                } else emptyList()

                val allResults = getAllGradingResultsUseCase().filter { it.assignmentId == assignmentId }
                val resultsMap = allResults.associateBy { it.submissionId }

                val submittedStudentIds = subs.map { it.studentId }.toSet()
                val totalStudents = if (students.isNotEmpty()) students.size else submittedStudentIds.size
                val submittedCount = subs.size
                val notSubmittedCount = (totalStudents - submittedStudentIds.size).coerceAtLeast(0)
                val lateCount = subs.count { it.isLate }
                val gradingCount = subs.count { it.status == SubmissionStatus.GRADING || it.status == SubmissionStatus.PENDING }
                val gradedCount = subs.count { it.status == SubmissionStatus.GRADED || it.status == SubmissionStatus.RELEASED || it.status == SubmissionStatus.COMPLETED }

                val summary = SubmissionSummary(
                    totalStudents = totalStudents,
                    submitted = submittedCount,
                    notSubmitted = notSubmittedCount,
                    late = lateCount,
                    grading = gradingCount,
                    graded = gradedCount
                )

                val filtered = applyFilterAndSort(subs, resultsMap, _uiState.value.searchQuery, _uiState.value.selectedStatus, _uiState.value.sortOption)

                _uiState.value = SubmissionListUiState(
                    assignment = assignment,
                    allSubmissions = subs,
                    filteredSubmissions = filtered,
                    students = students,
                    gradingResults = resultsMap,
                    summary = summary,
                    searchQuery = _uiState.value.searchQuery,
                    selectedStatus = _uiState.value.selectedStatus,
                    sortOption = _uiState.value.sortOption,
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = SubmissionListUiState(isLoading = false, error = e.message)
            }
        }
    }

    fun onSearchChange(query: String) {
        val filtered = applyFilterAndSort(
            _uiState.value.allSubmissions,
            _uiState.value.gradingResults,
            query,
            _uiState.value.selectedStatus,
            _uiState.value.sortOption
        )
        _uiState.value = _uiState.value.copy(searchQuery = query, filteredSubmissions = filtered)
    }

    fun onStatusFilterChange(status: SubmissionStatus?) {
        val filtered = applyFilterAndSort(
            _uiState.value.allSubmissions,
            _uiState.value.gradingResults,
            _uiState.value.searchQuery,
            status,
            _uiState.value.sortOption
        )
        _uiState.value = _uiState.value.copy(selectedStatus = status, filteredSubmissions = filtered)
    }

    fun onSortChange(sort: SubmissionSortOption) {
        val filtered = applyFilterAndSort(
            _uiState.value.allSubmissions,
            _uiState.value.gradingResults,
            _uiState.value.searchQuery,
            _uiState.value.selectedStatus,
            sort
        )
        _uiState.value = _uiState.value.copy(sortOption = sort, filteredSubmissions = filtered)
    }

    private fun applyFilterAndSort(
        list: List<Submission>,
        results: Map<String, GradingResult>,
        query: String,
        status: SubmissionStatus?,
        sort: SubmissionSortOption
    ): List<Submission> {
        var res = list
        if (query.isNotBlank()) {
            res = res.filter {
                it.studentName.contains(query, ignoreCase = true) ||
                        it.fileName.contains(query, ignoreCase = true)
            }
        }
        if (status != null) {
            res = res.filter { it.status == status }
        }
        return when (sort) {
            SubmissionSortOption.NAME_AZ -> res.sortedBy { it.studentName }
            SubmissionSortOption.NEWEST -> res.sortedByDescending { it.submittedAt }
            SubmissionSortOption.OLDEST -> res.sortedBy { it.submittedAt }
            SubmissionSortOption.SCORE_HIGH -> res.sortedByDescending { results[it.id]?.totalScore ?: -1 }
            SubmissionSortOption.SCORE_LOW -> res.sortedBy { results[it.id]?.totalScore ?: 999 }
        }
    }
}

// ─── Submission Detail VM ─────────────────────────────────────────────────────
data class SubmissionDetailUiState(
    val submission: Submission? = null,
    val gradingResult: GradingResult? = null,
    val feedback: Feedback? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class SubmissionDetailViewModel @Inject constructor(
    private val getSubmissionByIdUseCase: GetSubmissionByIdUseCase,
    private val getGradingResultForSubmissionUseCase: GetGradingResultForSubmissionUseCase,
    private val getFeedbackForResultUseCase: GetFeedbackForResultUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SubmissionDetailUiState())
    val uiState: StateFlow<SubmissionDetailUiState> = _uiState.asStateFlow()

    fun load(submissionId: String) {
        viewModelScope.launch {
            _uiState.value = SubmissionDetailUiState(isLoading = true)
            try {
                val submission = getSubmissionByIdUseCase(submissionId)
                val result = getGradingResultForSubmissionUseCase(submissionId)
                val feedback = result?.id?.let { getFeedbackForResultUseCase(it) }
                _uiState.value = SubmissionDetailUiState(
                    submission = submission,
                    gradingResult = result,
                    feedback = feedback,
                    isLoading = false,
                    error = if (submission == null) "Không tìm thấy bài nộp" else null
                )
            } catch (e: Exception) {
                _uiState.value = SubmissionDetailUiState(isLoading = false, error = e.message)
            }
        }
    }
}
