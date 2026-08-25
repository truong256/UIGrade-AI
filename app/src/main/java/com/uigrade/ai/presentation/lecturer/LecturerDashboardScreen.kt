package com.uigrade.ai.presentation.lecturer

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
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.ui.components.*
import com.uigrade.ai.ui.theme.Primary
import com.uigrade.ai.ui.theme.Success
import com.uigrade.ai.ui.theme.Warning
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LecturerDashboardScreen(
    onNavigateToAssignments: () -> Unit,
    onNavigateToRubrics: () -> Unit,
    onNavigateToSubmissions: (assignmentId: String) -> Unit,
    onNavigateToStatistics: () -> Unit,
    onLogout: () -> Unit,
    viewModel: LecturerDashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Lecturer Dashboard", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { viewModel.logout(onLogout) }) { Icon(Icons.Default.Logout, "Logout") }
                }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error!!, onRetry = { viewModel.load() }, modifier = Modifier.padding(padding))
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Text("Xin chào, ${uiState.user?.name ?: "Giảng viên"}", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                }

                // Stats
                item {
                    val stats = uiState.stats
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        LecturerStatCard("Bài tập", "${stats?.totalAssignments ?: 0}", Icons.Default.Assignment, Primary, Modifier.weight(1f))
                        LecturerStatCard("Bài nộp", "${stats?.totalSubmissions ?: 0}", Icons.Default.Send, Success, Modifier.weight(1f))
                        LecturerStatCard("TB điểm", "${"%.1f".format(stats?.averageScore ?: 0f)}", Icons.Default.Star, Warning, Modifier.weight(1f))
                    }
                }

                // Quick nav
                item {
                    Text("Quản lý", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        QuickNavCard("Bài tập", Icons.Default.Assignment, onNavigateToAssignments, Modifier.weight(1f))
                        QuickNavCard("Rubric", Icons.Default.Grading, onNavigateToRubrics, Modifier.weight(1f))
                        QuickNavCard("Thống kê", Icons.Default.BarChart, onNavigateToStatistics, Modifier.weight(1f))
                    }
                }

                // Recent submissions
                if (uiState.recentSubmissions.isNotEmpty()) {
                    item { Text("Bài nộp gần đây", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold) }
                    items(uiState.recentSubmissions) { sub ->
                        RecentSubmissionRow(sub, onClick = { onNavigateToSubmissions(sub.assignmentId) })
                    }
                }
            }
        }
    }
}

@Composable
private fun LecturerStatCard(title: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: androidx.compose.ui.graphics.Color, modifier: Modifier) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = color.copy(0.08f))) {
        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, contentDescription = title, tint = color, modifier = Modifier.size(22.dp))
            Spacer(Modifier.height(4.dp))
            Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = color)
            Text(title, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun QuickNavCard(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit, modifier: Modifier) {
    Card(onClick = onClick, modifier = modifier, colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
        Column(modifier = Modifier.padding(12.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, contentDescription = title, modifier = Modifier.size(28.dp))
            Spacer(Modifier.height(4.dp))
            Text(title, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
private fun RecentSubmissionRow(sub: Submission, onClick: () -> Unit) {
    val fmt = DateTimeFormatter.ofPattern("dd/MM HH:mm")
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium) {
        Row(modifier = Modifier.padding(12.dp, 10.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(sub.studentName, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                Text(sub.submittedAt.format(fmt), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            SubmissionStatusBadge(sub.status)
        }
    }
}
