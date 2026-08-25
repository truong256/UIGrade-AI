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
    val recentSubmissions: List<Submission> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class LecturerDashboardViewModel @Inject constructor(
    private val getCurrentUserUseCase: GetCurrentUserUseCase,
    private val getAllSubmissionsUseCase: GetAllSubmissionsUseCase,
    private val getAssignmentsForLecturerUseCase: GetAssignmentsForLecturerUseCase,
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
                val assignmentIds = lecturerAssignments.map { it.id }.toSet()
                val mySubs = allSubs.filter { it.assignmentId in assignmentIds }
                val avgScore = 78.4f // mock aggregate
                _uiState.value = LecturerDashboardUiState(
                    user = user,
                    stats = LecturerStats(lecturerAssignments.size, mySubs.size, avgScore, mySubs.count { it.status == SubmissionStatus.PENDING }),
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

// ─── Submission List VM ───────────────────────────────────────────────────────
data class SubmissionListUiState(val submissions: List<Submission> = emptyList(), val isLoading: Boolean = true, val error: String? = null)

@HiltViewModel
class SubmissionListViewModel @Inject constructor(
    private val getSubmissionsForAssignmentUseCase: GetSubmissionsForAssignmentUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SubmissionListUiState())
    val uiState: StateFlow<SubmissionListUiState> = _uiState.asStateFlow()

    fun load(assignmentId: String) {
        viewModelScope.launch {
            _uiState.value = SubmissionListUiState(isLoading = true)
            try {
                _uiState.value = SubmissionListUiState(submissions = getSubmissionsForAssignmentUseCase(assignmentId), isLoading = false)
            } catch (e: Exception) {
                _uiState.value = SubmissionListUiState(isLoading = false, error = e.message)
            }
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
    private val getGradingResultForSubmissionUseCase: GetGradingResultForSubmissionUseCase,
    private val getFeedbackForResultUseCase: GetFeedbackForResultUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SubmissionDetailUiState())
    val uiState: StateFlow<SubmissionDetailUiState> = _uiState.asStateFlow()

    fun load(submissionId: String) {
        viewModelScope.launch {
            _uiState.value = SubmissionDetailUiState(isLoading = true)
            try {
                val result = getGradingResultForSubmissionUseCase(submissionId)
                val feedback = result?.id?.let { getFeedbackForResultUseCase(it) }
                _uiState.value = SubmissionDetailUiState(gradingResult = result, feedback = feedback, isLoading = false)
            } catch (e: Exception) {
                _uiState.value = SubmissionDetailUiState(isLoading = false, error = e.message)
            }
        }
    }
}
