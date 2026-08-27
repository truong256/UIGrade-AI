package com.uigrade.ai.presentation.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.ui.components.*
import com.uigrade.ai.ui.theme.*

// ─── User Management ──────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserManagementScreen(
    onNavigateBack: () -> Unit,
    viewModel: UserManagementViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.snackbarMessage) {
        uiState.snackbarMessage?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.clearSnackbar()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Quản lý người dùng", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Quay lại") }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadUsers() }) {
                        Icon(Icons.Default.Refresh, "Làm mới")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(
                uiState.error!!, onRetry = { viewModel.loadUsers() }, modifier = Modifier.padding(padding)
            )
            else -> {
                Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                    // Search bar
                    OutlinedTextField(
                        value = uiState.searchQuery,
                        onValueChange = viewModel::onSearchQueryChange,
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                        placeholder = { Text("Tìm theo tên, email, MSSV...") },
                        leadingIcon = { Icon(Icons.Default.Search, null) },
                        trailingIcon = {
                            if (uiState.searchQuery.isNotEmpty()) {
                                IconButton(onClick = { viewModel.onSearchQueryChange("") }) {
                                    Icon(Icons.Default.Clear, "Xoá")
                                }
                            }
                        },
                        singleLine = true,
                        shape = MaterialTheme.shapes.large
                    )

                    // Role filter chips
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        item {
                            FilterChip(
                                selected = uiState.selectedRoleFilter == null,
                                onClick = { viewModel.onRoleFilterChange(null) },
                                label = { Text("Tất cả") }
                            )
                        }
                        item {
                            FilterChip(
                                selected = uiState.selectedRoleFilter == UserRole.STUDENT,
                                onClick = { viewModel.onRoleFilterChange(UserRole.STUDENT) },
                                label = { Text("Sinh viên") }
                            )
                        }
                        item {
                            FilterChip(
                                selected = uiState.selectedRoleFilter == UserRole.LECTURER,
                                onClick = { viewModel.onRoleFilterChange(UserRole.LECTURER) },
                                label = { Text("Giảng viên") }
                            )
                        }
                        item {
                            FilterChip(
                                selected = uiState.selectedRoleFilter == UserRole.ADMIN,
                                onClick = { viewModel.onRoleFilterChange(UserRole.ADMIN) },
                                label = { Text("Quản trị viên") }
                            )
                        }
                    }

                    Spacer(Modifier.height(4.dp))

                    // Count summary
                    Text(
                        "${uiState.filteredUsers.size} / ${uiState.allUsers.size} người dùng",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )

                    if (uiState.filteredUsers.isEmpty()) {
                        EmptyScreen("Không tìm thấy người dùng nào", modifier = Modifier.weight(1f))
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(uiState.filteredUsers, key = { it.id }) { user ->
                                UserCard(
                                    user = user,
                                    onEdit = { viewModel.openEditDialog(user) },
                                    onDelete = { viewModel.openDeleteDialog(user) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Edit Dialog
    uiState.editingUser?.let { user ->
        EditUserDialog(
            user = user,
            isProcessing = uiState.isProcessing,
            onDismiss = viewModel::closeEditDialog,
            onConfirm = viewModel::updateUser
        )
    }

    // Delete Confirmation Dialog
    uiState.deletingUser?.let { user ->
        AlertDialog(
            onDismissRequest = viewModel::closeDeleteDialog,
            icon = { Icon(Icons.Default.Warning, null, tint = MaterialTheme.colorScheme.error) },
            title = { Text("Xoá người dùng") },
            text = { Text("Bạn có chắc muốn xoá tài khoản của \"${user.name}\"? Hành động này không thể hoàn tác.") },
            confirmButton = {
                Button(
                    onClick = { viewModel.deleteUser(user.id) },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                    enabled = !uiState.isProcessing
                ) {
                    if (uiState.isProcessing) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                    else Text("Xoá")
                }
            },
            dismissButton = {
                OutlinedButton(onClick = viewModel::closeDeleteDialog, enabled = !uiState.isProcessing) {
                    Text("Huỷ")
                }
            }
        )
    }
}

@Composable
private fun UserCard(user: User, onEdit: () -> Unit, onDelete: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar circle with initial
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(
                        color = when (user.role) {
                            UserRole.ADMIN -> MaterialTheme.colorScheme.errorContainer
                            UserRole.LECTURER -> MaterialTheme.colorScheme.secondaryContainer
                            UserRole.STUDENT -> MaterialTheme.colorScheme.primaryContainer
                        },
                        shape = CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    user.name.firstOrNull()?.uppercase() ?: "?",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(user.name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                Text(user.email, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (user.studentId != null) {
                    Text("MSSV: ${user.studentId}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                // Role badge
                Surface(
                    color = when (user.role) {
                        UserRole.ADMIN -> MaterialTheme.colorScheme.errorContainer
                        UserRole.LECTURER -> MaterialTheme.colorScheme.secondaryContainer
                        UserRole.STUDENT -> MaterialTheme.colorScheme.primaryContainer
                    },
                    shape = MaterialTheme.shapes.extraSmall
                ) {
                    Text(
                        when (user.role) {
                            UserRole.ADMIN -> "Quản trị viên"
                            UserRole.LECTURER -> "Giảng viên"
                            UserRole.STUDENT -> "Sinh viên"
                        },
                        style = MaterialTheme.typography.labelSmall,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
                // Action buttons
                Row {
                    IconButton(onClick = onEdit, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Edit, "Chỉnh sửa", modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Delete, "Xoá", modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EditUserDialog(
    user: User,
    isProcessing: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (User) -> Unit
) {
    var name by remember(user) { mutableStateOf(user.name) }
    var email by remember(user) { mutableStateOf(user.email) }
    var role by remember(user) { mutableStateOf(user.role) }
    var nameError by remember { mutableStateOf<String?>(null) }
    var emailError by remember { mutableStateOf<String?>(null) }
    var roleExpanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = { if (!isProcessing) onDismiss() },
        title = { Text("Chỉnh sửa người dùng") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it; nameError = null },
                    label = { Text("Họ và tên") },
                    isError = nameError != null,
                    supportingText = nameError?.let { { Text(it, color = MaterialTheme.colorScheme.error) } },
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it; emailError = null },
                    label = { Text("Email") },
                    isError = emailError != null,
                    supportingText = emailError?.let { { Text(it, color = MaterialTheme.colorScheme.error) } },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                // Role dropdown
                ExposedDropdownMenuBox(expanded = roleExpanded, onExpandedChange = { roleExpanded = it }) {
                    OutlinedTextField(
                        value = when (role) {
                            UserRole.STUDENT -> "Sinh viên"
                            UserRole.LECTURER -> "Giảng viên"
                            UserRole.ADMIN -> "Quản trị viên"
                        },
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Vai trò") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = roleExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(expanded = roleExpanded, onDismissRequest = { roleExpanded = false }) {
                        DropdownMenuItem(text = { Text("Sinh viên") }, onClick = { role = UserRole.STUDENT; roleExpanded = false })
                        DropdownMenuItem(text = { Text("Giảng viên") }, onClick = { role = UserRole.LECTURER; roleExpanded = false })
                        DropdownMenuItem(text = { Text("Quản trị viên") }, onClick = { role = UserRole.ADMIN; roleExpanded = false })
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    nameError = if (name.isBlank()) "Tên không được trống" else null
                    emailError = if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) "Email không hợp lệ" else null
                    if (nameError == null && emailError == null) {
                        onConfirm(user.copy(name = name.trim(), email = email.trim(), role = role))
                    }
                },
                enabled = !isProcessing
            ) {
                if (isProcessing) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                else Text("Lưu")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss, enabled = !isProcessing) { Text("Huỷ") }
        }
    )
}

// ─── Rubric Admin ─────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RubricAdminScreen(
    onNavigateBack: () -> Unit,
    viewModel: com.uigrade.ai.presentation.lecturer.RubricManagementViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Quản lý Rubric", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Quay lại") } }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.rubrics.isEmpty() -> EmptyScreen("Chưa có rubric nào", modifier = Modifier.padding(padding))
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    Text(
                        "${uiState.rubrics.size} rubric",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                items(uiState.rubrics) { rubric ->
                    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                Text(rubric.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                                Surface(
                                    color = MaterialTheme.colorScheme.tertiaryContainer,
                                    shape = MaterialTheme.shapes.extraSmall
                                ) {
                                    Text("v${rubric.version}", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(6.dp, 2.dp))
                                }
                            }
                            Text(
                                "${rubric.criteria.size} tiêu chí · ${rubric.criteria.sumOf { it.rules.size }} quy tắc",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            if (rubric.criteria.isNotEmpty()) {
                                HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                                rubric.criteria.take(3).forEach { criterion ->
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Icon(Icons.Default.CheckCircle, null, modifier = Modifier.size(12.dp), tint = MaterialTheme.colorScheme.primary)
                                        Text(criterion.name, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                                if (rubric.criteria.size > 3) {
                                    Text("+ ${rubric.criteria.size - 3} tiêu chí khác", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─── Rule Management ──────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RuleManagementScreen(
    onNavigateBack: () -> Unit,
    viewModel: RuleManagementViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Quản lý Quy tắc", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Quay lại") } }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error!!, modifier = Modifier.padding(padding))
            uiState.rules.isEmpty() -> EmptyScreen("Không có quy tắc nào", modifier = Modifier.padding(padding))
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    Text(
                        "${uiState.rules.size} quy tắc đánh giá",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                items(uiState.rules) { rule -> RuleCard(rule) }
            }
        }
    }
}

// ─── Metric Management ────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MetricManagementScreen(
    onNavigateBack: () -> Unit,
    viewModel: MetricManagementViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Quản lý Chỉ số", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Quay lại") } }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error!!, modifier = Modifier.padding(padding))
            uiState.metrics.isEmpty() -> EmptyScreen("Không có chỉ số nào", modifier = Modifier.padding(padding))
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    Text(
                        "${uiState.metrics.size} chỉ số",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                items(uiState.metrics) { metric -> MetricCard(metric) }
            }
        }
    }
}

// ─── System Logs ─────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SystemLogsScreen(
    onNavigateBack: () -> Unit,
    viewModel: SystemLogsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val levels = com.uigrade.ai.domain.model.LogLevel.entries

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Nhật ký hệ thống", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Quay lại") } }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error!!, modifier = Modifier.padding(padding))
            else -> Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                // Level filter chips
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    item {
                        FilterChip(
                            selected = uiState.selectedLevel == null,
                            onClick = { viewModel.filterByLevel(null) },
                            label = { Text("Tất cả") }
                        )
                    }
                    items(levels) { level ->
                        FilterChip(
                            selected = uiState.selectedLevel == level,
                            onClick = { viewModel.filterByLevel(level) },
                            label = { Text(level.name) },
                            leadingIcon = {
                                Box(
                                    modifier = Modifier.size(8.dp).background(
                                        color = when (level) {
                                            com.uigrade.ai.domain.model.LogLevel.ERROR -> MaterialTheme.colorScheme.error
                                            com.uigrade.ai.domain.model.LogLevel.WARNING -> Color(0xFFF59E0B)
                                            com.uigrade.ai.domain.model.LogLevel.INFO -> MaterialTheme.colorScheme.primary
                                        },
                                        shape = CircleShape
                                    )
                                )
                            }
                        )
                    }
                }

                Text(
                    "${uiState.filteredLogs.size} / ${uiState.allLogs.size} bản ghi",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                )

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(uiState.filteredLogs) { log ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = when (log.level) {
                                    com.uigrade.ai.domain.model.LogLevel.ERROR -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
                                    com.uigrade.ai.domain.model.LogLevel.WARNING -> Color(0xFFFEF3C7)
                                    else -> MaterialTheme.colorScheme.surface
                                }
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                LogLevelBadge(log.level)
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        "[${log.tag}] ${log.message}",
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Spacer(Modifier.height(2.dp))
                                    Text(
                                        log.timestamp,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
