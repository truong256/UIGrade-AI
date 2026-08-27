package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockData
import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.repository.AuthRepository
import kotlinx.coroutines.delay
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockAuthRepository @Inject constructor(
    private val dataStore: MockDataStore
) : AuthRepository {

    private var currentUser: User? = null

    // Stores passwords for users registered via signUp (email → password)
    private val registeredPasswords = mutableMapOf<String, String>()

    override suspend fun login(email: String, password: String): User? {
        delay(600) // Simulate network latency
        val credential = MockData.credentials[email]
        if (credential != null && credential.first == password) {
            val userId = credential.second
            val user = dataStore.users.find { it.id == userId } ?: return null
            currentUser = user
            return user
        }

        // Also check newly registered users – must verify password too
        val trimmedEmail = email.trim()
        val storedPassword = registeredPasswords[trimmedEmail.lowercase()]
        if (storedPassword != null && storedPassword == password) {
            val foundUser = dataStore.users.find { it.email.equals(trimmedEmail, ignoreCase = true) }
            if (foundUser != null) {
                currentUser = foundUser
                return foundUser
            }
        }

        return null
    }

    override suspend fun signUp(
        name: String,
        email: String,
        password: String,
        role: UserRole
    ): User? {
        delay(600) // Simulate network latency
        val trimmedEmail = email.trim()
        val exists = dataStore.users.any { it.email.equals(trimmedEmail, ignoreCase = true) }
        if (exists) {
            throw IllegalArgumentException("Email này đã được sử dụng")
        }

        if (role == UserRole.ADMIN) {
            throw IllegalArgumentException("Không thể tự đăng ký vai trò Quản trị viên")
        }

        val newId = when (role) {
            UserRole.STUDENT -> "s_${System.currentTimeMillis() % 10000}"
            UserRole.LECTURER -> "l_${System.currentTimeMillis() % 10000}"
            UserRole.ADMIN -> "a_${System.currentTimeMillis() % 10000}"
        }
        val studentId = if (role == UserRole.STUDENT) {
            "SV${(dataStore.users.count { it.role == UserRole.STUDENT } + 1).toString().padStart(3, '0')}"
        } else null

        val newUser = User(
            id = newId,
            name = name.trim(),
            email = trimmedEmail,
            role = role,
            studentId = studentId
        )

        dataStore.users.add(newUser)
        registeredPasswords[trimmedEmail.lowercase()] = password
        currentUser = newUser
        return newUser
    }

    override suspend fun getCurrentUser(): User? = currentUser

    override suspend fun logout() {
        delay(200)
        currentUser = null
    }
}
