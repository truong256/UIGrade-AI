package com.uigrade.ai.presentation.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.usecase.GetAssignmentsForStudentUseCase
import com.uigrade.ai.domain.usecase.GetCurrentUserUseCase
import com.uigrade.ai.domain.usecase.LogoutUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class StudentDashboardUiState(
    val user: User? = null,
    val assignments: List<AssignmentWithStatus> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class StudentDashboardViewModel @Inject constructor(
    private val getCurrentUserUseCase: GetCurrentUserUseCase,
    private val getAssignmentsForStudentUseCase: GetAssignmentsForStudentUseCase,
    private val logoutUseCase: LogoutUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(StudentDashboardUiState())
    val uiState: StateFlow<StudentDashboardUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val user = getCurrentUserUseCase()
                val assignments = if (user != null) getAssignmentsForStudentUseCase(user.id) else emptyList()
                _uiState.value = _uiState.value.copy(user = user, assignments = assignments, isLoading = false)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message ?: "Unknown error")
            }
        }
    }

    fun logout(onDone: () -> Unit) {
        viewModelScope.launch { logoutUseCase(); onDone() }
    }
}
