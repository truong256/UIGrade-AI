package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.repository.UserRepository
import javax.inject.Inject

class GetAllUsersUseCase @Inject constructor(private val repository: UserRepository) {
    suspend operator fun invoke(): List<User> = repository.getAllUsers()
}

class GetUsersByRoleUseCase @Inject constructor(private val repository: UserRepository) {
    suspend operator fun invoke(role: UserRole): List<User> = repository.getUsersByRole(role)
}

class UpdateUserUseCase @Inject constructor(private val repository: UserRepository) {
    suspend operator fun invoke(user: User): Result<User> {
        if (user.name.isBlank()) return Result.failure(IllegalArgumentException("Tên không được để trống"))
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(user.email).matches())
            return Result.failure(IllegalArgumentException("Email không đúng định dạng"))
        return try { Result.success(repository.updateUser(user)) } catch (e: Exception) { Result.failure(e) }
    }
}

class DeleteUserUseCase @Inject constructor(private val repository: UserRepository) {
    suspend operator fun invoke(userId: String): Result<Boolean> {
        return try { Result.success(repository.deleteUser(userId)) } catch (e: Exception) { Result.failure(e) }
    }
}
