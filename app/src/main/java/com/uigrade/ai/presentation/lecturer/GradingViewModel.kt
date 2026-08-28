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
    val aiFeedback: Feedback? = null,
    val aiFeedbackAccepted: Boolean? = null,
    val isGeneratingAi: Boolean = false,
    val hasUnsavedChanges: Boolean = false,
    val previousSubmissionId: String? = null,
    val nextSubmissionId: String? = null,
    val gradingPosition: Int = 0,
    val gradingTotal: Int = 0,
    val snackbarMessage: String? = null,
    val error: String? = null
)

@HiltViewModel
class GradingViewModel @Inject constructor(
    private val getSubmissionByIdUseCase: GetSubmissionByIdUseCase,
    private val getSubmissionsForAssignmentUseCase: GetSubmissionsForAssignmentUseCase,
    private val getAssignmentByIdUseCase: GetAssignmentByIdUseCase,
    private val getRubricByIdUseCase: GetRubricByIdUseCase,
    private val getGradingResultForSubmissionForLecturerUseCase: GetGradingResultForSubmissionForLecturerUseCase,
    private val getFeedbackForResultUseCase: GetFeedbackForResultUseCase,
    private val generateFeedbackUseCase: GenerateFeedbackUseCase,
    private val saveGradingDraftUseCase: SaveGradingDraftUseCase,
    private val finalizeGradingUseCase: FinalizeGradingUseCase,
    private val releaseGradingUseCase: ReleaseGradingUseCase,
    private val updateSubmissionReviewStateUseCase: UpdateSubmissionReviewStateUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(GradingUiState())
    val uiState: StateFlow<GradingUiState> = _uiState.asStateFlow()

    fun load(submissionId: String) {
        viewModelScope.launch {
            _uiState.value = GradingUiState(isLoading = true)
            try {
                val submission = getSubmissionByIdUseCase(submissionId)
                val assignment = submission?.assignmentId?.let { getAssignmentByIdUseCase(it) }
                val assignmentSubmissions = submission?.assignmentId
                    ?.let { getSubmissionsForAssignmentUseCase(it).sortedBy { item -> item.studentName } }
                    .orEmpty()
                val submissionIndex = assignmentSubmissions.indexOfFirst { it.id == submissionId }
                val rubric = assignment?.rubricId?.let { getRubricByIdUseCase(it) }
                // Try to load existing grading result (draft or not released)
                val existing = submission?.id?.let {
                    getGradingResultForSubmissionForLecturerUseCase(it).getOrThrow()
                }
                val feedback = existing?.id?.let { getFeedbackForResultUseCase(it) }

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
                    aiFeedback = feedback,
                    previousSubmissionId = assignmentSubmissions.getOrNull(submissionIndex - 1)?.id,
                    nextSubmissionId = assignmentSubmissions.getOrNull(submissionIndex + 1)?.id,
                    gradingPosition = if (submissionIndex >= 0) submissionIndex + 1 else 0,
                    gradingTotal = assignmentSubmissions.size,
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
            totalScore = updated.values.sum(),
            hasUnsavedChanges = true
        )
    }

    fun updateCriterionComment(criterionId: String, comment: String) {
        val updated = _uiState.value.criteriaComments.toMutableMap().also { it[criterionId] = comment }
        _uiState.value = _uiState.value.copy(criteriaComments = updated, hasUnsavedChanges = true)
    }

    fun updateLecturerComment(comment: String) {
        _uiState.value = _uiState.value.copy(lecturerComment = comment, hasUnsavedChanges = true)
    }

    fun saveDraft() {
        if (_uiState.value.isSaving) return
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
                        hasUnsavedChanges = false,
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
        if (_uiState.value.isSaving) return
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
                        existingResult = released,
                        hasUnsavedChanges = false,
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

    fun generateAiSupport() {
        val state = _uiState.value
        if (state.isGeneratingAi || state.isSaving) return
        val submission = state.submission ?: return
        val rubric = state.rubric ?: return
        val assignment = state.assignment ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isGeneratingAi = true, error = null)
            val saved = saveGradingDraftUseCase(
                submissionId = submission.id,
                assignmentId = submission.assignmentId,
                studentId = submission.studentId,
                criteriaScores = buildCriteriaScores(_uiState.value, rubric),
                lecturerComment = _uiState.value.lecturerComment,
                maxScore = assignment.totalMaxScore,
                existingResultId = _uiState.value.existingResult?.id
            ).getOrElse {
                _uiState.value = _uiState.value.copy(isGeneratingAi = false, error = it.message)
                return@launch
            }
            generateFeedbackUseCase(saved).fold(
                onSuccess = { feedback ->
                    _uiState.value = _uiState.value.copy(
                        existingResult = saved,
                        aiFeedback = feedback,
                        isGeneratingAi = false,
                        hasUnsavedChanges = false,
                        snackbarMessage = "AI đã hoàn tất phân tích hỗ trợ."
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        existingResult = saved,
                        isGeneratingAi = false,
                        hasUnsavedChanges = false,
                        error = "Không thể tạo nhận xét AI. Dữ liệu chấm thủ công vẫn được giữ lại."
                    )
                }
            )
        }
    }

    fun acceptAiFeedback() {
        val feedback = _uiState.value.aiFeedback ?: return
        val suggestedText = buildString {
            append("Gợi ý AI đã được giảng viên duyệt: ")
            append(feedback.summary)
            if (feedback.recommendations.isNotEmpty()) {
                append("\nKhuyến nghị: ")
                append(feedback.recommendations.joinToString("; "))
            }
        }
        val current = _uiState.value.lecturerComment.trim()
        _uiState.value = _uiState.value.copy(
            lecturerComment = listOf(current, suggestedText).filter { it.isNotBlank() }.joinToString("\n\n"),
            aiFeedbackAccepted = true,
            hasUnsavedChanges = true,
            snackbarMessage = "Đã thêm gợi ý AI vào nhận xét. Hãy kiểm tra trước khi lưu."
        )
    }

    fun rejectAiFeedback() {
        if (_uiState.value.aiFeedback == null) return
        _uiState.value = _uiState.value.copy(
            aiFeedbackAccepted = false,
            snackbarMessage = "Đã từ chối gợi ý AI. Điểm và nhận xét thủ công không thay đổi."
        )
    }

    fun toggleNeedsReview() {
        val submission = _uiState.value.submission ?: return
        updateReviewState(!submission.needsReview, submission.resubmissionRequested)
    }

    fun toggleResubmissionRequest() {
        val submission = _uiState.value.submission ?: return
        updateReviewState(submission.needsReview, !submission.resubmissionRequested)
    }

    private fun updateReviewState(needsReview: Boolean, resubmissionRequested: Boolean) {
        val submission = _uiState.value.submission ?: return
        if (_uiState.value.isSaving) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, error = null)
            updateSubmissionReviewStateUseCase(
                submission.id,
                needsReview,
                resubmissionRequested
            ).fold(
                onSuccess = { updated ->
                    _uiState.value = _uiState.value.copy(
                        submission = updated,
                        isSaving = false,
                        snackbarMessage = when {
                            resubmissionRequested -> "Đã yêu cầu sinh viên nộp lại."
                            needsReview -> "Đã đánh dấu bài cần xem lại."
                            else -> "Đã cập nhật trạng thái bài nộp."
                        }
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(isSaving = false, error = error.message)
                }
            )
        }
    }

    fun clearSnackbar() { _uiState.value = _uiState.value.copy(snackbarMessage = null) }
    fun clearError() { _uiState.value = _uiState.value.copy(error = null) }
}
