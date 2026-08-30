/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.data.repository.MockAdminRepository
import com.uigrade.ai.data.repository.MockAuthRepository
import com.uigrade.ai.domain.usecase.AdminOperationsUseCase
import com.uigrade.ai.domain.usecase.LogoutUseCase
import com.uigrade.ai.presentation.admin.AdminDashboardViewModel
import com.uigrade.ai.presentation.admin.AdminRubricViewModel
import com.uigrade.ai.presentation.admin.UserManagementViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AdminViewModelErrorTest {
    private val dispatcher = StandardTestDispatcher()

    @Before
    fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `failed user mutation is exposed as error and preserves data`() = runTest(dispatcher) {
        val fixture = adminFixture()
        val viewModel = UserManagementViewModel(fixture.operations)
        advanceUntilIdle()
        val protectedStudent = viewModel.uiState.value.allUsers.first { it.id == "s1" }

        viewModel.deleteUser(protectedStudent)
        advanceUntilIdle()

        assertNotNull(viewModel.uiState.value.errorMessage)
        assertNull(viewModel.uiState.value.successMessage)
        assertTrue(viewModel.uiState.value.allUsers.any { it.id == protectedStudent.id })
    }

    @Test
    fun `failed rubric mutation is not announced as success`() = runTest(dispatcher) {
        val fixture = adminFixture()
        val viewModel = AdminRubricViewModel(fixture.operations)
        advanceUntilIdle()
        val usedRubric = viewModel.uiState.value.allRubrics.first { it.usedByAssignmentIds.isNotEmpty() }

        viewModel.delete(usedRubric)
        advanceUntilIdle()

        assertNotNull(viewModel.uiState.value.errorMessage)
        assertNull(viewModel.uiState.value.successMessage)
        assertTrue(viewModel.uiState.value.allRubrics.any { it.id == usedRubric.id })
    }

    @Test
    fun `expired admin session reports permission error`() = runTest(dispatcher) {
        val fixture = adminFixture()
        val viewModel = AdminDashboardViewModel(fixture.operations, LogoutUseCase(fixture.auth))
        advanceUntilIdle()
        fixture.auth.logout()

        viewModel.toggleAiFeedback(false)
        advanceUntilIdle()

        assertNotNull(viewModel.uiState.value.errorMessage)
        assertNull(viewModel.uiState.value.successMessage)
    }

    private suspend fun adminFixture(): Fixture {
        val store = MockDataStore()
        val auth = MockAuthRepository(store)
        checkNotNull(auth.login("admin@uigrade.ai", "password123"))
        return Fixture(
            auth = auth,
            operations = AdminOperationsUseCase(auth, MockAdminRepository(store))
        )
    }

    private data class Fixture(
        val auth: MockAuthRepository,
        val operations: AdminOperationsUseCase
    )
}
