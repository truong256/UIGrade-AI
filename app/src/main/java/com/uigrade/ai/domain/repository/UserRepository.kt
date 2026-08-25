package com.uigrade.ai.domain.repository

import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserRole

interface UserRepository {
    suspend fun getAllUsers(): List<User>
    suspend fun getUserById(id: String): User?
    suspend fun getUsersByRole(role: UserRole): List<User>
    suspend fun updateUser(user: User): User
    suspend fun deleteUser(id: String): Boolean
}
