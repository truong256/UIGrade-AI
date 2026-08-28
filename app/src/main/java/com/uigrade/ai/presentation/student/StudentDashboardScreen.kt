package com.uigrade.ai.presentation.student

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.model.Classroom
import com.uigrade.ai.ui.components.AssignmentStatusBadge
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import com.uigrade.ai.ui.components.mascot.CatMascot
import com.uigrade.ai.ui.components.mascot.CatMascotState
import com.uigrade.ai.ui.components.mascot.CatMascotStyle
import java.time.format.DateTimeFormatter
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentDashboardScreen(
    onNavigateToAssignments: (filter: String?) -> Unit,
    onNavigateToAssignment: (String) -> Unit,
    onNavigateToClassrooms: () -> Unit,
    onNavigateToClassroom: (String) -> Unit,
    onNavigateToJoinClassroom: () -> Unit,
    onNavigateToGrades: () -> Unit,
    onNavigateToProgress: () -> Unit,
    onNavigateToCalendar: () -> Unit,
    onNavigateToNotifications: () -> Unit,
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
                    IconButton(
                        onClick = { viewModel.load(refresh = true) },
                        enabled = !uiState.isRefreshing
                    ) {
                        if (uiState.isRefreshing) {
                            CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Default.Refresh, contentDescription = "Làm mới dashboard")
                        }
                    }
                    IconButton(onClick = onNavigateToNotifications) {
                        BadgedBox(
                            badge = {
                                if (uiState.unreadCount > 0) {
                                    Badge { Text(uiState.unreadCount.coerceAtMost(99).toString()) }
                                }
                            }
                        ) {
                            Icon(Icons.Default.Notifications, contentDescription = "Thông báo")
                        }
                    }
                    IconButton(onClick = onNavigateToProfile) {
                        Icon(Icons.Default.Person, contentDescription = "Hồ sơ cá nhân")
                    }
                    IconButton(
                        onClick = { viewModel.logout(onLogout) },
                        enabled = !uiState.isLoggingOut
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Đăng xuất")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null && uiState.user == null -> ErrorScreen(
                uiState.error ?: "Không thể tải dashboard.",
                onRetry = { viewModel.load() },
                modifier = Modifier.padding(padding)
            )
            else -> StudentDashboardContent(
                uiState = uiState,
                onNavigateToAssignments = onNavigateToAssignments,
                onNavigateToAssignment = onNavigateToAssignment,
                onNavigateToClassrooms = onNavigateToClassrooms,
                onNavigateToClassroom = onNavigateToClassroom,
                onNavigateToJoinClassroom = onNavigateToJoinClassroom,
                onNavigateToGrades = onNavigateToGrades,
                onNavigateToProgress = onNavigateToProgress,
                onNavigateToCalendar = onNavigateToCalendar,
                modifier = Modifier.padding(padding)
            )
        }
    }
}

