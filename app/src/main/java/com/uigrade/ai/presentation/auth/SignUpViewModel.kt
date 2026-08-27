package com.uigrade.ai.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.usecase.SignUpUseCase
import com.uigrade.ai.ui.components.mascot.CatMascotPose
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SignUpUiState(
    val name: String = "",
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val nameError: String? = null,
    val emailError: String? = null,
    val passwordError: String? = null,
    val confirmPasswordError: String? = null,
    val currentFocusedField: String = "name",
    val guideText: String = "Chào bạn! Mình sẽ giúp bạn tạo tài khoản trong tích tắc ✨",
    val catPose: CatMascotPose = CatMascotPose.GUIDE,
    val isGuideError: Boolean = false,
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

    fun onNameChange(value: String) {
        _uiState.value = _uiState.value.copy(
            name = value,
            nameError = null,
            guideText = if (value.isNotBlank() && value.length >= 2) "Tên đẹp quá! Hãy tiếp tục nhé 🐾" else "Nhập tên của bạn để mình biết gọi bạn là gì.",
            isGuideError = false,
            catPose = CatMascotPose.GUIDE
        )
    }

    fun onEmailChange(value: String) {
        val trimmed = value.trim()
        val isValidEmail = android.util.Patterns.EMAIL_ADDRESS.matcher(trimmed).matches()
        _uiState.value = _uiState.value.copy(
            email = value,
            emailError = null,
            guideText = if (isValidEmail) "Email hợp lệ rồi, tuyệt vời! ⭐" else "Đừng quên dùng email đúng định dạng nhé.",
            isGuideError = false,
            catPose = CatMascotPose.GUIDE
        )
    }

    fun onPasswordChange(value: String) {
        val isValidPass = value.length >= 8
        _uiState.value = _uiState.value.copy(
            password = value,
            passwordError = null,
            confirmPasswordError = null,
            guideText = if (isValidPass) "Mật khẩu đủ an toàn rồi nè 🔐" else "Mật khẩu nên có ít nhất 8 ký tự nhé.",
            isGuideError = false,
            catPose = CatMascotPose.GUIDE
        )
    }

    fun onConfirmPasswordChange(value: String) {
        val isMatching = value == _uiState.value.password
        _uiState.value = _uiState.value.copy(
            confirmPassword = value,
            confirmPasswordError = null,
            guideText = if (isMatching && value.isNotBlank()) "Hai mật khẩu đã khớp hoàn hảo! 🎉" else "Nhập lại mật khẩu để xác nhận nào!",
            isGuideError = false,
            catPose = CatMascotPose.GUIDE
        )
    }

    fun onFieldFocused(field: String) {
        _uiState.value = _uiState.value.copy(
            currentFocusedField = field,
            guideText = when (field) {
                "name" -> "Hãy nhập tên để mình biết xưng hô nhé 🐾"
                "email" -> "Nhập email của bạn để nhận thông báo và kết quả UI ✉️"
                "password" -> "Tạo mật khẩu từ 8 ký tự trở lên để bảo vệ tài khoản 🔒"
                "confirmPassword" -> "Nhập lại mật khẩu vừa đặt để chắc chắn nha ✨"
                else -> "Mèo UIGrade luôn ở đây hỗ trợ bạn!"
            },
            isGuideError = false,
            catPose = CatMascotPose.GUIDE
        )
    }

    fun signUp() {
        val state = _uiState.value
        var hasError = false
        var nameErr: String? = null
        var emailErr: String? = null
        var passErr: String? = null
        var confirmErr: String? = null
        var feedbackText = ""

        if (state.name.trim().isBlank()) {
            nameErr = "Tên người dùng không được để trống"
            feedbackText = "Bạn chưa nhập tên kìa, cho mình biết tên nhé 🐾"
            hasError = true
        } else if (state.name.trim().length < 2) {
            nameErr = "Tên phải có ít nhất 2 ký tự"
            feedbackText = "Tên người dùng hơi ngắn, tối thiểu 2 ký tự nha."
            hasError = true
        }

        if (state.email.trim().isBlank()) {
            emailErr = "Email không được để trống"
            if (!hasError) feedbackText = "Đừng quên điền email nha bạn ơi!"
            hasError = true
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(state.email.trim()).matches()) {
            emailErr = "Email không đúng định dạng"
            if (!hasError) feedbackText = "Oops, email này chưa đúng định dạng rồi."
            hasError = true
        }

        if (state.password.length < 8) {
            passErr = "Mật khẩu phải có ít nhất 8 ký tự"
            if (!hasError) feedbackText = "Mật khẩu cần ít nhất 8 ký tự để bảo mật nha."
            hasError = true
        }

        if (state.password != state.confirmPassword) {
            confirmErr = "Mật khẩu xác nhận không khớp"
            if (!hasError) feedbackText = "Mật khẩu xác nhận chưa khớp, bạn kiểm tra lại nhé."
            hasError = true
        }

        if (hasError) {
            _uiState.value = _uiState.value.copy(
                nameError = nameErr,
                emailError = emailErr,
                passwordError = passErr,
                confirmPasswordError = confirmErr,
                guideText = feedbackText,
                isGuideError = true,
                catPose = CatMascotPose.GUIDE
            )
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, isGuideError = false)
            val result = signUpUseCase(state.name, state.email, state.password, state.confirmPassword)
            result.fold(
                onSuccess = { user ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isSuccess = true,
                        registeredUser = user,
                        catPose = CatMascotPose.SUCCESS,
                        guideText = "Tuyệt vời! Tài khoản của bạn đã được tạo thành công 🎉"
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        emailError = error.message,
                        guideText = error.message ?: "Đăng ký không thành công, vui lòng thử lại.",
                        isGuideError = true,
                        catPose = CatMascotPose.GUIDE
                    )
                }
            )
        }
    }
}
