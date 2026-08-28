package com.uigrade.ai.presentation.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.usecase.GetRubricByIdUseCase
import com.uigrade.ai.domain.usecase.GetStudentAssignmentDataUseCase
import com.uigrade.ai.domain.usecase.StudentAssignmentData
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class StudentAssignmentAction {
    START,
    CONTINUE_DRAFT,
    VIEW_SUBMISSION,
    VIEW_RESULT,
    RESUBMIT,
    DISABLED
}

data class AssignmentDetailUiState(
    val data: StudentAssignmentData? = null,
    val rubric: Rubric? = null,
    val action: StudentAssignmentAction = StudentAssignmentAction.DISABLED,
    val actionLabel: String = "Đang tải...",
    val disabledReason: String? = null,
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AssignmentDetailViewModel @Inject constructor(
    private val getStudentAssignmentDataUseCase: GetStudentAssignmentDataUseCase,
    private val getRubricByIdUseCase: GetRubricByIdUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(AssignmentDetailUiState())
    val uiState: StateFlow<AssignmentDetailUiState> = _uiState.asStateFlow()

    fun load(assignmentId: String, refresh: Boolean = false) {
        if (_uiState.value.isRefreshing) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = !refresh && _uiState.value.data == null,
                isRefreshing = refresh,
                error = null
            )
            getStudentAssignmentDataUseCase(assignmentId).fold(
                onSuccess = { data ->
                    val rubric = runCatching { getRubricByIdUseCase(data.item.assignment.rubricId) }.getOrNull()
                    val (action, label) = actionFor(data)
                    _uiState.value = _uiState.value.copy(
                        data = data,
                        rubric = rubric,
                        action = action,
                        actionLabel = label,
                        disabledReason = data.item.disabledReason,
                        isLoading = false,
                        isRefreshing = false
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isRefreshing = false,
                        error = it.message ?: "Không thể tải bài tập. Vui lòng thử lại."
                    )
                }
            )
        }
    }

    private fun actionFor(data: StudentAssignmentData): Pair<StudentAssignmentAction, String> =
        when (data.item.status) {
            AssignmentStatus.GRADED -> StudentAssignmentAction.VIEW_RESULT to "Xem kết quả"
            AssignmentStatus.SUBMITTED,
            AssignmentStatus.LATE,
            AssignmentStatus.GRADING -> StudentAssignmentAction.VIEW_SUBMISSION to "Xem bài đã nộp"
            AssignmentStatus.DRAFT -> StudentAssignmentAction.CONTINUE_DRAFT to "Tiếp tục bài làm"
            AssignmentStatus.RESUBMISSION_REQUIRED -> StudentAssignmentAction.RESUBMIT to "Nộp lại bài"
            AssignmentStatus.NOT_SUBMITTED -> StudentAssignmentAction.START to
                if (java.time.LocalDateTime.now().isAfter(data.item.assignment.deadline)) "Nộp bài muộn" else "Bắt đầu làm bài"
            AssignmentStatus.UPCOMING -> StudentAssignmentAction.DISABLED to "Bài tập chưa mở"
            AssignmentStatus.OVERDUE -> StudentAssignmentAction.DISABLED to "Đã quá hạn"
            AssignmentStatus.CLOSED -> StudentAssignmentAction.DISABLED to "Đã đóng"
        }
}
