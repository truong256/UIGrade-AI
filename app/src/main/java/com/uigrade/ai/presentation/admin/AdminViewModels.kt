package com.uigrade.ai.presentation.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.AdminStats
import com.uigrade.ai.domain.model.AuditAction
import com.uigrade.ai.domain.model.AuditOutcome
import com.uigrade.ai.domain.model.Metric
import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.model.Rule
import com.uigrade.ai.domain.model.SystemLog
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserAccountStatus
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.usecase.AdminOperationsUseCase
import com.uigrade.ai.domain.usecase.LogoutUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AdminDashboardUiState(
    val stats: AdminStats? = null,
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null
)

@HiltViewModel
class AdminDashboardViewModel @Inject constructor(
    private val adminOperations: AdminOperationsUseCase,
    private val logoutUseCase: LogoutUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(AdminDashboardUiState())
    val uiState: StateFlow<AdminDashboardUiState> = _uiState.asStateFlow()

    init { load() }

    fun load(refresh: Boolean = false) {
        if (_uiState.value.isLoading && _uiState.value.stats != null || _uiState.value.isRefreshing) return
        viewModelScope.launch {
            _uiState.update {
                it.copy(isLoading = !refresh && it.stats == null, isRefreshing = refresh, errorMessage = null)
            }
            try {
                val stats = adminOperations.stats()
                _uiState.update {
                    it.copy(
                        stats = stats,
                        isLoading = false,
                        isRefreshing = false,
                        successMessage = if (refresh) "Đã làm mới dữ liệu quản trị." else null
                    )
                }
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, isRefreshing = false, errorMessage = adminMessage(error))
                }
            }
        }
    }

    fun toggleAiFeedback(enabled: Boolean) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true) }
            try {
                adminOperations.setAiFeedbackEnabled(enabled)
                _uiState.update {
                    it.copy(
                        stats = adminOperations.stats(),
                        isSubmitting = false,
                        successMessage = if (enabled) "Đã bật AI Feedback." else "Đã tắt AI Feedback."
                    )
                }
            } catch (error: Exception) {
                _uiState.update { it.copy(isSubmitting = false, successMessage = adminMessage(error)) }
            }
        }
    }

    fun logout(onDone: () -> Unit) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true) }
            logoutUseCase()
            onDone()
        }
    }

    fun clearMessage() = _uiState.update { it.copy(successMessage = null) }
}

enum class UserSortOption(val label: String) {
    NAME_ASC("Tên A–Z"),
    NAME_DESC("Tên Z–A"),
    NEWEST("Tạo mới nhất"),
    OLDEST("Tạo cũ nhất"),
    LAST_LOGIN("Đăng nhập gần nhất")
}

data class UserManagementUiState(
    val allUsers: List<User> = emptyList(),
    val filteredUsers: List<User> = emptyList(),
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val searchQuery: String = "",
    val selectedRoleFilter: UserRole? = null,
    val selectedStatusFilter: UserAccountStatus? = null,
    val sortOption: UserSortOption = UserSortOption.NAME_ASC,
    val selectedUser: User? = null,
    val editingUser: User? = null,
    val isCreating: Boolean = false
)

