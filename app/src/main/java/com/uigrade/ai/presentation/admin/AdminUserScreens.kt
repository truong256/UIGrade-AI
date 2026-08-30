/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.presentation.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FilterAltOff
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Sort
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserAccountStatus
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import java.time.format.DateTimeFormatter

private enum class UserDangerAction { LOCK, DISABLE, DELETE, RESET_PASSWORD }
private data class PendingUserAction(val user: User, val action: UserDangerAction)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserManagementScreen(
    onNavigateBack: () -> Unit,
    initialRole: UserRole? = null,
    initialStatus: UserAccountStatus? = null,
    viewModel: UserManagementViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    var sortExpanded by remember { mutableStateOf(false) }
    var pendingAction by remember { mutableStateOf<PendingUserAction?>(null) }

    LaunchedEffect(initialRole, initialStatus) { viewModel.applyInitialFilter(initialRole, initialStatus) }
    LaunchedEffect(uiState.successMessage) {
        uiState.successMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }
    LaunchedEffect(uiState.errorMessage, uiState.allUsers) {
        if (uiState.errorMessage != null && uiState.allUsers.isNotEmpty()) {
            snackbarHostState.showSnackbar(uiState.errorMessage.orEmpty())
            viewModel.clearError()
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
                    Box {
                        IconButton(onClick = { sortExpanded = true }) { Icon(Icons.Default.Sort, "Sắp xếp") }
                        DropdownMenu(expanded = sortExpanded, onDismissRequest = { sortExpanded = false }) {
                            UserSortOption.entries.forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option.label) },
                                    onClick = { viewModel.onSortChange(option); sortExpanded = false },
                                    leadingIcon = if (uiState.sortOption == option) {
                                        { Icon(Icons.Default.CheckCircle, null) }
                                    } else null
                                )
                            }
                        }
                    }
                    IconButton(
                        onClick = { viewModel.loadUsers(refresh = true) },
                        enabled = !uiState.isRefreshing && !uiState.isSubmitting
                    ) {
                        if (uiState.isRefreshing) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                        else Icon(Icons.Default.Refresh, "Làm mới danh sách")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = viewModel::openCreateDialog) {
                Icon(Icons.Default.Add, "Thêm người dùng")
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.errorMessage != null && uiState.allUsers.isEmpty() -> ErrorScreen(
                uiState.errorMessage.orEmpty(),
                onRetry = { viewModel.loadUsers() },
                modifier = Modifier.padding(padding)
            )
            else -> Column(Modifier.fillMaxSize().padding(padding)) {
                OutlinedTextField(
                    value = uiState.searchQuery,
                    onValueChange = viewModel::onSearchQueryChange,
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    placeholder = { Text("Tên, email, MSSV hoặc mã giảng viên") },
                    leadingIcon = { Icon(Icons.Default.Search, null) },
                    trailingIcon = if (uiState.searchQuery.isNotEmpty()) {
                        { IconButton(onClick = { viewModel.onSearchQueryChange("") }) { Icon(Icons.Default.Clear, "Xóa tìm kiếm") } }
                    } else null,
                    singleLine = true
                )
                UserFilterRows(uiState, viewModel)
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        "${uiState.filteredUsers.size} / ${uiState.allUsers.size} người dùng · ${uiState.sortOption.label}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (uiState.selectedRoleFilter != null || uiState.selectedStatusFilter != null || uiState.searchQuery.isNotBlank()) {
                        TextButton(onClick = viewModel::resetFilters) {
                            Icon(Icons.Default.FilterAltOff, null, Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Đặt lại")
                        }
                    }
                }
                if (uiState.filteredUsers.isEmpty()) {
                    EmptyScreen("Không tìm thấy người dùng phù hợp.", Modifier.weight(1f))
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 96.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(uiState.filteredUsers, key = { it.id }) { user ->
                            UserCard(user = user, onClick = { viewModel.showUser(user) })
                        }
                    }
                }
            }
        }
    }

    uiState.selectedUser?.let { user ->
        UserDetailDialog(
            user = user,
            processing = uiState.isSubmitting,
            onDismiss = viewModel::closeUser,
            onEdit = { viewModel.openEditDialog(user) },
            onActivate = { viewModel.setAccountStatus(user, UserAccountStatus.ACTIVE) },
            onLock = { viewModel.closeUser(); pendingAction = PendingUserAction(user, UserDangerAction.LOCK) },
            onDisable = { viewModel.closeUser(); pendingAction = PendingUserAction(user, UserDangerAction.DISABLE) },
            onResetPassword = { viewModel.closeUser(); pendingAction = PendingUserAction(user, UserDangerAction.RESET_PASSWORD) },
            onDelete = { viewModel.closeUser(); pendingAction = PendingUserAction(user, UserDangerAction.DELETE) }
        )
    }

    if (uiState.isCreating) {
        UserFormDialog(
            user = null,
            isProcessing = uiState.isSubmitting,
            onDismiss = viewModel::closeCreateDialog,
            onConfirm = viewModel::createUser
        )
    }
    uiState.editingUser?.let { user ->
        UserFormDialog(
            user = user,
            isProcessing = uiState.isSubmitting,
            onDismiss = viewModel::closeEditDialog,
            onConfirm = viewModel::updateUser
        )
    }
    pendingAction?.let { pending ->
        UserActionConfirmation(
            pending = pending,
            processing = uiState.isSubmitting,
            onDismiss = { if (!uiState.isSubmitting) pendingAction = null },
            onConfirm = {
                when (pending.action) {
                    UserDangerAction.LOCK -> viewModel.setAccountStatus(pending.user, UserAccountStatus.LOCKED)
                    UserDangerAction.DISABLE -> viewModel.setAccountStatus(pending.user, UserAccountStatus.DISABLED)
                    UserDangerAction.DELETE -> viewModel.deleteUser(pending.user)
                    UserDangerAction.RESET_PASSWORD -> viewModel.requestPasswordReset(pending.user)
                }
                pendingAction = null
            }
        )
    }
}

