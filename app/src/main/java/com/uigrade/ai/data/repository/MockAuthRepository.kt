package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockData
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.repository.AuthRepository
import kotlinx.coroutines.delay
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockAuthRepository @Inject constructor() : AuthRepository {

    private var currentUser: User? = null

    override suspend fun login(email: String, password: String): User? {
        delay(800) // Simulate network latency
        val credential = MockData.credentials[email] ?: return null
        if (credential.first != password) return null
        val userId = credential.second
        val user = MockData.allUsers.find { it.id == userId } ?: return null
        currentUser = user
        return user
    }

    override suspend fun getCurrentUser(): User? = currentUser

    override suspend fun logout() {
        delay(200)
        currentUser = null
    }
}
