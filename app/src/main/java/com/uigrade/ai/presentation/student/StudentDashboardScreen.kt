package com.uigrade.ai.presentation.student

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
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
import com.uigrade.ai.domain.model.Classroom
import com.uigrade.ai.ui.components.*
import com.uigrade.ai.ui.theme.Primary
import com.uigrade.ai.ui.theme.Success
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentDashboardScreen(
    onNavigateToAssignments: () -> Unit,
    onNavigateToAssignment: (String) -> Unit,
    onNavigateToClassrooms: () -> Unit = {},
    onNavigateToClassroom: (String) -> Unit = {},
    onNavigateToJoinClassroom: () -> Unit = {},
    onNavigateToProfile: () -> Unit,
    onLogout: () -> Unit,
    viewModel: StudentDashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.load()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("UIGrade AI", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = onNavigateToProfile) { Icon(Icons.Default.Person, "Profile") }
                    IconButton(onClick = { viewModel.logout(onLogout) }) { Icon(Icons.AutoMirrored.Filled.Logout, "Logout") }
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
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
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
                    }

                    // Stats row
                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            val graded = uiState.assignments.count { it.status == AssignmentStatus.GRADED }
                            val pending = uiState.assignments.count { it.status == AssignmentStatus.NOT_SUBMITTED }
                            StatCard("Đã chấm", "$graded", Icons.Default.CheckCircle, Success, Modifier.weight(1f))
                            StatCard("Chưa nộp", "$pending", Icons.Default.RadioButtonUnchecked, MaterialTheme.colorScheme.onSurfaceVariant, Modifier.weight(1f))
                            StatCard("Lớp học", "${uiState.classrooms.size}", Icons.Default.School, Primary, Modifier.weight(1f))
                        }
                    }

                    // Classrooms Section
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Lớp học của tôi (${uiState.classrooms.size})", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                            Row {
                                TextButton(onClick = onNavigateToJoinClassroom) {
                                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text("Vào lớp")
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
                                onClick = onNavigateToJoinClassroom,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Icon(Icons.Default.GroupAdd, contentDescription = null, tint = Primary, modifier = Modifier.size(32.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Chưa tham gia lớp học nào", fontWeight = FontWeight.SemiBold)
                                        Text("Nhập mã 6 ký tự để tham gia lớp học ngay", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
                                    DashboardClassroomCard(
                                        classroom = cls,
                                        onClick = { onNavigateToClassroom(cls.id) }
                                    )
                                }
                            }
                        }
                    }

                    // Assignments Section
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Bài tập gần đây", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                            TextButton(onClick = onNavigateToAssignments) { Text("Xem tất cả") }
                        }
                    }

                    if (uiState.assignments.isEmpty()) {
                        item { EmptyScreen("Chưa có bài tập nào", Modifier.height(160.dp)) }
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
private fun DashboardClassroomCard(
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
            Text(classroom.courseCode, style = MaterialTheme.typography.labelSmall, color = Primary, fontWeight = FontWeight.Bold)
            Text(classroom.name, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, maxLines = 1)
            Text("GV: ${classroom.lecturerName}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
            Text(classroom.semester, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