@Composable
private fun UserFilterRows(uiState: UserManagementUiState, viewModel: UserManagementViewModel) {
    LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        item { FilterChip(selected = uiState.selectedRoleFilter == null, onClick = { viewModel.onRoleFilterChange(null) }, label = { Text("Mọi vai trò") }) }
        items(UserRole.entries) { role ->
            FilterChip(
                selected = uiState.selectedRoleFilter == role,
                onClick = { viewModel.onRoleFilterChange(role) },
                label = { Text(roleLabel(role)) }
            )
        }
    }
    LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        item { FilterChip(selected = uiState.selectedStatusFilter == null, onClick = { viewModel.onStatusFilterChange(null) }, label = { Text("Mọi trạng thái") }) }
        items(UserAccountStatus.entries) { status ->
            FilterChip(
                selected = uiState.selectedStatusFilter == status,
                onClick = { viewModel.onStatusFilterChange(status) },
                label = { Text(statusLabel(status)) }
            )
        }
    }
}

@Composable
private fun UserCard(user: User, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier.size(44.dp).background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(user.name.firstOrNull()?.uppercase() ?: "?", fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(user.name, fontWeight = FontWeight.SemiBold, maxLines = 2)
                Text(user.email, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    listOfNotNull(roleLabel(user.role), user.studentId ?: user.staffId).joinToString(" · "),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                UserStatusChip(user.accountStatus)
                Icon(Icons.Default.ChevronRight, contentDescription = "Xem chi tiết ${user.name}")
            }
        }
    }
}

@Composable
private fun UserStatusChip(status: UserAccountStatus) {
    val color = when (status) {
        UserAccountStatus.ACTIVE -> MaterialTheme.colorScheme.primaryContainer
        UserAccountStatus.LOCKED -> MaterialTheme.colorScheme.errorContainer
        UserAccountStatus.DISABLED -> MaterialTheme.colorScheme.surfaceVariant
        UserAccountStatus.PENDING -> MaterialTheme.colorScheme.tertiaryContainer
    }
    Surface(color = color, shape = MaterialTheme.shapes.extraSmall) {
        Text(statusLabel(status), style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp))
    }
}

