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
import com.uigrade.ai.ui.components.AIFeedbackCard
import com.uigrade.ai.ui.components.scoreColor
import com.uigrade.ai.ui.theme.Primary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GradingScreen(
    submissionId: String,
    onNavigateBack: () -> Unit,
    onNavigateToGrading: (String) -> Unit,
    viewModel: GradingViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    var showReleaseDialog by remember { mutableStateOf(false) }
    var showLeaveDialog by remember { mutableStateOf(false) }
    var pendingSubmissionId by remember { mutableStateOf<String?>(null) }

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
        uiState.error?.takeIf { uiState.submission != null }?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chấm điểm bài nộp", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = {
                        if (uiState.hasUnsavedChanges) showLeaveDialog = true else onNavigateBack()
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            uiState.previousSubmissionId?.let { target ->
                                if (uiState.hasUnsavedChanges) {
                                    pendingSubmissionId = target
                                    showLeaveDialog = true
                                } else onNavigateToGrading(target)
                            }
                        },
                        enabled = uiState.previousSubmissionId != null && !uiState.isSaving
                    ) { Icon(Icons.Default.NavigateBefore, contentDescription = "Bài nộp trước") }
                    if (uiState.gradingTotal > 0) {
                        Text("${uiState.gradingPosition}/${uiState.gradingTotal}", style = MaterialTheme.typography.labelMedium)
                    }
                    IconButton(
                        onClick = {
                            uiState.nextSubmissionId?.let { target ->
                                if (uiState.hasUnsavedChanges) {
                                    pendingSubmissionId = target
                                    showLeaveDialog = true
                                } else onNavigateToGrading(target)
                            }
                        },
                        enabled = uiState.nextSubmissionId != null && !uiState.isSaving
                    ) { Icon(Icons.Default.NavigateNext, contentDescription = "Bài nộp tiếp theo") }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null && uiState.submission == null -> ErrorScreen(
                message = uiState.error.orEmpty(),
                onRetry = { viewModel.load(submissionId) },
                modifier = Modifier.padding(padding)
            )
            uiState.submission == null -> EmptyScreen("Không tìm thấy bài nộp", Modifier.padding(padding))
            else -> {
                val submission = uiState.submission ?: return@Scaffold
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

                    item {
                        Button(
                            onClick = viewModel::generateAiSupport,
                            enabled = !uiState.isSaving && !uiState.isGeneratingAi,
                            modifier = Modifier.fillMaxWidth().height(48.dp)
                        ) {
                            if (uiState.isGeneratingAi) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(22.dp),
                                    strokeWidth = 2.dp,
                                    color = MaterialTheme.colorScheme.onPrimary
                                )
                                Spacer(Modifier.width(8.dp))
                                Text("AI đang phân tích...")
                            } else {
                                Icon(Icons.Default.AutoAwesome, contentDescription = null)
                                Spacer(Modifier.width(8.dp))
                                Text(if (uiState.aiFeedback == null) "Nhờ AI phân tích hỗ trợ" else "Phân tích AI đã sẵn sàng")
                            }
                        }
                    }

                    uiState.aiFeedback?.let { feedback ->
                        item {
                            Text(
                                "Đề xuất AI — giảng viên quyết định kết quả cuối cùng",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(Modifier.height(8.dp))
                            AIFeedbackCard(feedback)
                            Spacer(Modifier.height(8.dp))
                            when (uiState.aiFeedbackAccepted) {
                                true -> Text(
                                    "Đã chấp nhận và thêm vào nhận xét chung.",
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.SemiBold
                                )
                                false -> Text(
                                    "Đã từ chối đề xuất này.",
                                    color = MaterialTheme.colorScheme.error,
                                    fontWeight = FontWeight.SemiBold
                                )
                                null -> Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)
                                ) {
                                    OutlinedButton(onClick = viewModel::rejectAiFeedback) { Text("Từ chối") }
                                    Button(onClick = viewModel::acceptAiFeedback) { Text("Chấp nhận gợi ý") }
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
                        Text("Theo dõi bài nộp", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(6.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            FilterChip(
                                selected = submission.needsReview,
                                onClick = viewModel::toggleNeedsReview,
                                enabled = !uiState.isSaving,
                                label = { Text("Cần xem lại") },
                                leadingIcon = { Icon(Icons.Default.Flag, contentDescription = null) }
                            )
                            FilterChip(
                                selected = submission.resubmissionRequested,
                                onClick = viewModel::toggleResubmissionRequest,
                                enabled = !uiState.isSaving && assignment?.allowResubmission == true,
                                label = { Text("Yêu cầu nộp lại") },
                                leadingIcon = { Icon(Icons.Default.Replay, contentDescription = null) }
                            )
                        }
                        if (assignment?.allowResubmission != true) {
                            Text(
                                "Bài tập này không cho phép nộp lại.",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    item {
                        Spacer(Modifier.height(8.dp))
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Button(
                                onClick = { showReleaseDialog = true },
                                enabled = !uiState.isSaving && !uiState.isGeneratingAi,
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
                                enabled = !uiState.isSaving && !uiState.isGeneratingAi,
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

    if (showLeaveDialog) {
        AlertDialog(
            onDismissRequest = { showLeaveDialog = false },
            title = { Text("Rời màn hình chấm điểm?") },
            text = {
                Text(
                    if (pendingSubmissionId == null) "Bạn có thay đổi chưa lưu. Nếu rời đi, các thay đổi này sẽ bị mất."
                    else "Bạn có thay đổi chưa lưu. Nếu chuyển bài nộp, các thay đổi này sẽ bị mất."
                )
            },
            confirmButton = {
                Button(onClick = {
                    showLeaveDialog = false
                    val target = pendingSubmissionId
                    pendingSubmissionId = null
                    if (target == null) onNavigateBack() else onNavigateToGrading(target)
                }) { Text(if (pendingSubmissionId == null) "Rời đi" else "Chuyển bài") }
            },
            dismissButton = {
                TextButton(onClick = { showLeaveDialog = false }) { Text("Tiếp tục chấm") }
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
                steps = (criterion.maxScore - 1).coerceAtLeast(0)
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
