package com.uigrade.ai

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.data.repository.MockAuthRepository
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.usecase.SignUpUseCase
import com.uigrade.ai.presentation.auth.SignUpViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class RegisterViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var dataStore: MockDataStore
    private lateinit var authRepository: MockAuthRepository
    private lateinit var signUpUseCase: SignUpUseCase
    private lateinit var viewModel: SignUpViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        dataStore = MockDataStore()
        authRepository = MockAuthRepository(dataStore)
        signUpUseCase = SignUpUseCase(authRepository)
        viewModel = SignUpViewModel(signUpUseCase)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `register student account successfully`() = runTest(testDispatcher) {
        viewModel.onRoleChange(UserRole.STUDENT)
        viewModel.onNameChange("Nguyễn Văn A")
        viewModel.onEmailChange("nguyenvana@example.com")
        viewModel.onPasswordChange("password123")
        viewModel.onConfirmPasswordChange("password123")

        var callbackRole: String? = null
        viewModel.signUp { role ->
            callbackRole = role
        }

        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state.isSuccess)
        assertFalse(state.isLoading)
        assertNotNull(state.registeredUser)
        assertEquals(UserRole.STUDENT, state.registeredUser?.role)
        assertEquals("Nguyễn Văn A", state.registeredUser?.name)
        assertEquals("nguyenvana@example.com", state.registeredUser?.email)
        assertNotNull(state.registeredUser?.studentId)
        assertEquals("STUDENT", callbackRole)
    }

    @Test
    fun `register lecturer account successfully`() = runTest(testDispatcher) {
        viewModel.onRoleChange(UserRole.LECTURER)
        viewModel.onNameChange("Trần Thị B")
        viewModel.onEmailChange("tranthib@example.com")
        viewModel.onPasswordChange("securePass2026")
        viewModel.onConfirmPasswordChange("securePass2026")

        var callbackRole: String? = null
        viewModel.signUp { role ->
            callbackRole = role
        }

        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state.isSuccess)
        assertFalse(state.isLoading)
        assertNotNull(state.registeredUser)
        assertEquals(UserRole.LECTURER, state.registeredUser?.role)
        assertEquals("Trần Thị B", state.registeredUser?.name)
        assertEquals("tranthib@example.com", state.registeredUser?.email)
        assertNull(state.registeredUser?.studentId) // Lecturer has no studentId
        assertEquals("LECTURER", callbackRole)
    }

    @Test
    fun `rejects registration when full name is empty or too short`() = runTest(testDispatcher) {
        viewModel.onRoleChange(UserRole.STUDENT)
        viewModel.onNameChange("   ")
        viewModel.onEmailChange("valid@example.com")
        viewModel.onPasswordChange("password123")
        viewModel.onConfirmPasswordChange("password123")

        viewModel.signUp()
        testScheduler.advanceUntilIdle()

        assertEquals("Vui lòng nhập họ và tên", viewModel.uiState.value.nameError)
        assertFalse(viewModel.uiState.value.isSuccess)

        // Too short (< 2 chars)
        viewModel.onNameChange("A")
        viewModel.signUp()
        testScheduler.advanceUntilIdle()

        assertEquals("Họ và tên phải có ít nhất 2 ký tự", viewModel.uiState.value.nameError)
    }

    @Test
    fun `rejects registration when email is empty or invalid format`() = runTest(testDispatcher) {
        viewModel.onRoleChange(UserRole.STUDENT)
        viewModel.onNameChange("Lê Hoàng")
        viewModel.onEmailChange("")
        viewModel.onPasswordChange("password123")
        viewModel.onConfirmPasswordChange("password123")

        viewModel.signUp()
        testScheduler.advanceUntilIdle()

        assertEquals("Vui lòng nhập địa chỉ email", viewModel.uiState.value.emailError)

        // Invalid format
        viewModel.onEmailChange("invalid-email-format")
        viewModel.signUp()
        testScheduler.advanceUntilIdle()

        assertEquals("Email không hợp lệ", viewModel.uiState.value.emailError)
    }

    @Test
    fun `rejects registration when password is less than 8 characters`() = runTest(testDispatcher) {
        viewModel.onRoleChange(UserRole.STUDENT)
        viewModel.onNameChange("Lê Hoàng")
        viewModel.onEmailChange("lehoang@example.com")
        viewModel.onPasswordChange("short")
        viewModel.onConfirmPasswordChange("short")

        viewModel.signUp()
        testScheduler.advanceUntilIdle()

        assertEquals("Mật khẩu phải có ít nhất 8 ký tự", viewModel.uiState.value.passwordError)
        assertFalse(viewModel.uiState.value.isSuccess)
    }

    @Test
    fun `rejects registration when confirm password does not match`() = runTest(testDispatcher) {
        viewModel.onRoleChange(UserRole.STUDENT)
        viewModel.onNameChange("Lê Hoàng")
        viewModel.onEmailChange("lehoang@example.com")
        viewModel.onPasswordChange("password123")
        viewModel.onConfirmPasswordChange("differentPass123")

        viewModel.signUp()
        testScheduler.advanceUntilIdle()

        assertEquals("Mật khẩu xác nhận không khớp", viewModel.uiState.value.confirmPasswordError)
        assertFalse(viewModel.uiState.value.isSuccess)
    }

    @Test
    fun `rejects registration when email is already registered in repository`() = runTest(testDispatcher) {
        // student@uigrade.ai already exists in MockData
        viewModel.onRoleChange(UserRole.STUDENT)
        viewModel.onNameChange("Sinh Viên Mới")
        viewModel.onEmailChange("student@uigrade.ai")
        viewModel.onPasswordChange("password123")
        viewModel.onConfirmPasswordChange("password123")

        viewModel.signUp()
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isSuccess)
        assertFalse(state.isLoading)
        assertEquals("Email này đã được sử dụng", state.emailError)
    }

    @Test
    fun `cannot select Admin role in ViewModel`() = runTest(testDispatcher) {
        val initialRole = viewModel.uiState.value.role
        viewModel.onRoleChange(UserRole.ADMIN)
        // Role must not change to ADMIN
        assertNotEquals(UserRole.ADMIN, viewModel.uiState.value.role)
        assertEquals(initialRole, viewModel.uiState.value.role)
    }

    @Test
    fun `use case directly rejects Admin role registration`() = runTest(testDispatcher) {
        val result = signUpUseCase(
            name = "Quản Trị Viên",
            email = "admin2@uigrade.ai",
            password = "password123",
            confirmPassword = "password123",
            role = UserRole.ADMIN
        )

        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("Quản trị viên") == true)
    }
}
