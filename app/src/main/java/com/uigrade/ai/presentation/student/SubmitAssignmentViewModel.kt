package com.uigrade.ai.presentation.student

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.model.SubmissionAttachment
import com.uigrade.ai.domain.usecase.DeleteStudentDraftUseCase
import com.uigrade.ai.domain.usecase.GetStudentAssignmentDataUseCase
import com.uigrade.ai.domain.usecase.SaveStudentDraftUseCase
import com.uigrade.ai.domain.usecase.SubmitStudentDraftUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import java.time.LocalDateTime
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SubmitUiState(
    val assignment: Assignment? = null,
    val classroomName: String = "",
    val content: String = "",
    val linkUrl: String = "",
    val attachments: List<SubmissionAttachment> = emptyList(),
    val draftId: String? = null,
    val lastSavedAt: LocalDateTime? = null,
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val isSubmitting: Boolean = false,
    val isDeleting: Boolean = false,
    val isDirty: Boolean = false,
    val success: Submission? = null,
    val message: String? = null,
    val error: String? = null
)

@HiltViewModel
class SubmitAssignmentViewModel @Inject constructor(
    private val savedStateHandle: SavedStateHandle,
    private val getStudentAssignmentDataUseCase: GetStudentAssignmentDataUseCase,
    private val saveStudentDraftUseCase: SaveStudentDraftUseCase,
    private val submitStudentDraftUseCase: SubmitStudentDraftUseCase,
    private val deleteStudentDraftUseCase: DeleteStudentDraftUseCase
) : ViewModel() {
    private val assignmentId: String = savedStateHandle["assignmentId"] ?: ""
    private val _uiState = MutableStateFlow(
        SubmitUiState(
            content = savedStateHandle["submission_content"] ?: "",
            linkUrl = savedStateHandle["submission_link"] ?: ""
        )
    )
    val uiState: StateFlow<SubmitUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        if (assignmentId.isBlank()) {
            _uiState.value = _uiState.value.copy(isLoading = false, error = "Không tìm thấy bài tập.")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            getStudentAssignmentDataUseCase(assignmentId).fold(
                onSuccess = { data ->
                    val draft = data.history.firstOrNull { it.isDraft }
                    val restoredContent = _uiState.value.content.ifBlank { draft?.content.orEmpty() }
                    val restoredLink = _uiState.value.linkUrl.ifBlank { draft?.linkUrl.orEmpty() }
                    savedStateHandle["submission_content"] = restoredContent
                    savedStateHandle["submission_link"] = restoredLink
                    _uiState.value = _uiState.value.copy(
                        assignment = data.item.assignment,
                        classroomName = data.classroom.name,
                        content = restoredContent,
                        linkUrl = restoredLink,
                        attachments = if (_uiState.value.attachments.isNotEmpty()) _uiState.value.attachments else draft?.attachments.orEmpty(),
                        draftId = draft?.id,
                        lastSavedAt = draft?.savedAt,
                        isLoading = false,
                        isDirty = false
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = it.message ?: "Không thể mở trình soạn bài."
                    )
                }
            )
        }
    }

    fun onContentChange(value: String) {
        savedStateHandle["submission_content"] = value
        _uiState.value = _uiState.value.copy(content = value, isDirty = true, error = null)
    }

    fun onLinkChange(value: String) {
        savedStateHandle["submission_link"] = value
        _uiState.value = _uiState.value.copy(linkUrl = value, isDirty = true, error = null)
    }

    fun addAttachments(newItems: List<SubmissionAttachment>) {
        val assignment = _uiState.value.assignment ?: return
        val merged = (_uiState.value.attachments + newItems)
            .distinctBy { it.uri }
        if (merged.size > 5) {
            _uiState.value = _uiState.value.copy(error = "Bạn chỉ được đính kèm tối đa 5 tệp.")
            return
        }
        val tooLarge = merged.firstOrNull { it.sizeBytes != null && it.sizeBytes > 25L * 1024 * 1024 }
        if (tooLarge != null) {
            _uiState.value = _uiState.value.copy(error = "Tệp ${tooLarge.displayName} vượt quá kích thước 25 MB.")
            return
        }
        val allowed = assignment.allowedFileTypes.map(String::lowercase)
        val unsupported = merged.firstOrNull {
            allowed.isNotEmpty() && it.displayName.substringAfterLast('.', "").lowercase() !in allowed
        }
        if (unsupported != null) {
            _uiState.value = _uiState.value.copy(error = "Định dạng tệp không được hỗ trợ: ${unsupported.displayName}.")
            return
        }
        _uiState.value = _uiState.value.copy(attachments = merged, isDirty = true, error = null)
    }

    fun removeAttachment(id: String) {
        _uiState.value = _uiState.value.copy(
            attachments = _uiState.value.attachments.filterNot { it.id == id },
            isDirty = true,
            error = null
        )
    }

    fun saveDraft(afterSave: (() -> Unit)? = null) {
        if (_uiState.value.isSaving || _uiState.value.isSubmitting) return
        if (!hasContent()) {
            _uiState.value = _uiState.value.copy(error = "Vui lòng nhập nội dung bài làm hoặc đính kèm tệp.")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, error = null)
            saveStudentDraftUseCase(
                assignmentId,
                _uiState.value.content,
                _uiState.value.linkUrl,
                _uiState.value.attachments
            ).fold(
                onSuccess = { draft ->
                    _uiState.value = _uiState.value.copy(
                        draftId = draft.id,
                        lastSavedAt = draft.savedAt,
                        isSaving = false,
                        isDirty = false,
                        message = "Đã lưu bản nháp."
                    )
                    afterSave?.invoke()
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        error = it.message ?: "Không thể lưu bản nháp."
                    )
                }
            )
        }
    }

    fun submit() {
        if (_uiState.value.isSubmitting || _uiState.value.isSaving) return
        if (!hasContent()) {
            _uiState.value = _uiState.value.copy(error = "Vui lòng nhập nội dung bài làm hoặc đính kèm tệp.")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            val draftResult = saveStudentDraftUseCase(
                assignmentId,
                _uiState.value.content,
                _uiState.value.linkUrl,
                _uiState.value.attachments
            )
            val draft = draftResult.getOrElse {
                _uiState.value = _uiState.value.copy(
                    isSubmitting = false,
                    error = it.message ?: "Không thể lưu bài làm. Nội dung của bạn vẫn được giữ lại."
                )
                return@launch
            }
            _uiState.value = _uiState.value.copy(draftId = draft.id, lastSavedAt = draft.savedAt)
            submitStudentDraftUseCase(draft.id).fold(
                onSuccess = { submission ->
                    savedStateHandle["submission_content"] = ""
                    savedStateHandle["submission_link"] = ""
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        isDirty = false,
                        success = submission,
                        message = "Nộp bài thành công."
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        isDirty = false,
                        error = it.message ?: "Không thể nộp bài. Nội dung của bạn vẫn được giữ lại."
                    )
                }
            )
        }
    }

    fun deleteDraft() {
        val draftId = _uiState.value.draftId ?: return
        if (_uiState.value.isDeleting || _uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isDeleting = true, error = null)
            deleteStudentDraftUseCase(draftId).fold(
                onSuccess = {
                    savedStateHandle["submission_content"] = ""
                    savedStateHandle["submission_link"] = ""
                    _uiState.value = _uiState.value.copy(
                        content = "",
                        linkUrl = "",
                        attachments = emptyList(),
                        draftId = null,
                        lastSavedAt = null,
                        isDeleting = false,
                        isDirty = false,
                        message = "Đã xóa bản nháp."
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isDeleting = false, error = it.message)
                }
            )
        }
    }

    fun consumeMessage() { _uiState.value = _uiState.value.copy(message = null, error = null) }

    private fun hasContent(): Boolean = _uiState.value.content.isNotBlank() ||
        _uiState.value.linkUrl.isNotBlank() || _uiState.value.attachments.isNotEmpty()
}
