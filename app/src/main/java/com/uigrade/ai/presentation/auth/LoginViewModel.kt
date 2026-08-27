package com.uigrade.ai.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.usecase.GetCurrentUserUseCase
import com.uigrade.ai.domain.usecase.LoginUseCase
import com.uigrade.ai.domain.usecase.LogoutUseCase
import com.uigrade.ai.ui.components.mascot.CatMascotPose
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val emailError: String? = null,
    val passwordError: String? = null,
    val guideText: String = "Chào mừng bạn quay trở lại! Sẵn sàng học tiếp nào 🎓",
    val catPose: CatMascotPose = CatMascotPose.GUIDE,
    val isGuideError: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null,
    val loggedInUser: User? = null
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase,
    private val getCurrentUserUseCase: GetCurrentUserUseCase,
    private val logoutUseCase: LogoutUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onEmailChange(value: String) {
        _uiState.value = _uiState.value.copy(
            email = value,
            emailError = null,
            error = null,
            guideText = "Nhập email tài khoản của bạn nhé ✉️",
            isGuideError = false,
            catPose = CatMascotPose.GUIDE
        )
    }

    fun onPasswordChange(value: String) {
        _uiState.value = _uiState.value.copy(
            password = value,
            passwordError = null,
            error = null,
            guideText = "Nhập mật khẩu để tiếp tục nha 🔐",
            isGuideError = false,
            catPose = CatMascotPose.GUIDE
        )
    }

    fun selectDemoAccount(email: String, roleName: String) {
        _uiState.value = _uiState.value.copy(
            email = email,
            password = "password123",
            emailError = null,
            passwordError = null,
            error = null,
            guideText = "Đã chọn tài khoản $roleName! Bấm Đăng nhập để vào hệ thống nhé ⭐",
            isGuideError = false,
            catPose = CatMascotPose.GUIDE
        )
    }

    fun login() {
        val state = _uiState.value
        var hasError = false
        var emailErr: String? = null
        var passErr: String? = null

        if (state.email.trim().isBlank()) {
            emailErr = "Email không được để trống"
            hasError = true
        }
        if (state.password.isBlank()) {
            passErr = "Mật khẩu không được để trống"
            hasError = true
        }

        if (hasError) {
            _uiState.value = _uiState.value.copy(
                emailError = emailErr,
                passwordError = passErr,
                guideText = "Bạn kiểm tra lại email và mật khẩu giúp mình nhé 🐾",
                isGuideError = true,
                catPose = CatMascotPose.GUIDE
            )
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null, isGuideError = false)
            val result = loginUseCase(state.email, state.password)
            result.fold(
                onSuccess = { user ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        loggedInUser = user,
                        catPose = CatMascotPose.SUCCESS,
                        guideText = "Đăng nhập thành công! Chào ${user.name} 🎉"
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message,
                        guideText = e.message ?: "Email hoặc mật khẩu không chính xác.",
                        isGuideError = true,
                        catPose = CatMascotPose.GUIDE
                    )
                }
            )
        }
    }

    fun logout() {
        viewModelScope.launch { logoutUseCase() }
    }

    fun checkExistingSession() {
        viewModelScope.launch {
            val user = getCurrentUserUseCase()
            if (user != null) _uiState.value = _uiState.value.copy(loggedInUser = user)
        }
    }
}
