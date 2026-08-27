package com.uigrade.ai.domain.repository

import com.uigrade.ai.domain.model.User

/**
 * Authentication repository interface.
 * Mock implementation is used in MVP; swap for Firebase/JWT without changing UI.
 */
interface AuthRepository {
    /**
     * Attempt login with email and password.
     * @return the authenticated User on success, null on invalid credentials.
     */
    suspend fun login(email: String, password: String): User?

    /**
     * Register a new user account (Student by default).
     * @return the newly registered User on success, null on error.
     */
    suspend fun signUp(name: String, email: String, password: String): User?

    /**
     * Returns the currently authenticated user, or null if not logged in.
     */
    suspend fun getCurrentUser(): User?

    /**
     * Clears the current session.
     */
    suspend fun logout()
}