@HiltViewModel
class UserManagementViewModel @Inject constructor(
    private val adminOperations: AdminOperationsUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(UserManagementUiState())
    val uiState: StateFlow<UserManagementUiState> = _uiState.asStateFlow()
    private var searchJob: Job? = null
    private var initialFilterApplied = false

    init { loadUsers() }

    fun applyInitialFilter(role: UserRole?, status: UserAccountStatus?) {
        if (initialFilterApplied) return
        initialFilterApplied = true
        _uiState.update { state ->
            state.copy(
                selectedRoleFilter = role,
                selectedStatusFilter = status,
                filteredUsers = filterUsers(state.allUsers, state.searchQuery, role, status, state.sortOption)
            )
        }
    }

    fun loadUsers(refresh: Boolean = false) {
        if (_uiState.value.isRefreshing || (_uiState.value.isLoading && _uiState.value.allUsers.isNotEmpty())) return
        viewModelScope.launch {
            _uiState.update {
                it.copy(isLoading = !refresh && it.allUsers.isEmpty(), isRefreshing = refresh, errorMessage = null)
            }
            try {
                replaceUsers(adminOperations.users(), if (refresh) "Đã làm mới danh sách người dùng." else null)
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, isRefreshing = false, errorMessage = adminMessage(error))
                }
            }
        }
    }

    fun onSearchQueryChange(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(300)
            _uiState.update { state ->
                state.copy(filteredUsers = filterUsers(state.allUsers, query, state.selectedRoleFilter, state.selectedStatusFilter, state.sortOption))
            }
        }
    }

    fun onRoleFilterChange(role: UserRole?) = refilter { it.copy(selectedRoleFilter = role) }
    fun onStatusFilterChange(status: UserAccountStatus?) = refilter { it.copy(selectedStatusFilter = status) }
    fun onSortChange(sort: UserSortOption) = refilter { it.copy(sortOption = sort) }
    fun resetFilters() = refilter {
        it.copy(searchQuery = "", selectedRoleFilter = null, selectedStatusFilter = null, sortOption = UserSortOption.NAME_ASC)
    }

    fun showUser(user: User) = _uiState.update { it.copy(selectedUser = user) }
    fun closeUser() = _uiState.update { it.copy(selectedUser = null) }
    fun openCreateDialog() = _uiState.update { it.copy(isCreating = true) }
    fun closeCreateDialog() = _uiState.update { it.copy(isCreating = false) }
    fun openEditDialog(user: User) = _uiState.update { it.copy(editingUser = user, selectedUser = null) }
    fun closeEditDialog() = _uiState.update { it.copy(editingUser = null) }

    fun createUser(user: User) = mutate("Đã tạo tài khoản. Hãy gửi yêu cầu đặt mật khẩu cho người dùng.") {
        adminOperations.createUser(user)
        _uiState.update { it.copy(isCreating = false) }
    }

    fun updateUser(user: User) = mutate("Đã cập nhật thông tin người dùng.") {
        adminOperations.updateUser(user)
        _uiState.update { it.copy(editingUser = null) }
    }

    fun setAccountStatus(user: User, status: UserAccountStatus) = mutate(
        if (status == UserAccountStatus.ACTIVE) "Đã kích hoạt tài khoản." else "Đã cập nhật trạng thái tài khoản."
    ) {
        adminOperations.setAccountStatus(user.id, status)
        _uiState.update { it.copy(selectedUser = null) }
    }

    fun requestPasswordReset(user: User) = mutate("Đã ghi nhận yêu cầu đặt lại mật khẩu cho ${user.email}.") {
        adminOperations.requestPasswordReset(user.id)
    }

    fun deleteUser(user: User) = mutate("Đã xóa tài khoản.") {
        adminOperations.deleteUser(user.id)
        _uiState.update { it.copy(selectedUser = null) }
    }

    fun clearMessage() = _uiState.update { it.copy(successMessage = null) }

    private fun mutate(success: String, operation: suspend () -> Unit) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true) }
            try {
                operation()
                replaceUsers(adminOperations.users(), success, submitting = false)
            } catch (error: Exception) {
                _uiState.update { it.copy(isSubmitting = false, successMessage = adminMessage(error)) }
            }
        }
    }

    private fun replaceUsers(users: List<User>, message: String?, submitting: Boolean = _uiState.value.isSubmitting) {
        _uiState.update { state ->
            state.copy(
                allUsers = users,
                filteredUsers = filterUsers(users, state.searchQuery, state.selectedRoleFilter, state.selectedStatusFilter, state.sortOption),
                isLoading = false,
                isRefreshing = false,
                isSubmitting = submitting,
                errorMessage = null,
                successMessage = message
            )
        }
    }

    private fun refilter(transform: (UserManagementUiState) -> UserManagementUiState) {
        _uiState.update { current ->
            val changed = transform(current)
            changed.copy(
                filteredUsers = filterUsers(
                    changed.allUsers,
                    changed.searchQuery,
                    changed.selectedRoleFilter,
                    changed.selectedStatusFilter,
                    changed.sortOption
                )
            )
        }
    }

    companion object {
        fun filterUsers(
            users: List<User>,
            query: String,
            role: UserRole?,
            status: UserAccountStatus?,
            sort: UserSortOption
        ): List<User> {
            val normalized = query.trim()
            val filtered = users.filter { user ->
                val matchesQuery = normalized.isBlank() || listOfNotNull(
                    user.name,
                    user.email,
                    user.studentId,
                    user.staffId
                ).any { it.contains(normalized, ignoreCase = true) }
                matchesQuery && (role == null || user.role == role) &&
                    (status == null || user.accountStatus == status)
            }
            return when (sort) {
                UserSortOption.NAME_ASC -> filtered.sortedBy { it.name.lowercase() }
                UserSortOption.NAME_DESC -> filtered.sortedByDescending { it.name.lowercase() }
                UserSortOption.NEWEST -> filtered.sortedByDescending { it.createdAt }
                UserSortOption.OLDEST -> filtered.sortedBy { it.createdAt }
                UserSortOption.LAST_LOGIN -> filtered.sortedByDescending { it.lastLoginAt }
            }
        }
    }
}

