package com.uigrade.ai.presentation.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.usecase.ChangePasswordUseCase
import com.uigrade.ai.domain.usecase.GetCurrentUserUseCase
import com.uigrade.ai.domain.usecase.LogoutUseCase
import com.uigrade.ai.domain.usecase.UpdateStudentProfileUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class StudentProfileUiState(
    val user: User? = null,
    val name: String = "",
    val studentId: String = "",
    val phone: String = "",
    val department: String = "",
    val organization: String = "",
    val bio: String = "",
    val isEditing: Boolean = false,
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val isLoggingOut: Boolean = false,
    val message: String? = null,
    val error: String? = null
)

@HiltViewModel
class StudentProfileViewModel @Inject constructor(
    private val getCurrentUserUseCase: GetCurrentUserUseCase,
    private val updateStudentProfileUseCase: UpdateStudentProfileUseCase,
    private val logoutUseCase: LogoutUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(StudentProfileUiState())
    val uiState: StateFlow<StudentProfileUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val user = runCatching { getCurrentUserUseCase() }.getOrNull()
            if (user == null) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
            } else {
                _uiState.value = StudentProfileUiState(
                    user = user,
                    name = user.name,
                    studentId = user.studentId.orEmpty(),
                    phone = user.phone,
                    department = user.department,
                    organization = user.organization,
                    bio = user.bio,
                    isLoading = false
                )
            }
        }
    }

    fun setEditing(value: Boolean) {
        val user = _uiState.value.user
        _uiState.value = if (!value && user != null) {
            _uiState.value.copy(
                name = user.name,
                studentId = user.studentId.orEmpty(),
                phone = user.phone,
                department = user.department,
                organization = user.organization,
                bio = user.bio,
                isEditing = false,
                error = null
            )
        } else _uiState.value.copy(isEditing = value, error = null)
    }

    fun updateName(value: String) { _uiState.value = _uiState.value.copy(name = value, error = null) }
    fun updateStudentId(value: String) { _uiState.value = _uiState.value.copy(studentId = value, error = null) }
    fun updatePhone(value: String) { _uiState.value = _uiState.value.copy(phone = value, error = null) }
    fun updateDepartment(value: String) { _uiState.value = _uiState.value.copy(department = value, error = null) }
    fun updateOrganization(value: String) { _uiState.value = _uiState.value.copy(organization = value, error = null) }
    fun updateBio(value: String) { _uiState.value = _uiState.value.copy(bio = value, error = null) }

    fun save() {
        if (_uiState.value.isSaving) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, error = null)
            updateStudentProfileUseCase(
                name = _uiState.value.name,
                studentId = _uiState.value.studentId,
                phone = _uiState.value.phone,
                department = _uiState.value.department,
                organization = _uiState.value.organization,
                bio = _uiState.value.bio,
                avatarUrl = _uiState.value.user?.avatarUrl
            ).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        user = it,
                        isSaving = false,
                        isEditing = false,
                        message = "Đã cập nhật hồ sơ."
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        error = it.message ?: "Không thể cập nhật hồ sơ."
                    )
                }
            )
        }
    }

    fun logout(onDone: () -> Unit) {
        if (_uiState.value.isLoggingOut) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoggingOut = true)
            runCatching { logoutUseCase() }
                .onSuccess { onDone() }
                .onFailure {
                    _uiState.value = _uiState.value.copy(isLoggingOut = false, error = "Không thể đăng xuất.")
                }
        }
    }

    fun consumeMessage() { _uiState.value = _uiState.value.copy(message = null, error = null) }
}

data class StudentPasswordUiState(
    val currentPassword: String = "",
    val newPassword: String = "",
    val confirmPassword: String = "",
    val isSubmitting: Boolean = false,
    val success: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class StudentPasswordViewModel @Inject constructor(
    private val changePasswordUseCase: ChangePasswordUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(StudentPasswordUiState())
    val uiState: StateFlow<StudentPasswordUiState> = _uiState.asStateFlow()

    fun updateCurrent(value: String) { _uiState.value = _uiState.value.copy(currentPassword = value, error = null) }
    fun updateNew(value: String) { _uiState.value = _uiState.value.copy(newPassword = value, error = null) }
    fun updateConfirm(value: String) { _uiState.value = _uiState.value.copy(confirmPassword = value, error = null) }

    fun submit() {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            changePasswordUseCase(
                _uiState.value.currentPassword,
                _uiState.value.newPassword,
                _uiState.value.confirmPassword
            ).fold(
                onSuccess = { _uiState.value = StudentPasswordUiState(success = true) },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        error = it.message ?: "Không thể đổi mật khẩu."
                    )
                }
            )
        }
    }
}
