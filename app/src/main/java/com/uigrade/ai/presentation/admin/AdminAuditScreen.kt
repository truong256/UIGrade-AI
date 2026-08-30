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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.FilterAltOff
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.AuditAction
import com.uigrade.ai.domain.model.AuditOutcome
import com.uigrade.ai.domain.model.LogLevel
import com.uigrade.ai.domain.model.SystemLog
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SystemLogsScreen(
    onNavigateBack: () -> Unit,
    viewModel: SystemLogsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    LaunchedEffect(uiState.successMessage) {
        uiState.successMessage?.let { snackbar.showSnackbar(it); viewModel.clearMessage() }
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Nhật ký hoạt động", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Quay lại") } },
                actions = {
                    IconButton(onClick = { viewModel.load(refresh = true) }, enabled = !uiState.isRefreshing) {
                        if (uiState.isRefreshing) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                        else Icon(Icons.Default.Refresh, "Làm mới nhật ký")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.errorMessage != null && uiState.allLogs.isEmpty() -> ErrorScreen(
                uiState.errorMessage.orEmpty(), { viewModel.load() }, Modifier.padding(padding)
            )
            else -> Column(Modifier.fillMaxSize().padding(padding)) {
                OutlinedTextField(
                    value = uiState.searchQuery,
                    onValueChange = viewModel::search,
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    placeholder = { Text("Người thực hiện, hành động hoặc đối tượng") },
                    leadingIcon = { Icon(Icons.Default.Search, null) },
                    trailingIcon = if (uiState.searchQuery.isNotBlank()) {
                        { IconButton(onClick = { viewModel.search("") }) { Icon(Icons.Default.Clear, "Xóa tìm kiếm") } }
                    } else null,
                    singleLine = true
                )
                LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    item { FilterChip(selected = uiState.selectedAction == null, onClick = { viewModel.filterAction(null) }, label = { Text("Mọi hành động") }) }
                    items(AuditAction.entries) { action ->
                        FilterChip(
                            selected = uiState.selectedAction == action,
                            onClick = { viewModel.filterAction(action) },
                            label = { Text(actionLabel(action)) }
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(selected = uiState.selectedOutcome == null, onClick = { viewModel.filterOutcome(null) }, label = { Text("Mọi kết quả") })
                    FilterChip(selected = uiState.selectedOutcome == AuditOutcome.SUCCESS, onClick = { viewModel.filterOutcome(AuditOutcome.SUCCESS) }, label = { Text("Thành công") })
                    FilterChip(selected = uiState.selectedOutcome == AuditOutcome.FAILURE, onClick = { viewModel.filterOutcome(AuditOutcome.FAILURE) }, label = { Text("Thất bại") })
                }
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        "${uiState.filteredLogs.size} / ${uiState.allLogs.size} bản ghi",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (uiState.searchQuery.isNotBlank() || uiState.selectedAction != null || uiState.selectedOutcome != null) {
                        TextButton(onClick = viewModel::resetFilters) {
                            Icon(Icons.Default.FilterAltOff, null, Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Đặt lại")
                        }
                    }
                }
                if (uiState.visibleLogs.isEmpty()) {
                    EmptyScreen("Không có nhật ký phù hợp.", Modifier.weight(1f))
                } else LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(uiState.visibleLogs, key = { it.id }) { log ->
                        AuditLogCard(log, onClick = { viewModel.select(log) })
                    }
                    if (uiState.hasMoreData) {
                        item {
                            Button(onClick = viewModel::loadMore, modifier = Modifier.fillMaxWidth()) {
                                Text("Tải thêm")
                            }
                        }
                    }
                }
            }
        }
    }
    uiState.selectedLog?.let { log -> AuditLogDetailDialog(log, onDismiss = { viewModel.select(null) }) }
}

@Composable
private fun AuditLogCard(log: SystemLog, onClick: () -> Unit) {
    val outcomeColor = if (log.outcome == AuditOutcome.SUCCESS) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(
                modifier = Modifier.size(10.dp).background(outcomeColor, CircleShape).padding(1.dp)
            )
            Column(Modifier.weight(1f)) {
                Text(actionLabel(log.action), fontWeight = FontWeight.SemiBold)
                Text(
                    "${log.actorName} → ${log.targetType}${log.targetId?.let { " ($it)" }.orEmpty()}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(log.description, style = MaterialTheme.typography.bodySmall, maxLines = 2)
                Text(log.timestamp.replace('T', ' '), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Icon(
                if (log.outcome == AuditOutcome.SUCCESS) Icons.Default.CheckCircle else Icons.Default.Error,
                contentDescription = if (log.outcome == AuditOutcome.SUCCESS) "Thành công" else "Thất bại",
                tint = outcomeColor,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

@Composable
private fun AuditLogDetailDialog(log: SystemLog, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                if (log.level == LogLevel.ERROR) Icons.Default.Error else Icons.Default.Warning,
                null,
                tint = if (log.outcome == AuditOutcome.FAILURE) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
            )
        },
        title = { Text("Chi tiết nhật ký") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                LogDetail("Hành động", actionLabel(log.action))
                LogDetail("Người thực hiện", "${log.actorName}${log.userId?.let { " ($it)" }.orEmpty()}")
                LogDetail("Đối tượng", "${log.targetType}${log.targetId?.let { " ($it)" }.orEmpty()}")
                LogDetail("Thời gian", log.timestamp.replace('T', ' '))
                LogDetail("Kết quả", if (log.outcome == AuditOutcome.SUCCESS) "Thành công" else "Thất bại")
                LogDetail("Mô tả", log.description)
                Text(
                    "Nhật ký chỉ đọc và không chứa mật khẩu, token hoặc secret.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Đóng") } }
    )
}

@Composable
private fun LogDetail(label: String, value: String) {
    Column {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value)
    }
}

private fun actionLabel(action: AuditAction): String = when (action) {
    AuditAction.LOGIN -> "Đăng nhập"
    AuditAction.LOGOUT -> "Đăng xuất"
    AuditAction.CREATE_USER -> "Thêm người dùng"
    AuditAction.UPDATE_USER -> "Sửa người dùng"
    AuditAction.LOCK_USER -> "Khóa tài khoản"
    AuditAction.UNLOCK_USER -> "Mở khóa tài khoản"
    AuditAction.CHANGE_ROLE -> "Thay đổi vai trò"
    AuditAction.DELETE_USER -> "Xóa người dùng"
    AuditAction.RESET_PASSWORD -> "Đặt lại mật khẩu"
    AuditAction.COPY_RUBRIC -> "Sao chép rubric"
    AuditAction.UPDATE_RUBRIC -> "Cập nhật rubric"
    AuditAction.DELETE_RUBRIC -> "Xóa rubric"
    AuditAction.UPDATE_RULE -> "Cập nhật quy tắc"
    AuditAction.UPDATE_METRIC -> "Cập nhật metric"
    AuditAction.PERMISSION_DENIED -> "Từ chối truy cập"
    AuditAction.SYSTEM_EVENT -> "Sự kiện hệ thống"
}
