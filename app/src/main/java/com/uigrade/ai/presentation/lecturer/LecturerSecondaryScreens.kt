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
import com.uigrade.ai.ui.components.*
import com.uigrade.ai.ui.components.scoreColor
import java.time.format.DateTimeFormatter

// ─── Submission List ──────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubmissionListScreen(
    assignmentId: String,
    onNavigateBack: () -> Unit,
    onNavigateToSubmission: (String) -> Unit,
    viewModel: SubmissionListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(assignmentId) { viewModel.load(assignmentId) }
    val fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Bài nộp") }, navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Back") } })
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error!!, modifier = Modifier.padding(padding))
            uiState.submissions.isEmpty() -> EmptyScreen("Chưa có bài nộp nào", Modifier.padding(padding))
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item { Text("${uiState.submissions.size} bài nộp", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold) }
                items(uiState.submissions) { sub ->
                    Card(onClick = { onNavigateToSubmission(sub.id) }, modifier = Modifier.fillMaxWidth()) {
                        Row(modifier = Modifier.padding(12.dp, 10.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(sub.studentName, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                                Text(sub.submittedAt.format(fmt), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            SubmissionStatusBadge(sub.status)
                        }
                    }
                }
            }
        }
    }
}

// ─── Submission Detail ────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubmissionDetailScreen(
    submissionId: String,
    onNavigateBack: () -> Unit,
    viewModel: SubmissionDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(submissionId) { viewModel.load(submissionId) }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Chi tiết bài nộp") }, navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Back") } })
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error!!, modifier = Modifier.padding(padding))
            uiState.gradingResult == null -> EmptyScreen("Chưa có kết quả chấm điểm", Modifier.padding(padding))
            else -> {
                val result = uiState.gradingResult!!
                LazyColumn(modifier = Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
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
                            }
                        }
                    }
                    uiState.feedback?.let { feedback ->
                        item { AIFeedbackCard(feedback) }
                    }
                }
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
            TopAppBar(title = { Text("Thống kê lớp") }, navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Back") } })
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
