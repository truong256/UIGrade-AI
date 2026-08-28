package com.uigrade.ai.presentation.student

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.GroupAdd
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.model.StudentNotification
import com.uigrade.ai.domain.model.StudentNotificationType
import com.uigrade.ai.ui.components.AssignmentStatusBadge
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import com.uigrade.ai.ui.components.scoreColor
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentGradesScreen(
    onNavigateBack: () -> Unit,
    onNavigateToResult: (String) -> Unit,
    viewModel: StudentGradesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    StudentTopScaffold("Kết quả học tập", onNavigateBack, onRefresh = viewModel::load) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error ?: "Không thể tải kết quả.", viewModel::load, Modifier.padding(padding))
            uiState.grades.isEmpty() -> EmptyScreen("Chưa có kết quả nào được công bố.", Modifier.padding(padding))
            else -> LazyColumn(
                Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(uiState.grades, key = { it.grade.id }) { item ->
                    Card(
                        onClick = { item.submission?.id?.let(onNavigateToResult) },
                        enabled = item.submission != null,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(item.assignment?.assignment?.title ?: "Bài tập", fontWeight = FontWeight.Bold)
                            Text(item.assignment?.assignment?.courseName.orEmpty(), style = MaterialTheme.typography.bodySmall)
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("${item.grade.totalScore.coerceAtLeast(0)}/${item.grade.maxScore.coerceAtLeast(0)} điểm", fontWeight = FontWeight.Bold)
                                Text(
                                    if (item.grade.maxScore > 0) "${(item.grade.percentage * 100).coerceIn(0f, 100f).roundToInt()}%" else "—",
                                    color = scoreColor(item.grade.totalScore, item.grade.maxScore)
                                )
                            }
                            Text("Công bố ${item.grade.gradedAt.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))}", style = MaterialTheme.typography.labelSmall)
                            if (item.submission == null) Text("Bài nộp không còn tồn tại.", color = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentProgressScreen(
    onNavigateBack: () -> Unit,
    onNavigateToAssignment: (String) -> Unit,
    viewModel: StudentProgressViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    StudentTopScaffold("Tiến độ học tập", onNavigateBack, onRefresh = viewModel::load) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error ?: "Không thể tải tiến độ.", viewModel::load, Modifier.padding(padding))
            uiState.progress == null -> EmptyScreen("Chưa có dữ liệu tiến độ.", Modifier.padding(padding))
            else -> {
                val progress = uiState.progress ?: return@StudentTopScaffold
                LazyColumn(
                    Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    item {
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            item { ProgressStat("Được giao", progress.assignedCount.toString(), Icons.Default.Assignment) }
                            item { ProgressStat("Đã nộp", progress.submittedCount.toString(), Icons.Default.CheckCircle) }
                            item { ProgressStat("Chưa nộp", progress.missingCount.toString(), Icons.Default.Warning) }
                            item { ProgressStat("Nộp muộn", progress.lateCount.toString(), Icons.Default.Warning) }
                            item { ProgressStat("Đã chấm", progress.gradedCount.toString(), Icons.Default.School) }
                            item { ProgressStat("Điểm TB", progress.averagePercent?.let { "${it.roundToInt()}%" } ?: "—", Icons.Default.School) }
                        }
                    }
                    item { Text("Tiến độ theo lớp", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold) }
                    if (progress.byClassroom.isEmpty()) {
                        item { EmptyScreen("Bạn chưa tham gia lớp học nào.", Modifier.fillMaxWidth()) }
                    } else {
                        items(progress.byClassroom, key = { it.classroom.id }) { classProgress ->
                            val ratio = if (classProgress.assignedCount > 0) {
                                classProgress.submittedCount.toFloat() / classProgress.assignedCount
                            } else 0f
                            Card(Modifier.fillMaxWidth()) {
                                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                                    Text(classProgress.classroom.name, fontWeight = FontWeight.Bold)
                                    Text("Đã nộp ${classProgress.submittedCount}/${classProgress.assignedCount} • Đã chấm ${classProgress.gradedCount}")
                                    LinearProgressIndicator(progress = { ratio.coerceIn(0f, 1f) }, modifier = Modifier.fillMaxWidth())
                                    Text("Điểm trung bình: ${classProgress.averagePercent?.let { "${it.roundToInt()}%" } ?: "Chưa có"}")
                                }
                            }
                        }
                    }
                    item { Text("Kết quả theo bài tập", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold) }
                    if (uiState.assignments.isEmpty()) {
                        item { EmptyScreen("Hiện chưa có bài tập nào được giao.", Modifier.fillMaxWidth()) }
                    } else {
                        items(uiState.assignments, key = { it.assignment.id }) { item ->
                            Card(onClick = { onNavigateToAssignment(item.assignment.id) }, modifier = Modifier.fillMaxWidth()) {
                                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text(item.assignment.title, fontWeight = FontWeight.SemiBold)
                                        Text(item.assignment.courseName, style = MaterialTheme.typography.bodySmall)
                                    }
                                    AssignmentStatusBadge(item.status)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentCalendarScreen(
    onNavigateBack: () -> Unit,
    onNavigateToAssignment: (String) -> Unit,
    viewModel: StudentCalendarViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    StudentTopScaffold("Lịch và hạn nộp", onNavigateBack, onRefresh = viewModel::load) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error ?: "Không thể tải lịch.", viewModel::load, Modifier.padding(padding))
            else -> Column(Modifier.fillMaxSize().padding(padding)) {
                LazyRow(contentPadding = PaddingValues(16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    item { FilterChip(uiState.selectedClassId == null, { viewModel.selectClass(null) }, { Text("Tất cả lớp") }) }
                    items(uiState.classrooms, key = { it.id }) { classroom ->
                        FilterChip(
                            selected = uiState.selectedClassId == classroom.id,
                            onClick = { viewModel.selectClass(classroom.id) },
                            label = { Text(classroom.courseCode) }
                        )
                    }
                }
                if (uiState.filtered.isEmpty()) {
                    EmptyScreen("Không có hạn nộp trong lịch.", Modifier.fillMaxSize())
                } else {
                    val groups = uiState.filtered.groupBy { it.assignment.deadline.toLocalDate() }.toSortedMap()
                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        groups.forEach { (date, assignments) ->
                            item(key = "date-$date") {
                                Text(calendarDateLabel(date), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            }
                            items(assignments, key = { it.assignment.id }) { item ->
                                CalendarAssignmentCard(item) { onNavigateToAssignment(item.assignment.id) }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentNotificationsScreen(
    onNavigateBack: () -> Unit,
    onOpenClassroom: (String) -> Unit,
    onOpenAssignment: (String) -> Unit,
    onOpenResult: (String) -> Unit,
    onOpenJoinRequests: () -> Unit,
    viewModel: StudentNotificationsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var deleteTarget by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(uiState.message, uiState.error) {
        val message = uiState.message ?: uiState.error
        if (message != null) { snackbar.showSnackbar(message); viewModel.consumeMessage() }
    }
    deleteTarget?.let { id ->
        AlertDialog(
            onDismissRequest = { deleteTarget = null },
            title = { Text("Xóa thông báo?") },
            text = { Text("Bạn sẽ không thể xem lại thông báo này trong hộp thư.") },
            confirmButton = { Button(onClick = { deleteTarget = null; viewModel.delete(id) }) { Text("Xóa") } },
            dismissButton = { TextButton(onClick = { deleteTarget = null }) { Text("Hủy") } }
        )
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Thông báo") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    TextButton(
                        onClick = viewModel::markAllRead,
                        enabled = uiState.notifications.any { !it.isRead } && uiState.busyId == null
                    ) { Text("Đọc tất cả") }
                    IconButton(onClick = { viewModel.load(refresh = true) }, enabled = !uiState.isRefreshing) {
                        Icon(Icons.Default.Refresh, contentDescription = "Làm mới thông báo")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null && uiState.notifications.isEmpty() -> ErrorScreen(
                uiState.error ?: "Không thể tải thông báo.",
                onRetry = { viewModel.load() },
                modifier = Modifier.padding(padding)
            )
            uiState.notifications.isEmpty() -> EmptyScreen("Bạn chưa có thông báo mới.", Modifier.padding(padding))
            else -> LazyColumn(
                Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(uiState.notifications, key = { it.id }) { notification ->
                    StudentNotificationCard(
                        notification = notification,
                        isBusy = uiState.busyId == notification.id,
                        onClick = {
                            viewModel.open(notification) { opened ->
                                when {
                                    opened.type in setOf(StudentNotificationType.JOIN_APPROVED, StudentNotificationType.JOIN_REJECTED) -> onOpenJoinRequests()
                                    opened.type == StudentNotificationType.GRADE_RELEASED && opened.submissionId != null -> onOpenResult(opened.submissionId)
                                    opened.assignmentId != null -> onOpenAssignment(opened.assignmentId)
                                    opened.classroomId != null -> onOpenClassroom(opened.classroomId)
                                    else -> viewModel.reportMissingTarget()
                                }
                            }
                        },
                        onDelete = { deleteTarget = notification.id }
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun StudentTopScaffold(
    title: String,
    onNavigateBack: () -> Unit,
    onRefresh: () -> Unit,
    content: @Composable (PaddingValues) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    IconButton(onClick = onRefresh) { Icon(Icons.Default.Refresh, contentDescription = "Làm mới $title") }
                }
            )
        },
        content = content
    )
}

@Composable
private fun ProgressStat(title: String, value: String, icon: ImageVector) {
    Card(
        modifier = Modifier.width(124.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Icon(icon, contentDescription = null)
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(title, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
private fun CalendarAssignmentCard(item: AssignmentWithStatus, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(item.assignment.title, fontWeight = FontWeight.SemiBold)
                Text(item.assignment.deadline.format(DateTimeFormatter.ofPattern("HH:mm")), style = MaterialTheme.typography.bodySmall)
            }
            AssignmentStatusBadge(item.status)
        }
    }
}

@Composable
private fun StudentNotificationCard(
    notification: StudentNotification,
    isBusy: Boolean,
    onClick: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        onClick = onClick,
        enabled = !isBusy,
        colors = CardDefaults.cardColors(
            containerColor = if (notification.isRead) MaterialTheme.colorScheme.surface
            else MaterialTheme.colorScheme.primaryContainer
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(notificationIcon(notification.type), contentDescription = null)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(notification.title, fontWeight = FontWeight.Bold)
                Text(notification.message, style = MaterialTheme.typography.bodySmall)
                Text(notification.createdAt.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), style = MaterialTheme.typography.labelSmall)
            }
            IconButton(onClick = onDelete, enabled = !isBusy) {
                Icon(Icons.Default.Delete, contentDescription = "Xóa thông báo ${notification.title}")
            }
        }
    }
}

private fun notificationIcon(type: StudentNotificationType): ImageVector = when (type) {
    StudentNotificationType.JOIN_APPROVED -> Icons.Default.CheckCircle
    StudentNotificationType.JOIN_REJECTED -> Icons.Default.Warning
    StudentNotificationType.NEW_ASSIGNMENT,
    StudentNotificationType.ASSIGNMENT_UPDATED,
    StudentNotificationType.DEADLINE_APPROACHING,
    StudentNotificationType.ASSIGNMENT_EXPIRED,
    StudentNotificationType.RESUBMISSION_REQUESTED,
    StudentNotificationType.SUBMISSION_RECEIVED,
    StudentNotificationType.GRADE_RELEASED,
    StudentNotificationType.NEW_FEEDBACK -> Icons.Default.Assignment
    StudentNotificationType.CLASS_ANNOUNCEMENT -> Icons.Default.Notifications
}

private fun calendarDateLabel(date: LocalDate): String {
    val today = LocalDate.now()
    return when (date) {
        today -> "Hôm nay • ${date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))}"
        today.plusDays(1) -> "Ngày mai • ${date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))}"
        else -> date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
    }
}
