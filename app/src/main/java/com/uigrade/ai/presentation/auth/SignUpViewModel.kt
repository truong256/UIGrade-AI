package com.uigrade.ai.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.usecase.SignUpUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SignUpUiState(
    val role: UserRole? = UserRole.STUDENT,
    val name: String = "",
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val roleError: String? = null,
    val nameError: String? = null,
    val emailError: String? = null,
    val passwordError: String? = null,
    val confirmPasswordError: String? = null,
    val generalError: String? = null,
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val registeredUser: User? = null
)

@HiltViewModel
class SignUpViewModel @Inject constructor(
    private val signUpUseCase: SignUpUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SignUpUiState())
    val uiState: StateFlow<SignUpUiState> = _uiState.asStateFlow()

    private val emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$".toRegex()

    fun onRoleChange(role: UserRole) {
        if (role == UserRole.ADMIN) return // Safety: never allow ADMIN registration
        _uiState.value = _uiState.value.copy(
            role = role,
            roleError = null,
            generalError = null
        )
    }

    fun onNameChange(value: String) {
        _uiState.value = _uiState.value.copy(
            name = value,
            nameError = null,
            generalError = null
        )
    }

    fun onEmailChange(value: String) {
        _uiState.value = _uiState.value.copy(
            email = value,
            emailError = null,
            generalError = null
        )
    }

    fun onPasswordChange(value: String) {
        _uiState.value = _uiState.value.copy(
            password = value,
            passwordError = null,
            confirmPasswordError = null,
            generalError = null
        )
    }

    fun onConfirmPasswordChange(value: String) {
        _uiState.value = _uiState.value.copy(
            confirmPassword = value,
            confirmPasswordError = null,
            generalError = null
        )
    }

    fun signUp(onSuccess: ((role: String) -> Unit)? = null) {
        if (_uiState.value.isLoading) return // Prevent multiple concurrent submissions

        val state = _uiState.value
        var hasError = false

        var roleErr: String? = null
        var nameErr: String? = null
        var emailErr: String? = null
        var passErr: String? = null
        var confirmErr: String? = null

        if (state.role == null) {
            roleErr = "Vui lòng chọn vai trò"
            hasError = true
        } else if (state.role == UserRole.ADMIN) {
            roleErr = "Không thể tự đăng ký vai trò Quản trị viên"
            hasError = true
        }

        val trimmedName = state.name.trim()
        if (trimmedName.isBlank()) {
            nameErr = "Vui lòng nhập họ và tên"
            hasError = true
        } else if (trimmedName.length < 2) {
            nameErr = "Họ và tên phải có ít nhất 2 ký tự"
            hasError = true
        }

        val trimmedEmail = state.email.trim()
        if (trimmedEmail.isBlank()) {
            emailErr = "Vui lòng nhập địa chỉ email"
            hasError = true
        } else if (!emailRegex.matches(trimmedEmail)) {
            emailErr = "Email không hợp lệ"
            hasError = true
        }

        if (state.password.isBlank()) {
            passErr = "Vui lòng nhập mật khẩu"
            hasError = true
        } else if (state.password.length < 8) {
            passErr = "Mật khẩu phải có ít nhất 8 ký tự"
            hasError = true
        }

        if (state.confirmPassword.isBlank()) {
            confirmErr = "Vui lòng xác nhận mật khẩu"
            hasError = true
        } else if (state.password != state.confirmPassword) {
            confirmErr = "Mật khẩu xác nhận không khớp"
            hasError = true
        }

        if (hasError) {
            _uiState.value = _uiState.value.copy(
                roleError = roleErr,
                nameError = nameErr,
                emailError = emailErr,
                passwordError = passErr,
                confirmPasswordError = confirmErr
            )
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = true,
                generalError = null
            )
            val result = signUpUseCase(
                name = trimmedName,
                email = trimmedEmail,
                password = state.password,
                confirmPassword = state.confirmPassword,
                role = state.role
            )
            result.fold(
                onSuccess = { user ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isSuccess = true,
                        registeredUser = user
                    )
                    onSuccess?.invoke(user.role.name)
                },
                onFailure = { error ->
                    val errorMsg = error.message ?: "Không thể tạo tài khoản. Vui lòng thử lại"
                    val isEmailDuplicated = errorMsg.contains("đã được sử dụng", ignoreCase = true) ||
                            errorMsg.contains("đã tồn tại", ignoreCase = true) ||
                            errorMsg.contains("đã được đăng ký", ignoreCase = true)

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        emailError = if (isEmailDuplicated) "Email này đã được sử dụng" else null,
                        generalError = if (!isEmailDuplicated) errorMsg else null
                    )
                }
            )
        }
    }

    fun clearGeneralError() {
        _uiState.value = _uiState.value.copy(generalError = null)
    }
}
