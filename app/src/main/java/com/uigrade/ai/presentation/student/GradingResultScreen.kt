/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Description
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.CriterionScore
import com.uigrade.ai.ui.components.AIFeedbackCard
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import com.uigrade.ai.ui.components.ScoreRing
import com.uigrade.ai.ui.components.scoreColor
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GradingResultScreen(
    submissionId: String,
    onNavigateBack: () -> Unit,
    onNavigateToSubmission: (String) -> Unit,
    viewModel: GradingResultViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(submissionId) { viewModel.load(submissionId) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Kết quả học tập", fontWeight = FontWeight.Bold) },
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
                uiState.error ?: "Không thể tải kết quả.",
                onRetry = { viewModel.load(submissionId) },
                modifier = Modifier.padding(padding)
            )
            uiState.gradingResult == null -> EmptyScreen(
                "Giảng viên chưa công bố kết quả.",
                Modifier.padding(padding)
            )
            else -> {
                val result = uiState.gradingResult ?: return@Scaffold
                LazyColumn(
                    Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                        ) {
                            Column(
                                Modifier.fillMaxWidth().padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text("Điểm chính thức", style = MaterialTheme.typography.titleMedium)
                                if (result.maxScore > 0) {
                                    ScoreRing(
                                        score = result.totalScore.coerceIn(0, result.maxScore),
                                        maxScore = result.maxScore,
                                        modifier = Modifier.size(120.dp)
                                    )
                                    Text("${(result.percentage * 100).coerceIn(0f, 100f).toInt()}%")
                                } else {
                                    Text("Chưa xác định", style = MaterialTheme.typography.headlineSmall)
                                }
                                Text("Công bố: ${result.gradedAt.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))}")
                            }
                        }
                    }
                    if (result.lecturerComment.isNotBlank()) {
                        item {
                            Card(Modifier.fillMaxWidth()) {
                                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text("Phản hồi của Giảng viên", fontWeight = FontWeight.Bold)
                                    Text(result.lecturerComment)
                                }
                            }
                        }
                    }
                    item { Text("Điểm theo rubric", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold) }
                    items(result.criteriaScores, key = { it.criterionId }) { score ->
                        StudentCriterionScoreCard(score)
                    }
                    item {
                        OutlinedButton(
                            onClick = { onNavigateToSubmission(submissionId) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Description, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Mở lại bài đã nộp")
                        }
                    }
                    item {
                        Text("Gợi ý từ AI", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(
                            "AI chỉ giải thích và đề xuất cải thiện, không tự thay đổi điểm chính thức.",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    uiState.feedback?.let { feedback ->
                        item { AIFeedbackCard(feedback) }
                    }
                    item {
                        Button(
                            onClick = viewModel::requestAiExplanation,
                            enabled = !uiState.isAiLoading,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            if (uiState.isAiLoading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                            else Icon(Icons.Default.AutoAwesome, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text(if (uiState.feedback == null) "Yêu cầu AI giải thích" else "Tạo lại giải thích AI")
                        }
                        uiState.aiError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    }
                }
            }
        }
    }
}

@Composable
private fun StudentCriterionScoreCard(score: CriterionScore) {
    val percent = if (score.maxScore > 0) {
        (score.earned.coerceIn(0, score.maxScore).toFloat() / score.maxScore).coerceIn(0f, 1f)
    } else 0f
    Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(score.criterionName, Modifier.weight(1f), fontWeight = FontWeight.SemiBold)
                Text("${score.earned.coerceAtLeast(0)}/${score.maxScore.coerceAtLeast(0)}", fontWeight = FontWeight.Bold)
            }
            LinearProgressIndicator(
                progress = { percent },
                modifier = Modifier.fillMaxWidth(),
                color = scoreColor(score.earned, score.maxScore)
            )
            if (score.lecturerComment.isNotBlank()) {
                Text("Nhận xét: ${score.lecturerComment}", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}
