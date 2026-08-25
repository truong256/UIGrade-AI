package com.uigrade.ai.presentation.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.usecase.GetAssignmentByIdUseCase
import com.uigrade.ai.domain.usecase.GetAssignmentsForStudentUseCase
import com.uigrade.ai.domain.usecase.GetCurrentUserUseCase
import com.uigrade.ai.domain.usecase.GetRubricByIdUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AssignmentDetailUiState(
    val assignment: Assignment? = null,
    val rubric: Rubric? = null,
    val status: AssignmentStatus = AssignmentStatus.NOT_SUBMITTED,
    val submissionId: String? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class AssignmentDetailViewModel @Inject constructor(
    private val getAssignmentByIdUseCase: GetAssignmentByIdUseCase,
    private val getRubricByIdUseCase: GetRubricByIdUseCase,
    private val getCurrentUserUseCase: GetCurrentUserUseCase,
    private val getAssignmentsForStudentUseCase: GetAssignmentsForStudentUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(AssignmentDetailUiState())
    val uiState: StateFlow<AssignmentDetailUiState> = _uiState.asStateFlow()

    fun load(assignmentId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val assignment = getAssignmentByIdUseCase(assignmentId)
                val rubric = assignment?.rubricId?.let { getRubricByIdUseCase(it) }
                val user = getCurrentUserUseCase()
                val assignmentStatus = user?.let { currentUser ->
                    getAssignmentsForStudentUseCase(currentUser.id)
                        .firstOrNull { it.assignment.id == assignmentId }
                }
                _uiState.value = _uiState.value.copy(
                    assignment = assignment,
                    rubric = rubric,
                    status = assignmentStatus?.status ?: AssignmentStatus.NOT_SUBMITTED,
                    submissionId = assignmentStatus?.submissionId,
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }
}
