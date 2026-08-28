package com.uigrade.ai.presentation.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.Feedback
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.usecase.GenerateFeedbackUseCase
import com.uigrade.ai.domain.usecase.GetFeedbackForResultUseCase
import com.uigrade.ai.domain.usecase.GetOwnedStudentGradeUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class GradingResultUiState(
    val gradingResult: GradingResult? = null,
    val feedback: Feedback? = null,
    val isLoading: Boolean = true,
    val isAiLoading: Boolean = false,
    val error: String? = null,
    val aiError: String? = null
)

@HiltViewModel
class GradingResultViewModel @Inject constructor(
    private val getOwnedStudentGradeUseCase: GetOwnedStudentGradeUseCase,
    private val getFeedbackForResultUseCase: GetFeedbackForResultUseCase,
    private val generateFeedbackUseCase: GenerateFeedbackUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(GradingResultUiState())
    val uiState: StateFlow<GradingResultUiState> = _uiState.asStateFlow()

    fun load(submissionId: String) {
        viewModelScope.launch {
            _uiState.value = GradingResultUiState(isLoading = true)
            getOwnedStudentGradeUseCase(submissionId).fold(
                onSuccess = { result ->
                    val feedback = result?.id?.let { runCatching { getFeedbackForResultUseCase(it) }.getOrNull() }
                    _uiState.value = GradingResultUiState(
                        gradingResult = result,
                        feedback = feedback,
                        isLoading = false
                    )
                },
                onFailure = {
                    _uiState.value = GradingResultUiState(
                        isLoading = false,
                        error = it.message ?: "Không thể tải kết quả."
                    )
                }
            )
        }
    }

    fun requestAiExplanation() {
        val result = _uiState.value.gradingResult ?: return
        if (_uiState.value.isAiLoading) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isAiLoading = true, aiError = null)
            generateFeedbackUseCase(result).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(feedback = it, isAiLoading = false)
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isAiLoading = false,
                        aiError = "Không thể tạo giải thích AI. Vui lòng thử lại."
                    )
                }
            )
        }
    }
}
