package com.uigrade.ai.presentation.lecturer

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.RubricCriterion
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import com.uigrade.ai.ui.components.scoreColor
import com.uigrade.ai.ui.theme.Primary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GradingScreen(
    submissionId: String,
    onNavigateBack: () -> Unit,
    viewModel: GradingViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    var showReleaseDialog by remember { mutableStateOf(false) }

    LaunchedEffect(submissionId) {
        viewModel.load(submissionId)
    }

    LaunchedEffect(uiState.snackbarMessage) {
        uiState.snackbarMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearSnackbar()
        }
    }

    LaunchedEffect(uiState.error) {
        uiState.error?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chấm điểm bài nộp", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null && uiState.submission == null -> ErrorScreen(
                message = uiState.error!!,
                onRetry = { viewModel.load(submissionId) },
                modifier = Modifier.padding(padding)
            )
            uiState.submission == null -> EmptyScreen("Không tìm thấy bài nộp", Modifier.padding(padding))
            else -> {
                val submission = uiState.submission!!
                val assignment = uiState.assignment
                val rubric = uiState.rubric
                val maxScore = assignment?.totalMaxScore ?: 100

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Student & Submission Summary
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(submission.studentName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                Text("Bài tập: ${assignment?.title ?: "N/A"}", style = MaterialTheme.typography.bodyMedium)
                                submission.fileName.takeIf { it.isNotBlank() }?.let {
                                    Text("Tệp đã nộp: $it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                if (submission.isLate) {
                                    Text("⚠️ Nộp muộn", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // Total Score Card
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f))
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("Tổng điểm", style = MaterialTheme.typography.labelMedium)
                                    Text(
                                        "${uiState.totalScore} / $maxScore",
                                        style = MaterialTheme.typography.headlineMedium,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = scoreColor(uiState.totalScore, maxScore)
                                    )
                                }
                                if (uiState.existingResult?.isReleased == true) {
                                    Surface(
                                        color = MaterialTheme.colorScheme.primary,
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text(
                                            "Đã công bố",
                                            color = MaterialTheme.colorScheme.onPrimary,
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Rubric Criteria Section
                    if (rubric != null && rubric.criteria.isNotEmpty()) {
                        item {
                            Text("Tiêu chí chấm điểm (${rubric.title})", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        }

                        items(rubric.criteria, key = { it.id }) { criterion ->
                            CriterionGradingCard(
                                criterion = criterion,
                                score = uiState.criteriaScores[criterion.id] ?: 0,
                                comment = uiState.criteriaComments[criterion.id] ?: "",
                                onScoreChange = { score -> viewModel.updateCriterionScore(criterion.id, score) },
                                onCommentChange = { comment -> viewModel.updateCriterionComment(criterion.id, comment) }
                            )
                        }
                    } else {
                        // Manual Total Score Input if no Rubric
                        item {
                            OutlinedTextField(
                                value = uiState.totalScore.toString(),
                                onValueChange = { str ->
                                    val score = str.filter { it.isDigit() }.toIntOrNull() ?: 0
                                    viewModel.updateCriterionScore("manual", score.coerceIn(0, maxScore))
                                },
                                label = { Text("Nhập điểm (0 - $maxScore)") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp)
                            )
                        }
                    }

                    // Lecturer Overall Comment
                    item {
                        Text("Nhận xét của giảng viên", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(4.dp))
                        OutlinedTextField(
                            value = uiState.lecturerComment,
                            onValueChange = { viewModel.updateLecturerComment(it) },
                            placeholder = { Text("Viết nhận xét, góp ý chi tiết cho sinh viên...") },
                            minLines = 3,
                            maxLines = 6,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                    }

                    // AI Disclaimer
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Primary, modifier = Modifier.size(20.dp))
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    "AI chỉ hỗ trợ tạo nhận xét. Điểm số do hệ thống tiêu chí và giảng viên xác nhận.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    // Action Buttons
                    item {
                        Spacer(Modifier.height(8.dp))
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Button(
                                onClick = { showReleaseDialog = true },
                                enabled = !uiState.isSaving,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                if (uiState.isSaving) {
                                    CircularProgressIndicator(modifier = Modifier.size(24.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                                } else {
                                    Icon(Icons.Default.Send, contentDescription = null)
                                    Spacer(Modifier.width(8.dp))
                                    Text("Hoàn tất & Công bố điểm", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                }
                            }

                            OutlinedButton(
                                onClick = { viewModel.saveDraft() },
                                enabled = !uiState.isSaving,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.Save, contentDescription = null)
                                Spacer(Modifier.width(8.dp))
                                Text("Lưu bản chấm nháp", fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showReleaseDialog) {
        AlertDialog(
            onDismissRequest = { showReleaseDialog = false },
            title = { Text("Công bố điểm cho sinh viên?") },
            text = { Text("Sau khi công bố, sinh viên sẽ có thể xem điểm và nhận xét của bạn. Bạn vẫn có thể cập nhật lại điểm nếu cần.") },
            confirmButton = {
                Button(onClick = {
                    showReleaseDialog = false
                    viewModel.finalizeAndRelease(onNavigateBack)
                }) {
                    Text("Công bố điểm")
                }
            },
            dismissButton = {
                TextButton(onClick = { showReleaseDialog = false }) { Text("Hủy") }
            }
        )
    }
}

@Composable
private fun CriterionGradingCard(
    criterion: RubricCriterion,
    score: Int,
    comment: String,
    onScoreChange: (Int) -> Unit,
    onCommentChange: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(criterion.name, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                    Text(criterion.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Text(
                    "$score / ${criterion.maxScore} đ",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = scoreColor(score, criterion.maxScore)
                )
            }

            Slider(
                value = score.toFloat(),
                onValueChange = { onScoreChange(it.toInt()) },
                valueRange = 0f..criterion.maxScore.toFloat(),
                steps = criterion.maxScore - 1
            )

            OutlinedTextField(
                value = comment,
                onValueChange = onCommentChange,
                placeholder = { Text("Ghi chú cho tiêu chí này (tùy chọn)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                singleLine = true
            )
        }
    }
}