@Composable
private fun UserDetailDialog(
    user: User,
    processing: Boolean,
    onDismiss: () -> Unit,
    onEdit: () -> Unit,
    onActivate: () -> Unit,
    onLock: () -> Unit,
    onDisable: () -> Unit,
    onResetPassword: () -> Unit,
    onDelete: () -> Unit
) {
    AlertDialog(
        onDismissRequest = { if (!processing) onDismiss() },
        title = { Text("Chi tiết tài khoản") },
        text = {
            Column(Modifier.heightIn(max = 440.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(user.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                DetailLine("Email", user.email)
                DetailLine("Vai trò", roleLabel(user.role))
                user.studentId?.let { DetailLine("Mã sinh viên", it) }
                user.staffId?.let { DetailLine("Mã giảng viên", it) }
                DetailLine("Trạng thái", statusLabel(user.accountStatus))
                DetailLine("Ngày tạo", user.createdAt.format(DATE_FORMAT))
                DetailLine("Đăng nhập gần nhất", user.lastLoginAt?.format(DATE_TIME_FORMAT) ?: "Chưa đăng nhập")
                if (user.isSuperAdmin) Text("Super Admin", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                HorizontalDivider()
                Text("Hành động", fontWeight = FontWeight.SemiBold)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    OutlinedButton(onClick = onEdit, enabled = !processing) { Icon(Icons.Default.Edit, null); Text("Sửa") }
                    OutlinedButton(onClick = onResetPassword, enabled = !processing) { Icon(Icons.Default.Key, null); Text("Đặt lại MK") }
                }
                if (user.accountStatus == UserAccountStatus.ACTIVE) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        OutlinedButton(onClick = onLock, enabled = !processing) { Icon(Icons.Default.Block, null); Text("Khóa") }
                        OutlinedButton(onClick = onDisable, enabled = !processing) { Text("Vô hiệu hóa") }
                    }
                } else {
                    Button(onClick = onActivate, enabled = !processing) { Icon(Icons.Default.CheckCircle, null); Text("Kích hoạt") }
                }
                TextButton(onClick = onDelete, enabled = !processing) {
                    Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error)
                    Text("Xóa tài khoản", color = MaterialTheme.colorScheme.error)
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss, enabled = !processing) { Text("Đóng") } }
    )
}

