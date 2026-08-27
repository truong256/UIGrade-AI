package com.uigrade.ai.presentation.lecturer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.*
import com.uigrade.ai.domain.usecase.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class GradingUiState(
    val submission: Submission? = null,
    val assignment: Assignment? = null,
    val rubric: Rubric? = null,
    val existingResult: GradingResult? = null,
    val criteriaScores: Map<String, Int> = emptyMap(),      // criterionId -> score
    val criteriaComments: Map<String, String> = emptyMap(), // criterionId -> comment
    val lecturerComment: String = "",
    val totalScore: Int = 0,
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val savedResult: GradingResult? = null,
    val snackbarMessage: String? = null,
    val error: String? = null
)

@HiltViewModel
class GradingViewModel @Inject constructor(
    private val getSubmissionByIdUseCase: GetSubmissionByIdUseCase,
    private val getAssignmentByIdUseCase: GetAssignmentByIdUseCase,
    private val getRubricByIdUseCase: GetRubricByIdUseCase,
    private val getGradingResultForSubmissionUseCase: GetGradingResultForSubmissionUseCase,
    private val saveGradingDraftUseCase: SaveGradingDraftUseCase,
    private val finalizeGradingUseCase: FinalizeGradingUseCase,
    private val releaseGradingUseCase: ReleaseGradingUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(GradingUiState())
    val uiState: StateFlow<GradingUiState> = _uiState.asStateFlow()

    fun load(submissionId: String) {
        viewModelScope.launch {
            _uiState.value = GradingUiState(isLoading = true)
            try {
                val submission = getSubmissionByIdUseCase(submissionId)
                val assignment = submission?.assignmentId?.let { getAssignmentByIdUseCase(it) }
                val rubric = assignment?.rubricId?.let { getRubricByIdUseCase(it) }
                // Try to load existing grading result (draft or not released)
                val existing = submission?.id?.let { getGradingResultForSubmissionUseCase(it) }

                // Initialize scores from existing result or zeroes
                val initScores = if (existing != null) {
                    existing.criteriaScores.associate { it.criterionId to it.earned }
                } else {
                    rubric?.criteria?.associate { it.id to 0 } ?: emptyMap()
                }
                val initComments = if (existing != null) {
                    existing.criteriaScores.associate { it.criterionId to it.lecturerComment }
                } else {
                    rubric?.criteria?.associate { it.id to "" } ?: emptyMap()
                }

                _uiState.value = GradingUiState(
                    submission = submission,
                    assignment = assignment,
                    rubric = rubric,
                    existingResult = existing,
                    criteriaScores = initScores,
                    criteriaComments = initComments,
                    lecturerComment = existing?.lecturerComment ?: "",
                    totalScore = initScores.values.sum(),
                    isLoading = false,
                    error = if (submission == null) "Không tìm thấy bài nộp" else null
                )
            } catch (e: Exception) {
                _uiState.value = GradingUiState(isLoading = false, error = e.message)
            }
        }
    }

    fun updateCriterionScore(criterionId: String, score: Int) {
        val updated = _uiState.value.criteriaScores.toMutableMap().also { it[criterionId] = score }
        _uiState.value = _uiState.value.copy(
            criteriaScores = updated,
            totalScore = updated.values.sum()
        )
    }

    fun updateCriterionComment(criterionId: String, comment: String) {
        val updated = _uiState.value.criteriaComments.toMutableMap().also { it[criterionId] = comment }
        _uiState.value = _uiState.value.copy(criteriaComments = updated)
    }

    fun updateLecturerComment(comment: String) {
        _uiState.value = _uiState.value.copy(lecturerComment = comment)
    }

    fun saveDraft() {
        viewModelScope.launch {
            val state = _uiState.value
            val submission = state.submission ?: return@launch
            val rubric = state.rubric ?: return@launch
            val assignment = state.assignment ?: return@launch

            _uiState.value = state.copy(isSaving = true)

            val criteriaScores = buildCriteriaScores(state, rubric)
            val result = saveGradingDraftUseCase(
                submissionId = submission.id,
                assignmentId = submission.assignmentId,
                studentId = submission.studentId,
                criteriaScores = criteriaScores,
                lecturerComment = state.lecturerComment,
                maxScore = assignment.totalMaxScore,
                existingResultId = state.existingResult?.id
            )
            result.fold(
                onSuccess = { saved ->
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        existingResult = saved,
                        snackbarMessage = "Đã lưu bản nháp"
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSaving = false, error = it.message)
                }
            )
        }
    }

    fun finalizeAndRelease(onDone: () -> Unit) {
        viewModelScope.launch {
            val state = _uiState.value
            val submission = state.submission ?: return@launch
            val rubric = state.rubric ?: return@launch
            val assignment = state.assignment ?: return@launch

            _uiState.value = state.copy(isSaving = true)

            val criteriaScores = buildCriteriaScores(state, rubric)
            // First save/finalize
            val saveResult = saveGradingDraftUseCase(
                submissionId = submission.id,
                assignmentId = submission.assignmentId,
                studentId = submission.studentId,
                criteriaScores = criteriaScores,
                lecturerComment = state.lecturerComment,
                maxScore = assignment.totalMaxScore,
                existingResultId = state.existingResult?.id
            )
            saveResult.onFailure {
                _uiState.value = _uiState.value.copy(isSaving = false, error = it.message)
                return@launch
            }
            val savedId = saveResult.getOrNull()?.id ?: return@launch
            finalizeGradingUseCase(savedId).onFailure {
                _uiState.value = _uiState.value.copy(isSaving = false, error = it.message)
                return@launch
            }
            // Then release
            val releaseResult = releaseGradingUseCase(savedId)
            releaseResult.fold(
                onSuccess = { released ->
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        savedResult = released,
                        snackbarMessage = "Đã công bố điểm cho sinh viên"
                    )
                    onDone()
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSaving = false, error = it.message)
                }
            )
        }
    }

    private fun buildCriteriaScores(state: GradingUiState, rubric: Rubric): List<CriterionScore> {
        return rubric.criteria.map { criterion ->
            CriterionScore(
                criterionId = criterion.id,
                criterionName = criterion.name,
                earned = state.criteriaScores[criterion.id] ?: 0,
                maxScore = criterion.maxScore,
                lecturerComment = state.criteriaComments[criterion.id] ?: ""
            )
        }
    }

    fun clearSnackbar() { _uiState.value = _uiState.value.copy(snackbarMessage = null) }
    fun clearError() { _uiState.value = _uiState.value.copy(error = null) }
}
