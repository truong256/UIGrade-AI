package com.uigrade.ai.presentation.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.ui.components.*
import com.uigrade.ai.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    onNavigateToUsers: () -> Unit,
    onNavigateToRubrics: () -> Unit,
    onNavigateToRules: () -> Unit,
    onNavigateToMetrics: () -> Unit,
    onNavigateToLogs: () -> Unit,
    onLogout: () -> Unit,
    viewModel: AdminDashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Bảng điều khiển", fontWeight = FontWeight.Bold) },
                actions = { IconButton(onClick = { viewModel.logout(onLogout) }) { Icon(Icons.Default.Logout, "Đăng xuất") } }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error!!, onRetry = { viewModel.load() }, modifier = Modifier.padding(padding))
            else -> {
                val stats = uiState.stats!!
                LazyColumn(modifier = Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    item { Text("Tổng quan hệ thống", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold) }

                    // Users section
                    item {
                        SectionHeader("Người dùng")
                        Spacer(Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            AdminStatCard("Sinh viên", "${stats.totalStudents}", Icons.Default.School, Primary, Modifier.weight(1f))
                            AdminStatCard("Giảng viên", "${stats.totalLecturers}", Icons.Default.Person, Secondary, Modifier.weight(1f))
                            AdminStatCard("Admin", "${stats.totalAdmins}", Icons.Default.AdminPanelSettings, com.uigrade.ai.ui.theme.Error, Modifier.weight(1f))
                        }
                    }

                    // Grading jobs
                    item {
                        SectionHeader("Công việc chấm điểm")
                        Spacer(Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            AdminStatCard("Hoàn thành", "${stats.gradingJobs.completed}", Icons.Default.CheckCircle, Success, Modifier.weight(1f))
                            AdminStatCard("Lỗi", "${stats.gradingJobs.failed}", Icons.Default.Error, com.uigrade.ai.ui.theme.Error, Modifier.weight(1f))
                            AdminStatCard("Chờ", "${stats.gradingJobs.pending}", Icons.Default.HourglassBottom, Warning, Modifier.weight(1f))
                        }
                    }

                    // AI feedback
                    item {
                        SectionHeader("AI Feedback")
                        Spacer(Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            AdminStatCard("Đã tạo", "${stats.feedbackStats.generated}", Icons.Default.AutoAwesome, Info, Modifier.weight(1f))
                            AdminStatCard("Lỗi", "${stats.feedbackStats.failed}", Icons.Default.Error, com.uigrade.ai.ui.theme.Error, Modifier.weight(1f))
                        }
                        Spacer(Modifier.height(8.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Bật AI Feedback", style = MaterialTheme.typography.bodyMedium)
                            Switch(checked = stats.aiEnabled, onCheckedChange = { viewModel.toggleAiFeedback(it) })
                        }
                    }

                    // Navigation
                    item { SectionHeader("Quản lý") }
                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            AdminNavRow("Quản lý người dùng", Icons.Default.People, onNavigateToUsers)
                            AdminNavRow("Quản lý Rubric", Icons.Default.Grading, onNavigateToRubrics)
                            AdminNavRow("Quản lý Quy tắc", Icons.Default.Rule, onNavigateToRules)
                            AdminNavRow("Quản lý Chỉ số", Icons.Default.Analytics, onNavigateToMetrics)
                            AdminNavRow("Nhật ký hệ thống", Icons.Default.Article, onNavigateToLogs)
                        }
                    }
                }
            }
        }
    }
}

@Composable private fun SectionHeader(text: String) { Text(text, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold) }

@Composable
private fun AdminStatCard(title: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: androidx.compose.ui.graphics.Color, modifier: Modifier) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = color.copy(0.08f)), shape = MaterialTheme.shapes.medium) {
        Column(modifier = Modifier.padding(10.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, contentDescription = title, tint = color, modifier = Modifier.size(20.dp))
            Spacer(Modifier.height(2.dp))
            Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = color)
            Text(title, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun AdminNavRow(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium) {
        Row(modifier = Modifier.padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Icon(icon, contentDescription = title, tint = MaterialTheme.colorScheme.primary)
                Text(title, style = MaterialTheme.typography.bodyMedium)
            }
            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