@Composable
private fun DetailLine(label: String, value: String) {
    Column {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodyMedium)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun UserFormDialog(
    user: User?,
    isProcessing: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (User) -> Unit
) {
    var name by rememberSaveable(user?.id) { mutableStateOf(user?.name.orEmpty()) }
    var email by rememberSaveable(user?.id) { mutableStateOf(user?.email.orEmpty()) }
    var identifier by rememberSaveable(user?.id) { mutableStateOf(user?.studentId ?: user?.staffId.orEmpty()) }
    var role by remember(user?.id) { mutableStateOf(user?.role ?: UserRole.STUDENT) }
    var roleExpanded by remember { mutableStateOf(false) }
    var nameError by remember { mutableStateOf<String?>(null) }
    var emailError by remember { mutableStateOf<String?>(null) }
    var identifierError by remember { mutableStateOf<String?>(null) }
    var discardRequested by remember { mutableStateOf(false) }
    val dirty = name != user?.name.orEmpty() || email != user?.email.orEmpty() ||
        identifier != (user?.studentId ?: user?.staffId.orEmpty()) || role != (user?.role ?: UserRole.STUDENT)

    AlertDialog(
        modifier = Modifier.imePadding(),
        onDismissRequest = { if (!isProcessing) { if (dirty) discardRequested = true else onDismiss() } },
        title = { Text(if (user == null) "Thêm người dùng" else "Chỉnh sửa người dùng") },
        text = {
            Column(
                modifier = Modifier.heightIn(max = 480.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it; nameError = null },
                    label = { Text("Họ và tên *") },
                    isError = nameError != null,
                    supportingText = nameError?.let { { Text(it) } },
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it; emailError = null },
                    label = { Text("Email *") },
                    isError = emailError != null,
                    supportingText = emailError?.let { { Text(it) } },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                ExposedDropdownMenuBox(expanded = roleExpanded, onExpandedChange = { roleExpanded = it }) {
                    OutlinedButton(
                        onClick = { roleExpanded = true },
                        enabled = !isProcessing,
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    ) {
                        Text("Vai trò: ${roleLabel(role)}", modifier = Modifier.weight(1f))
                        ExposedDropdownMenuDefaults.TrailingIcon(roleExpanded)
                    }
                    ExposedDropdownMenu(expanded = roleExpanded, onDismissRequest = { roleExpanded = false }) {
                        UserRole.entries.forEach { option ->
                            DropdownMenuItem(text = { Text(roleLabel(option)) }, onClick = { role = option; roleExpanded = false; identifierError = null })
                        }
                    }
                }
                if (role != UserRole.ADMIN) {
                    OutlinedTextField(
                        value = identifier,
                        onValueChange = { identifier = it; identifierError = null },
                        label = { Text(if (role == UserRole.STUDENT) "Mã sinh viên *" else "Mã giảng viên") },
                        isError = identifierError != null,
                        supportingText = identifierError?.let { { Text(it) } },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                if (user == null) {
                    Text(
                        "Tài khoản mới ở trạng thái Chờ kích hoạt và không có mật khẩu mặc định.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    nameError = if (name.trim().length < 2) "Họ tên phải có ít nhất 2 ký tự." else null
                    emailError = if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()) "Email không đúng định dạng." else null
                    identifierError = if (role == UserRole.STUDENT && identifier.isBlank()) "Vui lòng nhập mã sinh viên." else null
                    if (nameError == null && emailError == null && identifierError == null) {
                        val base = user ?: User(id = "", name = "", email = "", role = role)
                        onConfirm(
                            base.copy(
                                name = name.trim(),
                                email = email.trim(),
                                role = role,
                                studentId = if (role == UserRole.STUDENT) identifier.trim() else null,
                                staffId = if (role == UserRole.LECTURER) identifier.trim().ifBlank { null } else null
                            )
                        )
                    }
                },
                enabled = !isProcessing && name.isNotBlank() && email.isNotBlank()
            ) {
                if (isProcessing) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                else Text("Lưu")
            }
        },
        dismissButton = {
            OutlinedButton(
                onClick = { if (dirty) discardRequested = true else onDismiss() },
                enabled = !isProcessing
            ) { Text("Hủy") }
        }
    )

    if (discardRequested) {
        AlertDialog(
            onDismissRequest = { discardRequested = false },
            title = { Text("Bỏ thay đổi?") },
            text = { Text("Thông tin chưa lưu sẽ bị mất.") },
            confirmButton = { Button(onClick = onDismiss) { Text("Bỏ thay đổi") } },
            dismissButton = { OutlinedButton(onClick = { discardRequested = false }) { Text("Tiếp tục chỉnh sửa") } }
        )
    }
}

@Composable
private fun UserActionConfirmation(
    pending: PendingUserAction,
    processing: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    val (title, body, confirm) = when (pending.action) {
        UserDangerAction.LOCK -> Triple("Khóa tài khoản", "${pending.user.name} sẽ không thể đăng nhập cho đến khi được mở khóa.", "Khóa")
        UserDangerAction.DISABLE -> Triple("Vô hiệu hóa tài khoản", "Dữ liệu lịch sử được giữ nguyên nhưng tài khoản sẽ ngừng hoạt động.", "Vô hiệu hóa")
        UserDangerAction.DELETE -> Triple("Xóa tài khoản", "Chỉ tài khoản không có dữ liệu liên quan mới được xóa. Hành động này không thể hoàn tác.", "Xóa")
        UserDangerAction.RESET_PASSWORD -> Triple("Yêu cầu đặt lại mật khẩu", "Hệ thống sẽ ghi nhận yêu cầu cho ${pending.user.email}; không tạo mật khẩu yếu mặc định.", "Xác nhận")
    }
    AlertDialog(
        onDismissRequest = { if (!processing) onDismiss() },
        icon = { Icon(Icons.Default.Warning, null, tint = MaterialTheme.colorScheme.error) },
        title = { Text(title) },
        text = { Text(body) },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !processing,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (pending.action == UserDangerAction.RESET_PASSWORD) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                )
            ) { Text(confirm) }
        },
        dismissButton = { OutlinedButton(onClick = onDismiss, enabled = !processing) { Text("Hủy") } }
    )
}

private fun roleLabel(role: UserRole) = when (role) {
    UserRole.STUDENT -> "Sinh viên"
    UserRole.LECTURER -> "Giảng viên"
    UserRole.ADMIN -> "Quản trị viên"
}

private fun statusLabel(status: UserAccountStatus) = when (status) {
    UserAccountStatus.ACTIVE -> "Hoạt động"
    UserAccountStatus.LOCKED -> "Bị khóa"
    UserAccountStatus.DISABLED -> "Vô hiệu hóa"
    UserAccountStatus.PENDING -> "Chờ kích hoạt"
}

private val DATE_FORMAT: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
private val DATE_TIME_FORMAT: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
