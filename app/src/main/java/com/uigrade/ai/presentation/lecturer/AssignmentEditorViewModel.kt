package com.uigrade.ai.presentation.lecturer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.AssignmentPublishStatus
import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.usecase.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDateTime
import javax.inject.Inject

data class AssignmentEditorUiState(
    val isLoading: Boolean = false,
    val existingAssignment: Assignment? = null,
    val rubrics: List<Rubric> = emptyList(),
    val savedAssignment: Assignment? = null,
    val error: String? = null,
    val hasSubmissions: Boolean = false
)

@HiltViewModel
class AssignmentEditorViewModel @Inject constructor(
    private val createAssignmentUseCase: CreateAssignmentUseCase,
    private val updateAssignmentUseCase: UpdateAssignmentUseCase,
    private val publishAssignmentUseCase: PublishAssignmentUseCase,
    private val closeAssignmentUseCase: CloseAssignmentUseCase,
    private val getAssignmentByIdUseCase: GetAssignmentByIdUseCase,
    private val getAllRubricsUseCase: GetAllRubricsUseCase,
    private val getSubmissionsForAssignmentUseCase: GetSubmissionsForAssignmentUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(AssignmentEditorUiState())
    val uiState: StateFlow<AssignmentEditorUiState> = _uiState.asStateFlow()

    fun loadForCreate() {
        viewModelScope.launch {
            _uiState.value = AssignmentEditorUiState(isLoading = true)
            val rubrics = getAllRubricsUseCase()
            _uiState.value = AssignmentEditorUiState(rubrics = rubrics)
        }
    }

    fun loadForEdit(assignmentId: String) {
        viewModelScope.launch {
            _uiState.value = AssignmentEditorUiState(isLoading = true)
            val assignment = getAssignmentByIdUseCase(assignmentId)
            val rubrics = getAllRubricsUseCase()
            val submissions = getSubmissionsForAssignmentUseCase(assignmentId)
            _uiState.value = AssignmentEditorUiState(
                existingAssignment = assignment,
                rubrics = rubrics,
                hasSubmissions = submissions.isNotEmpty()
            )
        }
    }

    fun save(
        classroomId: String,
        title: String,
        description: String,
        deadline: LocalDateTime,
        startAt: LocalDateTime?,
        rubricId: String,
        courseId: String,
        courseName: String,
        totalMaxScore: Int,
        allowLateSubmission: Boolean,
        allowResubmission: Boolean,
        maxAttempts: Int,
        allowedFileTypes: List<String>,
        publish: Boolean
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val existing = _uiState.value.existingAssignment
            val result = if (existing == null) {
                createAssignmentUseCase(
                    title, description, classroomId, deadline, startAt,
                    rubricId, courseId, courseName, totalMaxScore,
                    allowLateSubmission, allowResubmission, maxAttempts, allowedFileTypes, publish
                )
            } else {
                val status = if (publish) AssignmentPublishStatus.PUBLISHED else existing.publishStatus
                updateAssignmentUseCase(
                    existing.copy(
                        title = title.trim(),
                        description = description.trim(),
                        deadline = deadline,
                        startAt = startAt,
                        rubricId = rubricId,
                        totalMaxScore = totalMaxScore,
                        allowLateSubmission = allowLateSubmission,
                        allowResubmission = allowResubmission,
                        maxAttempts = maxAttempts,
                        allowedFileTypes = allowedFileTypes,
                        publishStatus = status
                    )
                )
            }
            result.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isLoading = false, savedAssignment = it) },
                onFailure = { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
            )
        }
    }

    fun publishExisting(assignmentId: String) {
        viewModelScope.launch {
            val result = publishAssignmentUseCase(assignmentId)
            result.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(savedAssignment = it) },
                onFailure = { _uiState.value = _uiState.value.copy(error = it.message) }
            )
        }
    }

    fun closeAssignment(assignmentId: String) {
        viewModelScope.launch {
            val result = closeAssignmentUseCase(assignmentId)
            result.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(savedAssignment = it) },
                onFailure = { _uiState.value = _uiState.value.copy(error = it.message) }
            )
        }
    }

    fun clearError() { _uiState.value = _uiState.value.copy(error = null) }
}
