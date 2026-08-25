package com.uigrade.ai.presentation.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.usecase.GetCurrentUserUseCase
import com.uigrade.ai.domain.usecase.SubmitAssignmentUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SubmitUiState(
    val isSubmitting: Boolean = false,
    val success: Submission? = null,
    val error: String? = null,
    val selectedFileName: String? = null
)

@HiltViewModel
class SubmitAssignmentViewModel @Inject constructor(
    private val submitAssignmentUseCase: SubmitAssignmentUseCase,
    private val getCurrentUserUseCase: GetCurrentUserUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SubmitUiState())
    val uiState: StateFlow<SubmitUiState> = _uiState.asStateFlow()

    fun onFileSelected(name: String) {
        _uiState.value = _uiState.value.copy(selectedFileName = name, error = null)
    }

    fun submit(assignmentId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            val user = getCurrentUserUseCase()
            if (user == null) {
                _uiState.value = _uiState.value.copy(isSubmitting = false, error = "Không tìm thấy thông tin người dùng")
                return@launch
            }
            val result = submitAssignmentUseCase(assignmentId, user.id, _uiState.value.selectedFileName)
            result.fold(
                onSuccess = { sub -> _uiState.value = _uiState.value.copy(isSubmitting = false, success = sub) },
                onFailure = { e -> _uiState.value = _uiState.value.copy(isSubmitting = false, error = e.message) }
            )
        }
    }
}