data class RubricAdminUiState(
    val allRubrics: List<Rubric> = emptyList(),
    val rubrics: List<Rubric> = emptyList(),
    val searchQuery: String = "",
    val activeFilter: Boolean? = null,
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val previewRubric: Rubric? = null
)

@HiltViewModel
class AdminRubricViewModel @Inject constructor(
    private val adminOperations: AdminOperationsUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(RubricAdminUiState())
    val uiState: StateFlow<RubricAdminUiState> = _uiState.asStateFlow()

    init { load() }

    fun load(refresh: Boolean = false) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = !refresh && it.allRubrics.isEmpty(), isRefreshing = refresh, errorMessage = null) }
            try { replace(adminOperations.rubrics(), if (refresh) "Đã làm mới danh sách rubric." else null) }
            catch (error: Exception) {
                _uiState.update { it.copy(isLoading = false, isRefreshing = false, errorMessage = adminMessage(error)) }
            }
        }
    }

    fun search(query: String) = filter { it.copy(searchQuery = query) }
    fun filterActive(active: Boolean?) = filter { it.copy(activeFilter = active) }
    fun preview(rubric: Rubric?) = _uiState.update { it.copy(previewRubric = rubric) }
    fun duplicate(rubric: Rubric) = mutate("Đã sao chép rubric.") { adminOperations.duplicateRubric(rubric.id) }
    fun setActive(rubric: Rubric, active: Boolean) = mutate(if (active) "Đã bật rubric." else "Đã vô hiệu hóa rubric.") {
        adminOperations.setRubricActive(rubric.id, active)
    }
    fun delete(rubric: Rubric) = mutate("Đã xóa rubric.") { adminOperations.deleteRubric(rubric.id) }
    fun clearMessage() = _uiState.update { it.copy(successMessage = null) }

    private fun mutate(message: String, action: suspend () -> Unit) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true) }
            try { action(); replace(adminOperations.rubrics(), message, submitting = false) }
            catch (error: Exception) { _uiState.update { it.copy(isSubmitting = false, successMessage = adminMessage(error)) } }
        }
    }

    private fun replace(rubrics: List<Rubric>, message: String?, submitting: Boolean = _uiState.value.isSubmitting) {
        _uiState.update { state ->
            state.copy(
                allRubrics = rubrics,
                rubrics = filterRubrics(rubrics, state.searchQuery, state.activeFilter),
                isLoading = false,
                isRefreshing = false,
                isSubmitting = submitting,
                errorMessage = null,
                successMessage = message
            )
        }
    }

    private fun filter(change: (RubricAdminUiState) -> RubricAdminUiState) = _uiState.update { current ->
        val changed = change(current)
        changed.copy(rubrics = filterRubrics(changed.allRubrics, changed.searchQuery, changed.activeFilter))
    }

    companion object {
        fun filterRubrics(items: List<Rubric>, query: String, active: Boolean?) = items.filter {
            (query.isBlank() || it.title.contains(query.trim(), true)) && (active == null || it.isActive == active)
        }
    }
}

data class RuleManagementUiState(
    val allRules: List<Rule> = emptyList(),
    val rules: List<Rule> = emptyList(),
    val searchQuery: String = "",
    val activeFilter: Boolean? = null,
    val isLoading: Boolean = true,
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val selectedRule: Rule? = null
)

