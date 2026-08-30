/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.presentation.lecturer

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.LecturerNotification
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LecturerNotificationsScreen(
    onNavigateBack: () -> Unit,
    onOpenNotification: (LecturerNotification) -> Unit,
    viewModel: LecturerNotificationsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var deleteTarget by remember { mutableStateOf<LecturerNotification?>(null) }
    LaunchedEffect(uiState.message, uiState.error) {
        val message = uiState.message ?: uiState.error
        if (message != null && uiState.notifications.isNotEmpty()) {
            snackbar.showSnackbar(message)
            viewModel.consumeMessage()
        }
    }
    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = { Text("Thông báo", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    TextButton(
                        onClick = viewModel::markAllRead,
                        enabled = !uiState.isSubmitting && uiState.notifications.any { !it.isRead }
                    ) { Text("Đọc tất cả") }
                }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null && uiState.notifications.isEmpty() ->
                ErrorScreen(uiState.error.orEmpty(), onRetry = viewModel::load, modifier = Modifier.padding(padding))
            uiState.notifications.isEmpty() ->
                EmptyScreen("Bạn chưa có thông báo mới.", Modifier.padding(padding))
            else -> {
                LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(uiState.notifications, key = { it.id }) { notification ->
                    NotificationCard(
                        notification = notification,
                        enabled = !uiState.isSubmitting,
                        onOpen = { viewModel.open(notification, onOpenNotification) },
                        onDelete = { deleteTarget = notification }
                    )
                }
            }
        }
    }
    }
    deleteTarget?.let { notification ->
        AlertDialog(
            onDismissRequest = { deleteTarget = null },
            title = { Text("Xóa thông báo?") },
            text = { Text("Thông báo này sẽ bị xóa khỏi danh sách.") },
            confirmButton = {
                Button(onClick = {
                    deleteTarget = null
                    viewModel.delete(notification.id)
                }) { Text("Xóa") }
            },
            dismissButton = { TextButton(onClick = { deleteTarget = null }) { Text("Hủy") } }
        )
    }
}

