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
