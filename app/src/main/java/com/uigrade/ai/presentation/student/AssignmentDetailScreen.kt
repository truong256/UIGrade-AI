package com.uigrade.ai.presentation.student

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Attachment
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.ui.components.AssignmentStatusBadge
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import java.time.format.DateTimeFormatter
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignmentDetailScreen(
    assignmentId: String,
    onNavigateBack: () -> Unit,
    onNavigateToEditor: () -> Unit,
    onNavigateToSubmission: (String) -> Unit,
    onNavigateToResult: (String) -> Unit,
    onNavigateToHistory: () -> Unit,
    viewModel: AssignmentDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val formatter = remember { DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm") }

    LaunchedEffect(assignmentId) { viewModel.load(assignmentId) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chi tiết bài tập") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.load(assignmentId, refresh = true) }, enabled = !uiState.isRefreshing) {
                        if (uiState.isRefreshing) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                        else Icon(Icons.Default.Refresh, contentDescription = "Làm mới bài tập")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(
                uiState.error ?: "Không thể tải bài tập.",
                onRetry = { viewModel.load(assignmentId) },
                modifier = Modifier.padding(padding)
            )
            uiState.data == null -> EmptyScreen("Không tìm thấy bài tập.", Modifier.padding(padding))
            else -> {
                val data = uiState.data
                if (data == null) return@Scaffold
                val assignment = data.item.assignment
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            AssignmentStatusBadge(data.item.status)
                            Text(assignment.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                            Text("${data.classroom.courseCode} • ${data.classroom.name}")
                            Text("Giảng viên: ${data.classroom.lecturerName}")
                        }
                    }
                    item {
                        Card(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Thời gian", fontWeight = FontWeight.Bold)
                                assignment.startAt?.let { Text("Bắt đầu: ${it.format(formatter)}") }
                                Text("Hạn nộp: ${assignment.deadline.format(formatter)}", color = MaterialTheme.colorScheme.error)
                                assignment.closeAt?.let { Text("Đóng bài: ${it.format(formatter)}") }
                                Text("Số lần nộp: ${data.item.attemptsUsed}/${assignment.maxAttempts}")
                                Text(if (assignment.allowLateSubmission) "Cho phép nộp muộn" else "Không cho phép nộp muộn")
                                Text(if (assignment.allowResubmission) "Cho phép nộp lại" else "Không cho phép nộp lại")
                            }
                        }
                    }
                    item { DetailSection("Mô tả", assignment.description.ifBlank { "Không có mô tả." }) }
                    item { DetailSection("Hướng dẫn", assignment.instructions.ifBlank { "Giảng viên chưa bổ sung hướng dẫn." }) }

                    if (!assignment.attachmentUri.isNullOrBlank() || assignment.resourceUrl.isNotBlank()) {
                        item {
                            Text("Tài liệu đính kèm", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        }
                        assignment.attachmentUri?.takeIf(String::isNotBlank)?.let { uri ->
                            item {
                                OutlinedButton(
                                    onClick = {
                                        openAssignmentUri(context, uri)?.let { scope.launch { snackbar.showSnackbar(it) } }
                                    },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Icon(Icons.Default.Attachment, contentDescription = null)
                                    Spacer(Modifier.width(8.dp))
                                    Text("Mở tệp đính kèm")
                                }
                            }
                        }
                        if (assignment.resourceUrl.isNotBlank()) {
                            item {
                                OutlinedButton(
                                    onClick = {
                                        openAssignmentUri(context, assignment.resourceUrl)?.let { scope.launch { snackbar.showSnackbar(it) } }
                                    },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Icon(Icons.Default.OpenInNew, contentDescription = null)
                                    Spacer(Modifier.width(8.dp))
                                    Text("Mở tài liệu tham khảo")
                                }
                            }
                        }
                    }

                    uiState.rubric?.let { rubric ->
                        item {
                            Text("Rubric chấm điểm", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        }
                        items(rubric.criteria, key = { it.id }) { criterion ->
                            Card(Modifier.fillMaxWidth()) {
                                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text(criterion.name, Modifier.weight(1f), fontWeight = FontWeight.SemiBold)
                                        Text("${criterion.maxScore} điểm")
                                    }
                                    Text(criterion.description, style = MaterialTheme.typography.bodySmall)
                                    if (criterion.levels.isNotEmpty()) {
                                        Text(
                                            criterion.levels.joinToString(" • ") { "${it.title}: ${it.score}" },
                                            style = MaterialTheme.typography.labelSmall
                                        )
                                    }
                                }
                            }
                        }
                    }

                    if (data.history.isNotEmpty()) {
                        item {
                            TextButton(onClick = onNavigateToHistory, modifier = Modifier.fillMaxWidth()) {
                                Icon(Icons.Default.History, contentDescription = null)
                                Spacer(Modifier.width(8.dp))
                                Text("Xem lịch sử ${data.history.count { !it.isDraft }} lần nộp")
                            }
                        }
                    }

                    item {
                        Button(
                            onClick = {
                                when (uiState.action) {
                                    StudentAssignmentAction.START,
                                    StudentAssignmentAction.CONTINUE_DRAFT,
                                    StudentAssignmentAction.RESUBMIT -> onNavigateToEditor()
                                    StudentAssignmentAction.VIEW_SUBMISSION -> {
                                        val id = data.item.submissionId
                                        if (id != null) onNavigateToSubmission(id)
                                        else scope.launch { snackbar.showSnackbar("Không tìm thấy bài nộp hiện tại.") }
                                    }
                                    StudentAssignmentAction.VIEW_RESULT -> {
                                        val id = data.releasedGrade?.submissionId
                                        if (id != null) onNavigateToResult(id)
                                        else scope.launch { snackbar.showSnackbar("Giảng viên chưa công bố kết quả.") }
                                    }
                                    StudentAssignmentAction.DISABLED -> scope.launch {
                                        snackbar.showSnackbar(uiState.disabledReason ?: uiState.actionLabel)
                                    }
                                }
                            },
                            enabled = uiState.action != StudentAssignmentAction.DISABLED,
                            modifier = Modifier.fillMaxWidth().height(52.dp)
                        ) {
                            Icon(Icons.Default.Send, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text(uiState.actionLabel, fontWeight = FontWeight.Bold)
                        }
                        uiState.disabledReason?.let {
                            Text(
                                it,
                                modifier = Modifier.fillMaxWidth().padding(top = 6.dp),
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailSection(title: String, content: String) {
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, fontWeight = FontWeight.Bold)
            Text(content)
        }
    }
}

private fun openAssignmentUri(context: android.content.Context, raw: String): String? {
    val uri = runCatching { Uri.parse(raw) }.getOrNull() ?: return "Liên kết không hợp lệ."
    if (uri.scheme !in setOf("http", "https", "content")) return "Liên kết không hợp lệ."
    val intent = Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    if (intent.resolveActivity(context.packageManager) == null) return "Không có ứng dụng phù hợp để mở nội dung này."
    return runCatching { context.startActivity(intent) }
        .exceptionOrNull()
        ?.let { "Không thể mở nội dung này." }
}