@Composable
private fun NotificationCard(
    notification: LecturerNotification,
    enabled: Boolean,
    onOpen: () -> Unit,
    onDelete: () -> Unit
) {
    val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
    Card(
        onClick = onOpen,
        enabled = enabled,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (notification.isRead) {
                MaterialTheme.colorScheme.surface
            } else {
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f)
            }
        )
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (!notification.isRead) {
                Surface(modifier = Modifier.size(9.dp), shape = CircleShape, color = MaterialTheme.colorScheme.primary) {}
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(notification.title, fontWeight = if (notification.isRead) FontWeight.Medium else FontWeight.Bold)
                Text(notification.message, style = MaterialTheme.typography.bodySmall)
                Text(
                    notification.createdAt.format(formatter),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            IconButton(onClick = onDelete, enabled = enabled) {
                Icon(Icons.Default.DeleteOutline, contentDescription = "Xóa thông báo")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LecturerProfileScreen(
    onNavigateBack: () -> Unit,
    onLogout: () -> Unit,
    viewModel: LecturerProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var name by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var department by rememberSaveable { mutableStateOf("") }
    var organization by rememberSaveable { mutableStateOf("") }
    var bio by rememberSaveable { mutableStateOf("") }
    var showPasswordDialog by remember { mutableStateOf(false) }
    var showLogoutDialog by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.user?.id) {
        uiState.user?.let {
            name = it.name
            phone = it.phone
            department = it.department
            organization = it.organization
            bio = it.bio
        }
    }
    LaunchedEffect(uiState.message, uiState.error) {
        (uiState.message ?: uiState.error)?.let {
            snackbar.showSnackbar(it)
            viewModel.consumeMessage()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = { Text("Hồ sơ giảng viên", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.user == null -> ErrorScreen(
                uiState.error ?: "Không thể tải hồ sơ.",
                onRetry = viewModel::load,
                modifier = Modifier.padding(padding)
            )
            else -> {
                val user = uiState.user ?: return@Scaffold
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                item {
                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Surface(
                            modifier = Modifier.size(88.dp),
                            shape = CircleShape,
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            Icon(
                                Icons.Default.Person,
                                contentDescription = "Ảnh đại diện",
                                modifier = Modifier.padding(20.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
                item {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Họ và tên *") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
                item {
                    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)) {
                            Text("Email", style = MaterialTheme.typography.labelSmall)
                            Text(user.email, style = MaterialTheme.typography.bodyLarge)
                        }
                    }
                }
                item {
                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Số điện thoại") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = department,
                        onValueChange = { department = it },
                        label = { Text("Bộ môn") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = organization,
                        onValueChange = { organization = it },
                        label = { Text("Đơn vị công tác") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = bio,
                        onValueChange = { bio = it },
                        label = { Text("Giới thiệu") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                        maxLines = 6
                    )
                }
                item {
                    Button(
                        onClick = {
                            viewModel.save(name, phone, department, organization, bio, user.avatarUrl)
                        },
                        enabled = !uiState.isSubmitting && name.isNotBlank(),
                        modifier = Modifier.fillMaxWidth().height(50.dp)
                    ) {
                        if (uiState.isSubmitting) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(22.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Lưu hồ sơ")
                        }
                    }
                }
                item {
                    OutlinedButton(
                        onClick = { showPasswordDialog = true },
                        enabled = !uiState.isSubmitting,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Lock, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Đổi mật khẩu")
                    }
                }
                item {
                    TextButton(
                        onClick = { showLogoutDialog = true },
                        enabled = !uiState.isSubmitting,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Logout, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Đăng xuất")
                    }
                }
                }
            }
        }
    }

    if (showPasswordDialog) {
        ChangePasswordDialog(
            isSubmitting = uiState.isSubmitting,
            onDismiss = { showPasswordDialog = false },
            onConfirm = { current, new, confirm ->
                viewModel.changePassword(current, new, confirm)
                showPasswordDialog = false
            }
        )
    }
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Đăng xuất?") },
            text = { Text("Bạn sẽ quay lại màn hình bắt đầu và không thể trở về dashboard bằng nút Back.") },
            confirmButton = {
                Button(onClick = {
                    showLogoutDialog = false
                    viewModel.logout(onLogout)
                }) { Text("Đăng xuất") }
            },
            dismissButton = { TextButton(onClick = { showLogoutDialog = false }) { Text("Hủy") } }
        )
    }
}

@Composable
private fun ChangePasswordDialog(
    isSubmitting: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (String, String, String) -> Unit
) {
    var current by rememberSaveable { mutableStateOf("") }
    var newPassword by rememberSaveable { mutableStateOf("") }
    var confirm by rememberSaveable { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Đổi mật khẩu") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = current,
                    onValueChange = { current = it },
                    label = { Text("Mật khẩu hiện tại") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = newPassword,
                    onValueChange = { newPassword = it },
                    label = { Text("Mật khẩu mới") },
                    supportingText = { Text("Ít nhất 8 ký tự") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = confirm,
                    onValueChange = { confirm = it },
                    label = { Text("Xác nhận mật khẩu mới") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(current, newPassword, confirm) },
                enabled = !isSubmitting && current.isNotBlank() && newPassword.isNotBlank() && confirm.isNotBlank()
            ) { Text("Đổi mật khẩu") }
        },
        dismissButton = { TextButton(onClick = onDismiss, enabled = !isSubmitting) { Text("Hủy") } }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LecturerAnalyticsScreen(
    onNavigateBack: () -> Unit,
    viewModel: LecturerAnalyticsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Thống kê học tập", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(
                uiState.error.orEmpty(),
                onRetry = viewModel::load,
                modifier = Modifier.padding(padding)
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        AnalyticsStat("Điểm TB", "${"%.1f".format(uiState.averageScore)}", Modifier.weight(1f))
                        AnalyticsStat("Cao nhất", "${"%.1f".format(uiState.highestScore)}", Modifier.weight(1f))
                        AnalyticsStat("Thấp nhất", "${"%.1f".format(uiState.lowestScore)}", Modifier.weight(1f))
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        AnalyticsStat("Tỷ lệ nộp", "${"%.1f".format(uiState.submissionRate)}%", Modifier.weight(1f))
                        AnalyticsStat("Đúng hạn", "${"%.1f".format(uiState.onTimeRate)}%", Modifier.weight(1f))
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        AnalyticsStat("Chưa nộp", uiState.missingCount.toString(), Modifier.weight(1f))
                        AnalyticsStat("Chưa chấm", uiState.ungradedCount.toString(), Modifier.weight(1f))
                    }
                }
                item {
                    Text("Phân bố điểm", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }
                if (uiState.gradeDistribution.values.sum() == 0) {
                    item { Text("Chưa có kết quả chấm để hiển thị phân bố điểm.") }
                } else {
                    items(uiState.gradeDistribution.entries.toList()) { (label, count) ->
                        val max = uiState.gradeDistribution.values.maxOrNull()?.coerceAtLeast(1) ?: 1
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(label)
                                Text("$count bài", fontWeight = FontWeight.SemiBold)
                            }
                            LinearProgressIndicator(
                                progress = { count.toFloat() / max },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }
                item {
                    Text("Kết quả theo bài tập", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }
                if (uiState.assignmentResults.isEmpty()) {
                    item { Text("Chưa có bài tập để thống kê.") }
                } else {
                    items(uiState.assignmentResults, key = { it.id }) { result ->
                        OutlinedCard(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(result.title, fontWeight = FontWeight.SemiBold)
                                Text("Đã nộp ${result.submitted}/${result.expected} sinh viên", style = MaterialTheme.typography.bodySmall)
                                Text(
                                    "Điểm trung bình: ${result.averageScore?.let { "%.1f".format(it) } ?: "Chưa có"}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                }
                item {
                    Text("Kết quả theo tiêu chí rubric", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }
                if (uiState.criterionResults.isEmpty()) {
                    item { Text("Chưa có dữ liệu tiêu chí rubric.") }
                } else {
                    items(uiState.criterionResults, key = { it.name }) { criterion ->
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(criterion.name)
                                Text("${"%.1f".format(criterion.averagePercent)}%", fontWeight = FontWeight.SemiBold)
                            }
                            LinearProgressIndicator(
                                progress = { (criterion.averagePercent / 100f).coerceIn(0f, 1f) },
                                modifier = Modifier.fillMaxWidth()
                            )
                            Text("${criterion.gradedCount} lượt chấm", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }
                item {
                    Text("Tiến độ sinh viên", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }
                if (uiState.studentProgress.isEmpty()) {
                    item { Text("Chưa có sinh viên trong các lớp đang quản lý.") }
                } else {
                    items(uiState.studentProgress, key = { it.id }) { progress ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(progress.name, fontWeight = FontWeight.SemiBold)
                                Text(
                                    "Đã nộp ${progress.submitted}/${progress.totalAssignments} bài · " +
                                        "Điểm TB: ${progress.averageScore?.let { "%.1f".format(it) } ?: "Chưa có"}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AnalyticsStat(label: String, value: String, modifier: Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f))
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(label, style = MaterialTheme.typography.labelSmall)
        }
    }
}
