package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.repository.UserRepository
import kotlinx.coroutines.delay
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockUserRepository @Inject constructor(
    private val dataStore: MockDataStore
) : UserRepository {

    private val users get() = dataStore.users

    override suspend fun getAllUsers(): List<User> {
        delay(400)
        return users.toList()
    }

    override suspend fun getUserById(id: String): User? {
        delay(300)
        return users.find { it.id == id }
    }

    override suspend fun getUsersByRole(role: UserRole): List<User> {
        delay(400)
        return users.filter { it.role == role }
    }

    override suspend fun updateUser(user: User): User {
        delay(600)
        val index = users.indexOfFirst { it.id == user.id }
        if (index >= 0) users[index] = user
        return user
    }

    override suspend fun deleteUser(id: String): Boolean {
        delay(400)
        return users.removeIf { it.id == id }
    }
}
