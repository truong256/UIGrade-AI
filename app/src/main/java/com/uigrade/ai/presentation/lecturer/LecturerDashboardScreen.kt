package com.uigrade.ai.presentation.lecturer

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Article
import androidx.compose.material.icons.automirrored.filled.Grading
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.Classroom
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
    onNavigateToClassrooms: () -> Unit = {},
    onNavigateToClassroom: (classroomId: String) -> Unit = {},
    onNavigateToCreateClassroom: () -> Unit = {},
    onNavigateToSubmissions: (assignmentId: String) -> Unit,
    onNavigateToStatistics: () -> Unit,
    onLogout: () -> Unit,
    viewModel: LecturerDashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.load()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Bảng điều khiển giảng viên", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { viewModel.logout(onLogout) }) {
                        Icon(Icons.AutoMirrored.Filled.Logout, "Đăng xuất")
                    }
                }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error!!, onRetry = { viewModel.load() }, modifier = Modifier.padding(padding))
            else -> LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Text("Xin chào, ${uiState.user?.name ?: "Giảng viên"} 👋", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                }

                // Stats
                item {
                    val stats = uiState.stats
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        LecturerStatCard("Lớp học", "${uiState.classrooms.size}", Icons.Default.School, Primary, Modifier.weight(1f))
                        LecturerStatCard("Bài nộp", "${stats?.totalSubmissions ?: 0}", Icons.Default.Send, Success, Modifier.weight(1f))
                        LecturerStatCard("TB điểm", "${"%.1f".format(stats?.averageScore ?: 0f)}", Icons.Default.Star, Warning, Modifier.weight(1f))
                    }
                }

                // Quick nav
                item {
                    Text("Quản lý nhanh", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        QuickNavCard("Lớp học", Icons.Default.School, onNavigateToClassrooms, Modifier.weight(1f))
                        QuickNavCard("Bài tập", Icons.Default.Assignment, onNavigateToAssignments, Modifier.weight(1f))
                        QuickNavCard("Rubric", Icons.AutoMirrored.Filled.Grading, onNavigateToRubrics, Modifier.weight(1f))
                        QuickNavCard("Thống kê", Icons.Default.BarChart, onNavigateToStatistics, Modifier.weight(1f))
                    }
                }

                // Classrooms section
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Lớp học của tôi (${uiState.classrooms.size})", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                        Row {
                            TextButton(onClick = onNavigateToCreateClassroom) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Tạo lớp")
                            }
                            if (uiState.classrooms.isNotEmpty()) {
                                TextButton(onClick = onNavigateToClassrooms) { Text("Xem tất cả") }
                            }
                        }
                    }
                }

                if (uiState.classrooms.isEmpty()) {
                    item {
                        Card(
                            onClick = onNavigateToCreateClassroom,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Icon(Icons.Default.AddBusiness, contentDescription = null, tint = Primary, modifier = Modifier.size(32.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Chưa có lớp học nào", fontWeight = FontWeight.SemiBold)
                                    Text("Bấm vào đây để tạo lớp học đầu tiên", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Icon(Icons.Default.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                } else {
                    item {
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(uiState.classrooms, key = { it.id }) { cls ->
                                LecturerDashboardClassroomCard(
                                    classroom = cls,
                                    onClick = { onNavigateToClassroom(cls.id) }
                                )
                            }
                        }
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
private fun LecturerDashboardClassroomCard(
    classroom: Classroom,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.width(220.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f))
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(classroom.courseCode, style = MaterialTheme.typography.labelSmall, color = Primary, fontWeight = FontWeight.Bold)
                Surface(
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        classroom.joinCode,
                        style = MaterialTheme.typography.labelSmall,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = Primary,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                    )
                }
            }
            Text(classroom.name, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, maxLines = 1)
            Text(classroom.semester, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun LecturerStatCard(title: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: androidx.compose.ui.graphics.Color, modifier: Modifier) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = color.copy(0.08f)), shape = RoundedCornerShape(12.dp)) {
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
    Card(onClick = onClick, modifier = modifier, shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
        Column(modifier = Modifier.padding(12.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, contentDescription = title, modifier = Modifier.size(26.dp), tint = Primary)
            Spacer(Modifier.height(4.dp))
            Text(title, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Medium)
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
