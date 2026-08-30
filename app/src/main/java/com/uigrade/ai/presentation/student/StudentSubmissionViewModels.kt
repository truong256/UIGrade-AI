/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.presentation.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.usecase.GetOwnedStudentGradeUseCase
import com.uigrade.ai.domain.usecase.GetOwnedStudentSubmissionUseCase
import com.uigrade.ai.domain.usecase.GetStudentAssignmentDataUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class StudentSubmissionDetailUiState(
    val submission: Submission? = null,
    val assignment: Assignment? = null,
    val history: List<Submission> = emptyList(),
    val grade: GradingResult? = null,
    val canResubmit: Boolean = false,
    val resubmitReason: String? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class StudentSubmissionDetailViewModel @Inject constructor(
    private val getOwnedStudentSubmissionUseCase: GetOwnedStudentSubmissionUseCase,
    private val getStudentAssignmentDataUseCase: GetStudentAssignmentDataUseCase,
    private val getOwnedStudentGradeUseCase: GetOwnedStudentGradeUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(StudentSubmissionDetailUiState())
    val uiState: StateFlow<StudentSubmissionDetailUiState> = _uiState.asStateFlow()

    fun load(submissionId: String) {
        viewModelScope.launch {
            _uiState.value = StudentSubmissionDetailUiState(isLoading = true)
            getOwnedStudentSubmissionUseCase(submissionId).fold(
                onSuccess = { submission ->
                    val assignmentData = getStudentAssignmentDataUseCase(submission.assignmentId).getOrElse {
                        _uiState.value = StudentSubmissionDetailUiState(isLoading = false, error = it.message)
                        return@fold
                    }
                    val assignment = assignmentData.item.assignment
                    val attemptsUsed = assignmentData.history.count { !it.isDraft }
                    val requested = assignmentData.history.maxByOrNull { it.attemptNumber }?.resubmissionRequested == true
                    val canResubmit = requested || (assignment.allowResubmission && attemptsUsed < assignment.maxAttempts)
                    val reason = when {
                        canResubmit -> null
                        !assignment.allowResubmission -> "Bài tập này không cho phép nộp lại."
                        else -> "Bạn đã sử dụng hết số lần nộp."
                    }
                    _uiState.value = StudentSubmissionDetailUiState(
                        submission = submission,
                        assignment = assignment,
                        history = assignmentData.history,
                        grade = getOwnedStudentGradeUseCase(submissionId).getOrNull(),
                        canResubmit = canResubmit,
                        resubmitReason = reason,
                        isLoading = false
                    )
                },
                onFailure = {
                    _uiState.value = StudentSubmissionDetailUiState(
                        isLoading = false,
                        error = it.message ?: "Không thể tải bài nộp."
                    )
                }
            )
        }
    }
}

data class StudentSubmissionHistoryUiState(
    val assignment: Assignment? = null,
    val history: List<Submission> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class StudentSubmissionHistoryViewModel @Inject constructor(
    private val getStudentAssignmentDataUseCase: GetStudentAssignmentDataUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(StudentSubmissionHistoryUiState())
    val uiState: StateFlow<StudentSubmissionHistoryUiState> = _uiState.asStateFlow()

    fun load(assignmentId: String) {
        viewModelScope.launch {
            _uiState.value = StudentSubmissionHistoryUiState(isLoading = true)
            getStudentAssignmentDataUseCase(assignmentId).fold(
                onSuccess = {
                    _uiState.value = StudentSubmissionHistoryUiState(
                        assignment = it.item.assignment,
                        history = it.history.filterNot(Submission::isDraft).sortedByDescending(Submission::attemptNumber),
                        isLoading = false
                    )
                },
                onFailure = {
                    _uiState.value = StudentSubmissionHistoryUiState(isLoading = false, error = it.message)
                }
            )
        }
    }
}
