package com.uigrade.ai.presentation.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.Article
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Class
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Grading
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.HourglassBottom
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Rule
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.UserAccountStatus
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    onNavigateToUsers: (UserRole?, UserAccountStatus?) -> Unit,
    onNavigateToRubrics: () -> Unit,
    onNavigateToRules: () -> Unit,
    onNavigateToMetrics: () -> Unit,
    onNavigateToLogs: () -> Unit,
    onLogout: () -> Unit,
    viewModel: AdminDashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.successMessage) {
        uiState.successMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Bảng điều khiển Admin", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(
                        onClick = { viewModel.load(refresh = true) },
                        enabled = !uiState.isRefreshing && !uiState.isSubmitting
                    ) {
                        if (uiState.isRefreshing) {
                            CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Default.Refresh, "Làm mới Dashboard")
                        }
                    }
                    IconButton(
                        onClick = { viewModel.logout(onLogout) },
                        enabled = !uiState.isSubmitting
                    ) { Icon(Icons.Default.Logout, "Đăng xuất") }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.errorMessage != null && uiState.stats == null -> ErrorScreen(
                message = uiState.errorMessage.orEmpty(),
                onRetry = { viewModel.load() },
                modifier = Modifier.padding(padding)
            )
            uiState.stats != null -> {
                val stats = requireNotNull(uiState.stats)
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp)
                ) {
                    item {
                        Text("Tổng quan hệ thống", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                        Text(
                            "Số liệu được tổng hợp từ nguồn dữ liệu dùng chung của ứng dụng.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    item {
                        AdminStatsGrid(
                            items = listOf(
                                AdminStat("Người dùng", stats.totalUsers, Icons.Default.People, MaterialTheme.colorScheme.primary) {
                                    onNavigateToUsers(null, null)
                                },
                                AdminStat("Sinh viên", stats.totalStudents, Icons.Default.School, MaterialTheme.colorScheme.primary) {
                                    onNavigateToUsers(UserRole.STUDENT, null)
                                },
                                AdminStat("Giảng viên", stats.totalLecturers, Icons.Default.Person, MaterialTheme.colorScheme.secondary) {
                                    onNavigateToUsers(UserRole.LECTURER, null)
                                },
                                AdminStat("Admin", stats.totalAdmins, Icons.Default.AdminPanelSettings, MaterialTheme.colorScheme.error) {
                                    onNavigateToUsers(UserRole.ADMIN, null)
                                },
                                AdminStat("Đang hoạt động", stats.activeUsers, Icons.Default.VerifiedUser, MaterialTheme.colorScheme.primary) {
                                    onNavigateToUsers(null, UserAccountStatus.ACTIVE)
                                },
                                AdminStat("Bị khóa", stats.lockedUsers, Icons.Default.Block, MaterialTheme.colorScheme.error) {
                                    onNavigateToUsers(null, UserAccountStatus.LOCKED)
                                }
                            )
                        )
                    }
                    item {
                        SectionHeader("Hoạt động học tập")
                        Spacer(Modifier.height(8.dp))
                        AdminStatsGrid(
                            items = listOf(
                                AdminStat("Lớp học", stats.totalClassrooms, Icons.Default.Class, MaterialTheme.colorScheme.primary),
                                AdminStat("Bài tập", stats.totalAssignments, Icons.Default.Assignment, MaterialTheme.colorScheme.secondary),
                                AdminStat("Bài nộp", stats.totalSubmissions, Icons.Default.Groups, MaterialTheme.colorScheme.tertiary),
                                AdminStat("Chưa chấm", stats.pendingGrading, Icons.Default.HourglassBottom, MaterialTheme.colorScheme.error)
                            )
                        )
                    }
                    item {
                        SectionHeader("Chấm điểm và giám sát")
                        Spacer(Modifier.height(8.dp))
                        AdminStatsGrid(
                            items = listOf(
                                AdminStat("Rubric hoạt động", stats.activeRubrics, Icons.Default.Grading, MaterialTheme.colorScheme.primary, onNavigateToRubrics),
                                AdminStat("Cảnh báo", stats.recentAlerts, Icons.Default.ErrorOutline, MaterialTheme.colorScheme.error, onNavigateToLogs),
                                AdminStat("Đã chấm", stats.gradingJobs.completed, Icons.Default.Grading, MaterialTheme.colorScheme.secondary),
                                AdminStat("AI Feedback", stats.feedbackStats.generated, Icons.Default.AutoAwesome, MaterialTheme.colorScheme.tertiary)
                            )
                        )
                    }
                    item {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(Modifier.weight(1f)) {
                                    Text("AI Feedback", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                                    Text(
                                        if (stats.aiEnabled) "Đang cho phép tạo gợi ý AI" else "Đã tạm dừng gợi ý AI",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Switch(
                                    checked = stats.aiEnabled,
                                    onCheckedChange = viewModel::toggleAiFeedback,
                                    enabled = !uiState.isSubmitting
                                )
                            }
                        }
                    }
                    item { SectionHeader("Quản lý") }
                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            AdminNavRow("Quản lý người dùng", Icons.Default.People) { onNavigateToUsers(null, null) }
                            AdminNavRow("Quản lý Rubric", Icons.Default.Grading, onNavigateToRubrics)
                            AdminNavRow("Quản lý quy tắc", Icons.Default.Rule, onNavigateToRules)
                            AdminNavRow("Quản lý metric", Icons.Default.Analytics, onNavigateToMetrics)
                            AdminNavRow("Nhật ký hoạt động", Icons.Default.Article, onNavigateToLogs)
                        }
                    }
                }
            }
        }
    }
}

private data class AdminStat(
    val title: String,
    val value: Int,
    val icon: ImageVector,
    val color: Color,
    val onClick: (() -> Unit)? = null
)

@Composable
private fun AdminStatsGrid(items: List<AdminStat>) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items.chunked(2).forEach { rowItems ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                rowItems.forEach { item ->
                    AdminStatCard(item, Modifier.weight(1f))
                }
                if (rowItems.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun AdminStatCard(item: AdminStat, modifier: Modifier = Modifier) {
    val content: @Composable () -> Unit = {
        Column(
            modifier = Modifier.fillMaxWidth().padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(item.icon, contentDescription = null, tint = item.color, modifier = Modifier.size(24.dp))
            Text(item.value.toString(), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = item.color)
            Text(
                item.title,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                maxLines = 2
            )
        }
    }
    if (item.onClick != null) {
        Card(
            onClick = item.onClick,
            modifier = modifier,
            colors = CardDefaults.cardColors(containerColor = item.color.copy(alpha = 0.08f))
        ) { content() }
    } else {
        Card(
            modifier = modifier,
            colors = CardDefaults.cardColors(containerColor = item.color.copy(alpha = 0.08f))
        ) { content() }
    }
}

@Composable
private fun SectionHeader(text: String) {
    Text(text, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
}

@Composable
private fun AdminNavRow(title: String, icon: ImageVector, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Text(title)
            }
            Icon(Icons.Default.ChevronRight, contentDescription = "Mở $title")
        }
    }
}