@Composable
private fun StudentDashboardContent(
    uiState: StudentDashboardUiState,
    onNavigateToAssignments: (String?) -> Unit,
    onNavigateToAssignment: (String) -> Unit,
    onNavigateToClassrooms: () -> Unit,
    onNavigateToClassroom: (String) -> Unit,
    onNavigateToJoinClassroom: () -> Unit,
    onNavigateToGrades: () -> Unit,
    onNavigateToProgress: () -> Unit,
    onNavigateToCalendar: () -> Unit,
    modifier: Modifier = Modifier
) {
    val priorityAssignments = uiState.assignments
        .filter { it.status != AssignmentStatus.GRADED && it.status != AssignmentStatus.CLOSED }
        .sortedBy { it.assignment.deadline }
        .take(5)
    val mascotState = when {
        uiState.error != null -> CatMascotState.Worried
        uiState.pendingCount == 0 && uiState.assignments.isNotEmpty() -> CatMascotState.Happy
        else -> CatMascotState.Idle
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    CatMascot(
                        state = mascotState,
                        style = CatMascotStyle.Default.copy(size = 78.dp, showSpeechBubble = false)
                    )
                    Column(Modifier.weight(1f)) {
                        Text(
                            "Xin chào, ${uiState.user?.name ?: "Sinh viên"}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            if (uiState.pendingCount == 0 && uiState.assignments.isNotEmpty()) {
                                "Tuyệt vời! Bạn đã hoàn thành tất cả bài tập hiện tại."
                            } else {
                                "Bạn có ${uiState.pendingCount} bài cần ưu tiên hôm nay."
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        uiState.user?.studentId?.let {
                            Text("Mã sinh viên: $it", style = MaterialTheme.typography.labelMedium)
                        }
                    }
                }
            }
        }

        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                item {
                    DashboardStatCard(
                        "Lớp học", uiState.classrooms.size.toString(), Icons.Default.School,
                        MaterialTheme.colorScheme.primary, onNavigateToClassrooms
                    )
                }
                item {
                    DashboardStatCard(
                        "Chưa nộp", uiState.pendingCount.toString(), Icons.Default.Assignment,
                        MaterialTheme.colorScheme.error, { onNavigateToAssignments("missing") }
                    )
                }
                item {
                    DashboardStatCard(
                        "Sắp hết hạn", uiState.upcomingCount.toString(), Icons.Default.Schedule,
                        MaterialTheme.colorScheme.tertiary, { onNavigateToAssignments("upcoming") }
                    )
                }
                item {
                    DashboardStatCard(
                        "Đã nộp", uiState.submittedCount.toString(), Icons.Default.CheckCircle,
                        MaterialTheme.colorScheme.secondary, { onNavigateToAssignments("submitted") }
                    )
                }
                item {
                    DashboardStatCard(
                        "Đã chấm", uiState.gradedCount.toString(), Icons.Default.TrendingUp,
                        MaterialTheme.colorScheme.primary, onNavigateToGrades
                    )
                }
                item {
                    DashboardStatCard(
                        "Điểm TB", uiState.averagePercent?.let { "${it.roundToInt()}%" } ?: "—",
                        Icons.Default.TrendingUp, MaterialTheme.colorScheme.primary, onNavigateToProgress
                    )
                }
            }
        }

        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item { Button(onClick = onNavigateToJoinClassroom) { Icon(Icons.Default.Add, null); Spacer(Modifier.width(6.dp)); Text("Tham gia lớp") } }
                item { TextButton(onClick = onNavigateToCalendar) { Icon(Icons.Default.CalendarMonth, null); Spacer(Modifier.width(6.dp)); Text("Lịch hạn nộp") } }
                item { TextButton(onClick = onNavigateToProgress) { Icon(Icons.Default.TrendingUp, null); Spacer(Modifier.width(6.dp)); Text("Tiến độ") } }
            }
        }

        item {
            SectionHeader("Lớp học gần đây", "Xem tất cả", onNavigateToClassrooms)
        }
        if (uiState.classrooms.isEmpty()) {
            item {
                Card(onClick = onNavigateToJoinClassroom, modifier = Modifier.fillMaxWidth()) {
                    Row(
                        Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text("Bạn chưa tham gia lớp học nào.", fontWeight = FontWeight.SemiBold)
                            Text("Nhập mã lớp do giảng viên cung cấp để bắt đầu.", style = MaterialTheme.typography.bodySmall)
                        }
                        Icon(Icons.Default.ChevronRight, contentDescription = "Tham gia lớp học")
                    }
                }
            }
        } else {
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(uiState.classrooms.take(5), key = { it.id }) { classroom ->
                        DashboardClassroomCard(classroom) { onNavigateToClassroom(classroom.id) }
                    }
                }
            }
        }

        item {
            SectionHeader("Bài tập cần ưu tiên", "Xem tất cả") { onNavigateToAssignments(null) }
        }
        if (priorityAssignments.isEmpty()) {
            item { EmptyScreen("Tuyệt vời! Bạn đã hoàn thành tất cả bài tập hiện tại.", Modifier.height(140.dp)) }
        } else {
            items(priorityAssignments, key = { it.assignment.id }) { item ->
                StudentDashboardAssignmentCard(item) { onNavigateToAssignment(item.assignment.id) }
            }
        }

        if (uiState.notifications.isNotEmpty()) {
            item {
                Text("Hoạt động gần đây", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }
            items(uiState.notifications.take(3), key = { it.id }) { notification ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(14.dp)) {
                        Text(notification.title, fontWeight = FontWeight.SemiBold)
                        Text(notification.message, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String, action: String, onAction: () -> Unit) {
    Row(
        Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        TextButton(onClick = onAction) { Text(action) }
    }
}

@Composable
private fun DashboardStatCard(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.width(126.dp),
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.10f))
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Icon(icon, contentDescription = null, tint = color)
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = color)
            Text(title, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
private fun DashboardClassroomCard(classroom: Classroom, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.width(230.dp)) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Text(classroom.courseCode, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            Text(classroom.name, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, maxLines = 2)
            Text("GV: ${classroom.lecturerName}", style = MaterialTheme.typography.bodySmall, maxLines = 1)
            Text(classroom.schedule.ifBlank { classroom.semester }, style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
private fun StudentDashboardAssignmentCard(item: AssignmentWithStatus, onClick: () -> Unit) {
    val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(item.assignment.title, Modifier.weight(1f), fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.width(8.dp))
                AssignmentStatusBadge(item.status)
            }
            Text(
                "Hạn nộp: ${item.assignment.deadline.format(formatter)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            item.disabledReason?.let {
                Text(it, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}
