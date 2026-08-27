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

// ─── Admin Dashboard ───────────────────────────────────────────────────────────

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

// ─── User Management ──────────────────────────────────────────────────────────

data class UserManagementUiState(
    val allUsers: List<User> = emptyList(),
    val filteredUsers: List<User> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val snackbarMessage: String? = null,
    val searchQuery: String = "",
    val selectedRoleFilter: UserRole? = null,
    // Dialog state
    val editingUser: User? = null,
    val deletingUser: User? = null,
    val isProcessing: Boolean = false
)

@HiltViewModel
class UserManagementViewModel @Inject constructor(
    private val getAllUsersUseCase: GetAllUsersUseCase,
    private val updateUserUseCase: UpdateUserUseCase,
    private val deleteUserUseCase: DeleteUserUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(UserManagementUiState())
    val uiState: StateFlow<UserManagementUiState> = _uiState.asStateFlow()

    init { loadUsers() }

    fun loadUsers() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val users = getAllUsersUseCase()
                _uiState.update { state ->
                    state.copy(
                        allUsers = users,
                        filteredUsers = applyFilters(users, state.searchQuery, state.selectedRoleFilter),
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun onSearchQueryChange(query: String) {
        _uiState.update { state ->
            state.copy(
                searchQuery = query,
                filteredUsers = applyFilters(state.allUsers, query, state.selectedRoleFilter)
            )
        }
    }

    fun onRoleFilterChange(role: UserRole?) {
        _uiState.update { state ->
            state.copy(
                selectedRoleFilter = role,
                filteredUsers = applyFilters(state.allUsers, state.searchQuery, role)
            )
        }
    }

    fun openEditDialog(user: User) {
        _uiState.update { it.copy(editingUser = user) }
    }

    fun closeEditDialog() {
        _uiState.update { it.copy(editingUser = null) }
    }

    fun openDeleteDialog(user: User) {
        _uiState.update { it.copy(deletingUser = user) }
    }

    fun closeDeleteDialog() {
        _uiState.update { it.copy(deletingUser = null) }
    }

    fun updateUser(user: User) {
        viewModelScope.launch {
            _uiState.update { it.copy(isProcessing = true) }
            val result = updateUserUseCase(user)
            if (result.isSuccess) {
                loadUsers()
                _uiState.update { it.copy(isProcessing = false, editingUser = null, snackbarMessage = "Đã cập nhật thông tin người dùng") }
            } else {
                _uiState.update { it.copy(isProcessing = false, snackbarMessage = result.exceptionOrNull()?.message ?: "Cập nhật thất bại") }
            }
        }
    }

    fun deleteUser(userId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isProcessing = true) }
            val result = deleteUserUseCase(userId)
            if (result.isSuccess) {
                loadUsers()
                _uiState.update { it.copy(isProcessing = false, deletingUser = null, snackbarMessage = "Đã xoá người dùng") }
            } else {
                _uiState.update { it.copy(isProcessing = false, snackbarMessage = result.exceptionOrNull()?.message ?: "Xoá thất bại") }
            }
        }
    }

    fun clearSnackbar() {
        _uiState.update { it.copy(snackbarMessage = null) }
    }

    private fun applyFilters(users: List<User>, query: String, role: UserRole?): List<User> {
        return users.filter { user ->
            val matchesQuery = query.isBlank() ||
                user.name.contains(query, ignoreCase = true) ||
                user.email.contains(query, ignoreCase = true) ||
                (user.studentId?.contains(query, ignoreCase = true) == true)
            val matchesRole = role == null || user.role == role
            matchesQuery && matchesRole
        }
    }
}

// ─── System Logs ──────────────────────────────────────────────────────────────

data class LogsUiState(
    val allLogs: List<SystemLog> = emptyList(),
    val filteredLogs: List<SystemLog> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val selectedLevel: LogLevel? = null
)

@HiltViewModel
class SystemLogsViewModel @Inject constructor(private val statsRepository: StatsRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(LogsUiState())
    val uiState: StateFlow<LogsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            try {
                val logs = statsRepository.getSystemLogs()
                _uiState.update { it.copy(allLogs = logs, filteredLogs = logs, isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun filterByLevel(level: LogLevel?) {
        _uiState.update { state ->
            state.copy(
                selectedLevel = level,
                filteredLogs = if (level == null) state.allLogs
                               else state.allLogs.filter { it.level == level }
            )
        }
    }
}

// ─── Rule Management ──────────────────────────────────────────────────────────

data class RuleManagementUiState(
    val rules: List<Rule> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class RuleManagementViewModel @Inject constructor(
    private val getAllRubricsUseCase: GetAllRubricsUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(RuleManagementUiState())
    val uiState: StateFlow<RuleManagementUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            _uiState.value = try {
                RuleManagementUiState(
                    rules = getAllRubricsUseCase()
                        .flatMap { rubric -> rubric.criteria.flatMap { it.rules } }
                        .distinctBy { it.id },
                    isLoading = false
                )
            } catch (e: Exception) {
                RuleManagementUiState(isLoading = false, error = e.message)
            }
        }
    }
}

// ─── Metric Management ────────────────────────────────────────────────────────

data class MetricManagementUiState(
    val metrics: List<Metric> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class MetricManagementViewModel @Inject constructor(
    private val getAllGradingResultsUseCase: GetAllGradingResultsUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(MetricManagementUiState())
    val uiState: StateFlow<MetricManagementUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            _uiState.value = try {
                MetricManagementUiState(
                    metrics = getAllGradingResultsUseCase()
                        .flatMap { result -> result.criteriaScores.flatMap { it.metrics } }
                        .distinctBy { it.id },
                    isLoading = false
                )
            } catch (e: Exception) {
                MetricManagementUiState(isLoading = false, error = e.message)
            }
        }
    }
}
