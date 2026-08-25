package com.uigrade.ai.presentation.student

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
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.ui.components.*
import com.uigrade.ai.ui.theme.Primary
import com.uigrade.ai.ui.theme.Success
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentDashboardScreen(
    onNavigateToAssignments: () -> Unit,
    onNavigateToAssignment: (String) -> Unit,
    onNavigateToProfile: () -> Unit,
    onLogout: () -> Unit,
    viewModel: StudentDashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("UIGrade AI", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = onNavigateToProfile) { Icon(Icons.Default.Person, "Profile") }
                    IconButton(onClick = { viewModel.logout(onLogout) }) { Icon(Icons.Default.Logout, "Logout") }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error!!, onRetry = { viewModel.load() }, modifier = Modifier.padding(padding))
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Greeting
                    item {
                        Text(
                            "Xin chào, ${uiState.user?.name ?: "Sinh viên"} 👋",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        uiState.user?.studentId?.let {
                            Text("Mã SV: $it", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Spacer(Modifier.height(8.dp))
                    }

                    // Stats row
                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            val graded = uiState.assignments.count { it.status == AssignmentStatus.GRADED }
                            val pending = uiState.assignments.count { it.status == AssignmentStatus.NOT_SUBMITTED }
                            StatCard("Đã chấm", "$graded", Icons.Default.CheckCircle, Success, Modifier.weight(1f))
                            StatCard("Chưa nộp", "$pending", Icons.Default.RadioButtonUnchecked, MaterialTheme.colorScheme.onSurfaceVariant, Modifier.weight(1f))
                            StatCard("Tổng", "${uiState.assignments.size}", Icons.Default.Assignment, Primary, Modifier.weight(1f))
                        }
                    }

                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Bài tập của tôi", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                            TextButton(onClick = onNavigateToAssignments) { Text("Xem tất cả") }
                        }
                    }

                    if (uiState.assignments.isEmpty()) {
                        item { EmptyScreen("Chưa có bài tập nào", Modifier.height(200.dp)) }
                    } else {
                        items(uiState.assignments) { item ->
                            AssignmentCard(item, onClick = { onNavigateToAssignment(item.assignment.id) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatCard(title: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: androidx.compose.ui.graphics.Color, modifier: Modifier = Modifier) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.08f)), shape = MaterialTheme.shapes.medium) {
        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, contentDescription = title, tint = color, modifier = Modifier.size(22.dp))
            Spacer(Modifier.height(4.dp))
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = color)
            Text(title, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun AssignmentCard(item: AssignmentWithStatus, onClick: () -> Unit) {
    val fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Text(item.assignment.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                AssignmentStatusBadge(item.status)
            }
            Text("Deadline: ${item.assignment.deadline.format(fmt)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (item.score != null) {
                Text("Điểm: ${item.score} / ${item.assignment.totalMaxScore}", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = scoreColor(item.score, item.assignment.totalMaxScore))
            }
        }
    }
}
