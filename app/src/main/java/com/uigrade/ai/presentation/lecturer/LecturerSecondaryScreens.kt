package com.uigrade.ai.presentation.lecturer

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.model.SubmissionStatus
import com.uigrade.ai.ui.components.*
import com.uigrade.ai.ui.theme.Info
import com.uigrade.ai.ui.theme.Primary
import com.uigrade.ai.ui.theme.Success
import com.uigrade.ai.ui.theme.Warning
import java.time.format.DateTimeFormatter

// ─── Submission List ──────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubmissionListScreen(
    assignmentId: String,
    onNavigateBack: () -> Unit,
    onNavigateToSubmission: (String) -> Unit,
    onNavigateToGrading: (String) -> Unit = onNavigateToSubmission,
    viewModel: SubmissionListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(assignmentId) { viewModel.load(assignmentId) }
    val fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")

    var sortDropdownExpanded by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(uiState.assignment?.title ?: "Danh sách bài nộp", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    Box {
                        IconButton(onClick = { sortDropdownExpanded = true }) {
                            Icon(Icons.Default.Sort, contentDescription = "Sắp xếp")
                        }
                        DropdownMenu(
                            expanded = sortDropdownExpanded,
                            onDismissRequest = { sortDropdownExpanded = false }
                        ) {
                            SubmissionSortOption.values().forEach { option ->
                                DropdownMenuItem(
                                    text = {
                                        Text(
                                            option.displayName,
                                            fontWeight = if (uiState.sortOption == option) FontWeight.Bold else FontWeight.Normal
                                        )
                                    },
                                    onClick = {
                                        viewModel.onSortChange(option)
                                        sortDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(
                uiState.error.orEmpty(),
                onRetry = { viewModel.load(assignmentId) },
                modifier = Modifier.padding(padding)
            )
            else -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                ) {
                    // Summary Stats Row
                    val s = uiState.summary
                    LazyRow(
                        modifier = Modifier.fillMaxWidth(),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        item { SubmissionStatBadge("Tổng SV", "${s.totalStudents}", Primary) }
                        item { SubmissionStatBadge("Đã nộp", "${s.submitted}", Info) }
                        item { SubmissionStatBadge("Chưa nộp", "${s.notSubmitted}", Color.Gray) }
                        item { SubmissionStatBadge("Nộp muộn", "${s.late}", MaterialTheme.colorScheme.error) }
                        item { SubmissionStatBadge("Đang chấm", "${s.grading}", Warning) }
                        item { SubmissionStatBadge("Đã chấm", "${s.graded}", Success) }
                    }

                    // Search Bar
                    OutlinedTextField(
                        value = uiState.searchQuery,
                        onValueChange = { viewModel.onSearchChange(it) },
                        placeholder = { Text("Tìm theo tên sinh viên hoặc tên file...") },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                        trailingIcon = {
                            if (uiState.searchQuery.isNotBlank()) {
                                IconButton(onClick = { viewModel.onSearchChange("") }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Xóa")
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true
                    )

                    // Status Filter Chips
                    LazyRow(
                        modifier = Modifier.fillMaxWidth(),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        item {
                            FilterChip(
                                selected = uiState.selectedStatus == null && !uiState.showMissingOnly,
                                onClick = { viewModel.onStatusFilterChange(null) },
                                label = { Text("Tất cả (${uiState.allSubmissions.size})") }
                            )
                        }
                        item {
                            FilterChip(
                                selected = uiState.showMissingOnly,
                                onClick = viewModel::showMissingSubmissions,
                                label = { Text("Chưa nộp (${uiState.missingStudents.size})") }
                            )
                        }
                        item {
                            FilterChip(
                                selected = uiState.selectedStatus == SubmissionStatus.SUBMITTED,
                                onClick = { viewModel.onStatusFilterChange(SubmissionStatus.SUBMITTED) },
                                label = { Text("Đã nộp") }
                            )
                        }
                        item {
                            FilterChip(
                                selected = uiState.selectedStatus == SubmissionStatus.LATE,
                                onClick = { viewModel.onStatusFilterChange(SubmissionStatus.LATE) },
                                label = { Text("Nộp muộn") }
                            )
                        }
                        item {
                            FilterChip(
                                selected = uiState.selectedStatus == SubmissionStatus.GRADING,
                                onClick = { viewModel.onStatusFilterChange(SubmissionStatus.GRADING) },
                                label = { Text("Đang chấm") }
                            )
                        }
                        item {
                            FilterChip(
                                selected = uiState.selectedStatus == SubmissionStatus.GRADED || uiState.selectedStatus == SubmissionStatus.COMPLETED,
                                onClick = { viewModel.onStatusFilterChange(SubmissionStatus.GRADED) },
                                label = { Text("Đã chấm") }
                            )
                        }
                        item {
                            FilterChip(
                                selected = uiState.selectedStatus == SubmissionStatus.RELEASED,
                                onClick = { viewModel.onStatusFilterChange(SubmissionStatus.RELEASED) },
                                label = { Text("Đã công bố") }
                            )
                        }
                    }

                    Spacer(Modifier.height(4.dp))

                    if (uiState.showMissingOnly && uiState.filteredMissingStudents.isEmpty()) {
                        EmptyScreen(
                            message = if (uiState.searchQuery.isNotBlank()) "Không có sinh viên phù hợp" else "Tất cả sinh viên đã nộp bài",
                            modifier = Modifier.fillMaxSize()
                        )
                    } else if (uiState.showMissingOnly) {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(uiState.filteredMissingStudents, key = { it.id }) { student ->
                                Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(14.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(Modifier.weight(1f)) {
                                            Text(student.name, fontWeight = FontWeight.Bold)
                                            Text(
                                                listOfNotNull(student.studentId, student.email).joinToString(" · "),
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                        Text("Chưa nộp", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.labelMedium)
                                    }
                                }
                            }
                        }
                    } else if (uiState.filteredSubmissions.isEmpty()) {
                        EmptyScreen(
                            message = if (uiState.searchQuery.isNotBlank()) "Không có kết quả phù hợp" else "Chưa có sinh viên nộp bài",
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(uiState.filteredSubmissions, key = { it.id }) { sub ->
                                val gradeResult = uiState.gradingResults[sub.id]
                                Card(
                                    onClick = { onNavigateToGrading(sub.id) },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(sub.studentName, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                                            SubmissionStatusBadge(sub.status)
                                        }

                                        if (sub.fileName.isNotBlank()) {
                                            Text("Tệp: ${sub.fileName}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }

                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                "Nộp lúc: ${sub.submittedAt.format(fmt)} (Lần ${sub.attemptNumber})",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                            if (gradeResult != null) {
                                                Text(
                                                    "Điểm: ${gradeResult.totalScore}/${gradeResult.maxScore}",
                                                    style = MaterialTheme.typography.titleSmall,
                                                    fontWeight = FontWeight.Bold,
                                                    color = scoreColor(gradeResult.totalScore, gradeResult.maxScore)
                                                )
                                            }
                                        }

                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.End
                                        ) {
                                            Button(
                                                onClick = { onNavigateToGrading(sub.id) },
                                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                            ) {
                                                Icon(Icons.Default.Grading, contentDescription = null, modifier = Modifier.size(16.dp))
                                                Spacer(Modifier.width(4.dp))
                                                Text(if (gradeResult != null) "Xem / Sửa điểm" else "Chấm điểm", fontSize = 13.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SubmissionStatBadge(label: String, count: String, color: Color) {
    Surface(
        color = color.copy(alpha = 0.12f),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = color)
            Text(count, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = color)
        }
    }
}

// ─── Submission Detail ────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubmissionDetailScreen(
    submissionId: String,
    onNavigateBack: () -> Unit,
    onNavigateToGrading: (String) -> Unit,
    viewModel: SubmissionDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(submissionId) { viewModel.load(submissionId) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chi tiết bài nộp", fontWeight = FontWeight.Bold) },
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
                onRetry = { viewModel.load(submissionId) },
                modifier = Modifier.padding(padding)
            )
            uiState.gradingResult == null -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    uiState.submission?.let { submission -> item { SubmissionInfoCard(submission) } }
                    item {
                        Text("Bài nộp chưa được chấm điểm", style = MaterialTheme.typography.titleMedium)
                    }
                    item {
                        Button(
                            onClick = { onNavigateToGrading(submissionId) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Grading, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Bắt đầu chấm bài")
                        }
                    }
                }
            }
            else -> {
                val result = uiState.gradingResult ?: return@Scaffold
                LazyColumn(modifier = Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    uiState.submission?.let { submission -> item { SubmissionInfoCard(submission) } }
                    item {
                        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
                            Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Text("Tổng điểm", style = MaterialTheme.typography.titleMedium)
                                Text("${result.totalScore} / ${result.maxScore}", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = scoreColor(result.totalScore, result.maxScore))
                            }
                        }
                    }
                    item { Text("Tiêu chí", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold) }
                    items(result.criteriaScores) { cs ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(cs.criterionName, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                                    Text("${cs.earned}/${cs.maxScore}", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = scoreColor(cs.earned, cs.maxScore))
                                }
                                LinearProgressIndicator(progress = { cs.percentage }, modifier = Modifier.fillMaxWidth(), color = scoreColor(cs.earned, cs.maxScore), trackColor = MaterialTheme.colorScheme.surfaceVariant)
                                if (cs.lecturerComment.isNotBlank()) {
                                    Text("Ghi chú: ${cs.lecturerComment}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                    if (result.lecturerComment.isNotBlank()) {
                        item {
                            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text("Nhận xét chung của giảng viên", fontWeight = FontWeight.Bold)
                                    Text(result.lecturerComment, style = MaterialTheme.typography.bodyMedium)
                                }
                            }
                        }
                    }
                    uiState.feedback?.let { feedback ->
                        item { AIFeedbackCard(feedback) }
                    }
                    item {
                        Button(
                            onClick = { onNavigateToGrading(submissionId) },
                            modifier = Modifier.fillMaxWidth().height(48.dp)
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Chỉnh sửa điểm & nhận xét")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SubmissionInfoCard(submission: Submission) {
    val context = LocalContext.current
    val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(submission.studentName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("Nộp lúc: ${submission.submittedAt.format(formatter)} · Lần ${submission.attemptNumber}")
            Text("Tệp: ${submission.fileName.ifBlank { "Không có tên tệp" }}", style = MaterialTheme.typography.bodySmall)
            if (submission.isLate) {
                Text("Bài nộp muộn", color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.SemiBold)
            }
            OutlinedButton(
                onClick = {
                    runCatching {
                        val fileUri = requireNotNull(submission.fileUri)
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(fileUri)).apply {
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        }
                        context.startActivity(intent)
                    }.onFailure {
                        Toast.makeText(context, "Không có ứng dụng phù hợp để mở tệp.", Toast.LENGTH_SHORT).show()
                    }
                },
                enabled = !submission.fileUri.isNullOrBlank()
            ) {
                Icon(Icons.Default.OpenInNew, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Mở tệp bài nộp")
            }
            if (submission.fileUri.isNullOrBlank()) {
                Text("Dữ liệu minh họa chưa đính kèm URI tệp.", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

// ─── Statistics ───────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LecturerStatisticsScreen(
    onNavigateBack: () -> Unit,
    viewModel: LecturerDashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Thống kê lớp học", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            uiState.stats?.let { stats ->
                StatItem("Tổng bài tập", "${stats.totalAssignments}")
                StatItem("Tổng bài nộp", "${stats.totalSubmissions}")
                StatItem("Điểm trung bình", "${"%.1f".format(stats.averageScore)} / 100")
                StatItem("Chờ chấm", "${stats.pendingGrading}")
            }
        }
    }
}

@Composable
private fun StatItem(label: String, value: String) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, style = MaterialTheme.typography.bodyMedium)
            Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
        }
    }
}
