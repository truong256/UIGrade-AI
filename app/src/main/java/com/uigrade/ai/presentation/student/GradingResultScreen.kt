package com.uigrade.ai.presentation.student

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.CriterionScore
import com.uigrade.ai.ui.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GradingResultScreen(
    submissionId: String,
    onNavigateBack: () -> Unit,
    viewModel: GradingResultViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(submissionId) { viewModel.load(submissionId) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Kết quả chấm điểm") },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Back") } }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error!!, onRetry = { viewModel.load(submissionId) }, modifier = Modifier.padding(padding))
            uiState.gradingResult == null -> EmptyScreen("Chưa có kết quả chấm điểm. Bài đang được xử lý.", Modifier.padding(padding))
            else -> {
                val result = uiState.gradingResult!!
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Total score hero
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                            shape = MaterialTheme.shapes.extraLarge
                        ) {
                            Column(
                                modifier = Modifier.fillMaxWidth().padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text("Tổng điểm", style = MaterialTheme.typography.titleMedium)
                                ScoreRing(score = result.totalScore, maxScore = result.maxScore, modifier = Modifier.size(120.dp))
                                Text(
                                    "Engine: ${result.engineVersion}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Surface(color = MaterialTheme.colorScheme.secondaryContainer, shape = MaterialTheme.shapes.small) {
                                    Text(
                                        "⚠ Điểm được tính bằng metric/rule xác định. AI không quyết định điểm.",
                                        style = MaterialTheme.typography.labelSmall,
                                        modifier = Modifier.padding(8.dp, 4.dp),
                                        color = MaterialTheme.colorScheme.onSecondaryContainer
                                    )
                                }
                            }
                        }
                    }

                    // Criteria scores
                    item { Text("Chi tiết theo tiêu chí", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold) }

                    items(result.criteriaScores) { criterionScore ->
                        CriterionScoreSection(criterionScore)
                    }

                    // AI Feedback
                    uiState.feedback?.let { feedback ->
                        item { Text("Phản hồi từ AI", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold) }
                        item { AIFeedbackCard(feedback) }
                    }

                    item { Spacer(Modifier.height(16.dp)) }
                }
            }
        }
    }
}

@Composable
private fun CriterionScoreSection(score: CriterionScore) {
    var expanded by remember { mutableStateOf(false) }
    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(score.criterionName, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                Text(
                    "${score.earned} / ${score.maxScore}",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = scoreColor(score.earned, score.maxScore)
                )
            }
            LinearProgressIndicator(
                progress = { score.percentage },
                modifier = Modifier.fillMaxWidth(),
                color = scoreColor(score.earned, score.maxScore),
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )

            TextButton(
                onClick = { expanded = !expanded },
                contentPadding = PaddingValues(0.dp)
            ) {
                Text(if (expanded) "Ẩn chi tiết" else "Xem chi tiết metric & rule")
            }

            if (expanded) {
                if (score.metrics.isNotEmpty()) {
                    Text("Metrics", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    score.metrics.forEach { metric -> MetricCard(metric, Modifier.padding(top = 4.dp)) }
                }
                if (score.rules.isNotEmpty()) {
                    Spacer(Modifier.height(4.dp))
                    Text("Rules", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    score.rules.forEach { rule -> RuleCard(rule, Modifier.padding(top = 4.dp)) }
                }
            }
        }
    }
}
