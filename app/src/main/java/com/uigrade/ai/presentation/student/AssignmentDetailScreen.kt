package com.uigrade.ai.presentation.student

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignmentDetailScreen(
    assignmentId: String,
    onNavigateBack: () -> Unit,
    onNavigateToSubmit: () -> Unit,
    onNavigateToResult: (submissionId: String) -> Unit,
    viewModel: AssignmentDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")

    LaunchedEffect(assignmentId) { viewModel.load(assignmentId) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chi tiết bài tập") },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Back") } }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error!!, onRetry = { viewModel.load(assignmentId) }, modifier = Modifier.padding(padding))
            uiState.assignment == null -> EmptyScreen("Không tìm thấy bài tập", Modifier.padding(padding))
            else -> {
                val assignment = uiState.assignment!!
                val rubric = uiState.rubric
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        Text(assignment.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(4.dp))
                        Text(assignment.courseName, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("Deadline: ${assignment.deadline.format(fmt)}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.error)
                    }

                    item {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Mô tả", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                                Spacer(Modifier.height(8.dp))
                                Text(assignment.description, style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }

                    if (rubric != null) {
                        item {
                            Text("Rubric chấm điểm", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                        }
                        item {
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Text(rubric.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                                    HorizontalDivider()
                                    rubric.criteria.forEach { criterion ->
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(criterion.name, style = MaterialTheme.typography.bodyMedium)
                                            Text("${criterion.weightPercent}% (${criterion.maxScore} điểm)", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }
                                    }
                                    HorizontalDivider()
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Tổng cộng", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                                        Text("${rubric.totalMaxScore} điểm", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }

                    item {
                        val canViewResult = uiState.status == AssignmentStatus.GRADED && uiState.submissionId != null
                        Button(
                            onClick = {
                                if (canViewResult) onNavigateToResult(uiState.submissionId!!)
                                else onNavigateToSubmit()
                            },
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                            shape = MaterialTheme.shapes.medium
                        ) {
                            Icon(Icons.Default.Send, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text(
                                if (canViewResult) "Xem kết quả" else "Nộp bài tập",
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        Spacer(Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}
