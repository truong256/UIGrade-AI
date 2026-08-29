package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockData
import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.model.UserAccountStatus
import com.uigrade.ai.domain.repository.AuthRepository
import kotlinx.coroutines.delay
import java.security.MessageDigest
import java.time.LocalDateTime
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockAuthRepository @Inject constructor(
    private val dataStore: MockDataStore
) : AuthRepository {

    private var currentUser: User? = null

    // Stores one-way password hashes only (email → SHA-256 hash) for the mock session.
    private val registeredPasswordHashes = mutableMapOf<String, String>()

    override suspend fun login(email: String, password: String): User? {
        delay(600) // Simulate network latency
        val normalizedEmail = email.trim().lowercase()
        val passwordHash = hashPassword(password)
        val demoCredential = MockData.credentialHashes[normalizedEmail]
        val expectedHash = registeredPasswordHashes[normalizedEmail] ?: demoCredential?.first
        if (expectedHash == null || expectedHash != passwordHash) return null

        val user = demoCredential?.second
            ?.let { id -> dataStore.users.find { it.id == id } }
            ?: dataStore.users.find { it.email.equals(normalizedEmail, ignoreCase = true) }
            ?: return null
        if (user.accountStatus != UserAccountStatus.ACTIVE) return null
        val loggedIn = user.copy(lastLoginAt = LocalDateTime.now())
        val index = dataStore.users.indexOfFirst { it.id == user.id }
        if (index >= 0) dataStore.users[index] = loggedIn
        currentUser = loggedIn
        return loggedIn
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
        registeredPasswordHashes[trimmedEmail.lowercase()] = hashPassword(password)
        currentUser = newUser
        return newUser
    }

    override suspend fun getCurrentUser(): User? {
        val currentId = currentUser?.id ?: return null
        val user = dataStore.users.find { it.id == currentId }
        if (user?.accountStatus != UserAccountStatus.ACTIVE) {
            currentUser = null
            return null
        }
        currentUser = user
        return user
    }

    override suspend fun logout() {
        delay(200)
        currentUser = null
    }

    override suspend fun changePassword(currentPassword: String, newPassword: String): Result<Unit> {
        delay(500)
        val user = getCurrentUser()
            ?: return Result.failure(IllegalArgumentException("Bạn chưa đăng nhập"))
        val normalizedEmail = user.email.lowercase()
        val currentHash = hashPassword(currentPassword)
        val expectedHash = registeredPasswordHashes[normalizedEmail]
            ?: MockData.credentialHashes[normalizedEmail]?.first
        if (expectedHash == null || expectedHash != currentHash) {
            return Result.failure(IllegalArgumentException("Mật khẩu hiện tại không chính xác"))
        }
        registeredPasswordHashes[normalizedEmail] = hashPassword(newPassword)
        return Result.success(Unit)
    }

    private fun hashPassword(value: String): String = MessageDigest
        .getInstance("SHA-256")
        .digest(value.toByteArray(Charsets.UTF_8))
        .joinToString("") { "%02x".format(it) }
}