@HiltViewModel
class RuleManagementViewModel @Inject constructor(
    private val adminOperations: AdminOperationsUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(RuleManagementUiState())
    val uiState: StateFlow<RuleManagementUiState> = _uiState.asStateFlow()
    init { load() }

    fun load() = viewModelScope.launch {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        try { replace(adminOperations.rules()) }
        catch (error: Exception) { _uiState.update { it.copy(isLoading = false, errorMessage = adminMessage(error)) } }
    }
    fun search(query: String) = refilter { it.copy(searchQuery = query) }
    fun filterActive(active: Boolean?) = refilter { it.copy(activeFilter = active) }
    fun select(rule: Rule?) = _uiState.update { it.copy(selectedRule = rule) }
    fun update(rule: Rule) = mutate("Đã cập nhật quy tắc.") { adminOperations.updateRule(rule) }
    fun setActive(rule: Rule, active: Boolean) = mutate(if (active) "Đã bật quy tắc." else "Đã vô hiệu hóa quy tắc.") {
        adminOperations.setRuleActive(rule.id, active)
    }
    fun clearMessage() = _uiState.update { it.copy(successMessage = null) }

    private fun mutate(message: String, action: suspend () -> Unit) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true) }
            try { action(); replace(adminOperations.rules(), message) }
            catch (error: Exception) { _uiState.update { it.copy(isSubmitting = false, successMessage = adminMessage(error)) } }
        }
    }
    private fun replace(rules: List<Rule>, message: String? = null) = _uiState.update { state ->
        state.copy(
            allRules = rules,
            rules = filterRules(rules, state.searchQuery, state.activeFilter),
            isLoading = false,
            isSubmitting = false,
            successMessage = message,
            selectedRule = null
        )
    }
    private fun refilter(change: (RuleManagementUiState) -> RuleManagementUiState) = _uiState.update { current ->
        val changed = change(current)
        changed.copy(rules = filterRules(changed.allRules, changed.searchQuery, changed.activeFilter))
    }
    companion object {
        fun filterRules(items: List<Rule>, query: String, active: Boolean?) = items.filter {
            (query.isBlank() || it.description.contains(query.trim(), true) || it.id.contains(query.trim(), true)) &&
                (active == null || it.isActive == active)
        }
    }
}

data class MetricManagementUiState(
    val allMetrics: List<Metric> = emptyList(),
    val metrics: List<Metric> = emptyList(),
    val searchQuery: String = "",
    val activeFilter: Boolean? = null,
    val isLoading: Boolean = true,
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val selectedMetric: Metric? = null
)

@HiltViewModel
class MetricManagementViewModel @Inject constructor(
    private val adminOperations: AdminOperationsUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(MetricManagementUiState())
    val uiState: StateFlow<MetricManagementUiState> = _uiState.asStateFlow()
    init { load() }

    fun load() = viewModelScope.launch {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        try { replace(adminOperations.metrics()) }
        catch (error: Exception) { _uiState.update { it.copy(isLoading = false, errorMessage = adminMessage(error)) } }
    }
    fun search(query: String) = refilter { it.copy(searchQuery = query) }
    fun filterActive(active: Boolean?) = refilter { it.copy(activeFilter = active) }
    fun select(metric: Metric?) = _uiState.update { it.copy(selectedMetric = metric) }
    fun update(metric: Metric) = mutate("Đã cập nhật metric.") { adminOperations.updateMetric(metric) }
    fun setActive(metric: Metric, active: Boolean) = mutate(if (active) "Đã bật metric." else "Đã vô hiệu hóa metric.") {
        adminOperations.setMetricActive(metric.id, active)
    }
    fun clearMessage() = _uiState.update { it.copy(successMessage = null) }

    private fun mutate(message: String, action: suspend () -> Unit) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true) }
            try { action(); replace(adminOperations.metrics(), message) }
            catch (error: Exception) { _uiState.update { it.copy(isSubmitting = false, successMessage = adminMessage(error)) } }
        }
    }
    private fun replace(metrics: List<Metric>, message: String? = null) = _uiState.update { state ->
        state.copy(
            allMetrics = metrics,
            metrics = filterMetrics(metrics, state.searchQuery, state.activeFilter),
            isLoading = false,
            isSubmitting = false,
            successMessage = message,
            selectedMetric = null
        )
    }
    private fun refilter(change: (MetricManagementUiState) -> MetricManagementUiState) = _uiState.update { current ->
        val changed = change(current)
        changed.copy(metrics = filterMetrics(changed.allMetrics, changed.searchQuery, changed.activeFilter))
    }
    companion object {
        fun filterMetrics(items: List<Metric>, query: String, active: Boolean?) = items.filter {
            (query.isBlank() || it.name.contains(query.trim(), true) || it.id.contains(query.trim(), true)) &&
                (active == null || it.isActive == active)
        }
    }
}

