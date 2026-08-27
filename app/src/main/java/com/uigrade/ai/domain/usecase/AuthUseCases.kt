package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.repository.AuthRepository
import javax.inject.Inject

class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(email: String, password: String): Result<User> {
        val trimmedEmail = email.trim()
        if (trimmedEmail.isBlank()) {
            return Result.failure(IllegalArgumentException("Email không được để trống"))
        }
        val emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$".toRegex()
        if (!emailRegex.matches(trimmedEmail)) {
            return Result.failure(IllegalArgumentException("Email không hợp lệ"))
        }
        if (password.isBlank()) {
            return Result.failure(IllegalArgumentException("Mật khẩu không được để trống"))
        }
        val user = authRepository.login(trimmedEmail, password)
            ?: return Result.failure(IllegalArgumentException("Email hoặc mật khẩu không chính xác"))
        return Result.success(user)
    }
}

class SignUpUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(
        name: String,
        email: String,
        password: String,
        confirmPassword: String,
        role: UserRole? = UserRole.STUDENT
    ): Result<User> {
        if (role == null) {
            return Result.failure(IllegalArgumentException("Vui lòng chọn vai trò"))
        }
        if (role == UserRole.ADMIN) {
            return Result.failure(IllegalArgumentException("Không thể tự đăng ký vai trò Quản trị viên"))
        }
        val trimmedName = name.trim()
        val trimmedEmail = email.trim()

        if (trimmedName.isBlank()) {
            return Result.failure(IllegalArgumentException("Vui lòng nhập họ và tên"))
        }
        if (trimmedName.length < 2) {
            return Result.failure(IllegalArgumentException("Họ và tên phải có ít nhất 2 ký tự"))
        }
        if (trimmedEmail.isBlank()) {
            return Result.failure(IllegalArgumentException("Vui lòng nhập địa chỉ email"))
        }
        val emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$".toRegex()
        if (!emailRegex.matches(trimmedEmail)) {
            return Result.failure(IllegalArgumentException("Email không hợp lệ"))
        }
        if (password.isBlank()) {
            return Result.failure(IllegalArgumentException("Vui lòng nhập mật khẩu"))
        }
        if (password.length < 8) {
            return Result.failure(IllegalArgumentException("Mật khẩu phải có ít nhất 8 ký tự"))
        }
        if (password != confirmPassword) {
            return Result.failure(IllegalArgumentException("Mật khẩu xác nhận không khớp"))
        }

        return try {
            val user = authRepository.signUp(trimmedName, trimmedEmail, password, role)
                ?: return Result.failure(IllegalArgumentException("Không thể tạo tài khoản. Vui lòng thử lại"))
            Result.success(user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class GetCurrentUserUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(): User? = authRepository.getCurrentUser()
}

class LogoutUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke() = authRepository.logout()
}
