package com.uigrade.ai.presentation.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.Feedback
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.usecase.GetFeedbackForResultUseCase
import com.uigrade.ai.domain.usecase.GetGradingResultForSubmissionUseCase
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
    val error: String? = null
)

@HiltViewModel
class GradingResultViewModel @Inject constructor(
    private val getGradingResultForSubmissionUseCase: GetGradingResultForSubmissionUseCase,
    private val getFeedbackForResultUseCase: GetFeedbackForResultUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(GradingResultUiState())
    val uiState: StateFlow<GradingResultUiState> = _uiState.asStateFlow()

    fun load(submissionId: String) {
        viewModelScope.launch {
            _uiState.value = GradingResultUiState(isLoading = true)
            try {
                val result = getGradingResultForSubmissionUseCase(submissionId)
                val feedback = result?.id?.let { getFeedbackForResultUseCase(it) }
                _uiState.value = GradingResultUiState(gradingResult = result, feedback = feedback, isLoading = false)
            } catch (e: Exception) {
                _uiState.value = GradingResultUiState(isLoading = false, error = e.message)
            }
        }
    }
}