data class LogsUiState(
    val allLogs: List<SystemLog> = emptyList(),
    val filteredLogs: List<SystemLog> = emptyList(),
    val visibleLogs: List<SystemLog> = emptyList(),
    val searchQuery: String = "",
    val selectedAction: AuditAction? = null,
    val selectedOutcome: AuditOutcome? = null,
    val pageSize: Int = 10,
    val hasMoreData: Boolean = false,
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val selectedLog: SystemLog? = null
)

@HiltViewModel
class SystemLogsViewModel @Inject constructor(
    private val adminOperations: AdminOperationsUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(LogsUiState())
    val uiState: StateFlow<LogsUiState> = _uiState.asStateFlow()
    init { load() }

    fun load(refresh: Boolean = false) = viewModelScope.launch {
        _uiState.update { it.copy(isLoading = !refresh && it.allLogs.isEmpty(), isRefreshing = refresh, errorMessage = null) }
        try {
            val logs = adminOperations.auditLogs()
            _uiState.update { state ->
                applyLogFilters(
                    state.copy(
                        allLogs = logs,
                        isLoading = false,
                        isRefreshing = false,
                        successMessage = if (refresh) "Đã làm mới nhật ký." else null
                    ),
                    resetPage = true
                )
            }
        } catch (error: Exception) {
            _uiState.update { it.copy(isLoading = false, isRefreshing = false, errorMessage = adminMessage(error)) }
        }
    }
    fun search(query: String) = _uiState.update { applyLogFilters(it.copy(searchQuery = query), resetPage = true) }
    fun filterAction(action: AuditAction?) = _uiState.update { applyLogFilters(it.copy(selectedAction = action), resetPage = true) }
    fun filterOutcome(outcome: AuditOutcome?) = _uiState.update { applyLogFilters(it.copy(selectedOutcome = outcome), resetPage = true) }
    fun resetFilters() = _uiState.update {
        applyLogFilters(it.copy(searchQuery = "", selectedAction = null, selectedOutcome = null), resetPage = true)
    }
    fun loadMore() = _uiState.update { state ->
        if (!state.hasMoreData) state else {
            val nextSize = (state.pageSize + PAGE_SIZE).coerceAtMost(state.filteredLogs.size)
            state.copy(pageSize = nextSize, visibleLogs = state.filteredLogs.take(nextSize), hasMoreData = nextSize < state.filteredLogs.size)
        }
    }
    fun select(log: SystemLog?) = _uiState.update { it.copy(selectedLog = log) }
    fun clearMessage() = _uiState.update { it.copy(successMessage = null) }

    companion object {
        private const val PAGE_SIZE = 10
        fun applyLogFilters(state: LogsUiState, resetPage: Boolean): LogsUiState {
            val query = state.searchQuery.trim()
            val filtered = state.allLogs.filter { log ->
                val queryMatch = query.isBlank() || listOf(
                    log.actorName,
                    log.message,
                    log.description,
                    log.targetType,
                    log.targetId.orEmpty()
                ).any { it.contains(query, true) }
                queryMatch && (state.selectedAction == null || log.action == state.selectedAction) &&
                    (state.selectedOutcome == null || log.outcome == state.selectedOutcome)
            }
            val size = if (resetPage) PAGE_SIZE else state.pageSize.coerceAtLeast(PAGE_SIZE)
            return state.copy(
                filteredLogs = filtered,
                visibleLogs = filtered.take(size),
                pageSize = size,
                hasMoreData = filtered.size > size
            )
        }
    }
}

private fun adminMessage(error: Throwable): String = when (error) {
    is SecurityException -> error.message ?: "Bạn không có quyền thực hiện thao tác này."
    is IllegalArgumentException -> error.message ?: "Dữ liệu không hợp lệ."
    else -> error.message ?: "Không thể xử lý yêu cầu. Vui lòng thử lại."
}
