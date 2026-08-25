package com.uigrade.ai.presentation.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.*
import com.uigrade.ai.domain.repository.StatsRepository
import com.uigrade.ai.domain.usecase.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AdminDashboardUiState(
    val stats: AdminStats? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class AdminDashboardViewModel @Inject constructor(
    private val statsRepository: StatsRepository,
    private val logoutUseCase: LogoutUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(AdminDashboardUiState())
    val uiState: StateFlow<AdminDashboardUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                _uiState.value = AdminDashboardUiState(stats = statsRepository.getAdminStats(), isLoading = false)
            } catch (e: Exception) {
                _uiState.value = AdminDashboardUiState(isLoading = false, error = e.message)
            }
        }
    }

    fun toggleAiFeedback(enabled: Boolean) {
        viewModelScope.launch { statsRepository.setAiFeedbackEnabled(enabled); load() }
    }

    fun logout(onDone: () -> Unit) { viewModelScope.launch { logoutUseCase(); onDone() } }
}

data class UserManagementUiState(val users: List<User> = emptyList(), val isLoading: Boolean = true, val error: String? = null)

@HiltViewModel
class UserManagementViewModel @Inject constructor(
    private val getAllUsersUseCase: GetAllUsersUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(UserManagementUiState())
    val uiState: StateFlow<UserManagementUiState> = _uiState.asStateFlow()
    init { viewModelScope.launch { try { _uiState.value = UserManagementUiState(users = getAllUsersUseCase(), isLoading = false) } catch (e: Exception) { _uiState.value = UserManagementUiState(isLoading = false, error = e.message) } } }
}

data class LogsUiState(val logs: List<SystemLog> = emptyList(), val isLoading: Boolean = true, val error: String? = null)

@HiltViewModel
class SystemLogsViewModel @Inject constructor(private val statsRepository: StatsRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(LogsUiState())
    val uiState: StateFlow<LogsUiState> = _uiState.asStateFlow()
    init { viewModelScope.launch { try { _uiState.value = LogsUiState(logs = statsRepository.getSystemLogs(), isLoading = false) } catch (e: Exception) { _uiState.value = LogsUiState(isLoading = false, error = e.message) } } }
}
