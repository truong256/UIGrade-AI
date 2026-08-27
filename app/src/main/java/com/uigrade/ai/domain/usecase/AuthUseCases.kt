package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.User
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
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(trimmedEmail).matches()) {
            return Result.failure(IllegalArgumentException("Email không đúng định dạng"))
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
        confirmPassword: String
    ): Result<User> {
        val trimmedName = name.trim()
        val trimmedEmail = email.trim()

        if (trimmedName.isBlank()) {
            return Result.failure(IllegalArgumentException("Tên người dùng không được để trống"))
        }
        if (trimmedName.length < 2) {
            return Result.failure(IllegalArgumentException("Tên người dùng phải có ít nhất 2 ký tự"))
        }
        if (trimmedEmail.isBlank()) {
            return Result.failure(IllegalArgumentException("Email không được để trống"))
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(trimmedEmail).matches()) {
            return Result.failure(IllegalArgumentException("Email không đúng định dạng"))
        }
        if (password.length < 8) {
            return Result.failure(IllegalArgumentException("Mật khẩu phải có ít nhất 8 ký tự"))
        }
        if (password != confirmPassword) {
            return Result.failure(IllegalArgumentException("Mật khẩu xác nhận không khớp"))
        }

        return try {
            val user = authRepository.signUp(trimmedName, trimmedEmail, password)
                ?: return Result.failure(IllegalArgumentException("Đăng ký không thành công"))
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
