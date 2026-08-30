/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
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
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import com.uigrade.ai.ui.components.SubmissionStatusBadge
import java.time.format.DateTimeFormatter
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentSubmissionDetailScreen(
    submissionId: String,
    onNavigateBack: () -> Unit,
    onNavigateToHistory: (String) -> Unit,
    onNavigateToResubmit: (String) -> Unit,
    onNavigateToResult: (String) -> Unit,
    viewModel: StudentSubmissionDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    LaunchedEffect(submissionId) { viewModel.load(submissionId) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Bài đã nộp") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(
                uiState.error ?: "Không thể tải bài nộp.",
                onRetry = { viewModel.load(submissionId) },
                modifier = Modifier.padding(padding)
            )
            uiState.submission == null -> EmptyScreen("Không tìm thấy bài nộp.", Modifier.padding(padding))
            else -> {
                val submission = uiState.submission ?: return@Scaffold
                val assignment = uiState.assignment
                LazyColumn(
                    Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Card(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(assignment?.title ?: "Bài nộp", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                                SubmissionStatusBadge(submission.status)
                                Text("Lần nộp: ${submission.attemptNumber}")
                                Text("Thời gian: ${submission.submittedAt.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))}")
                                Text(if (submission.isLate) "Nộp muộn" else "Nộp đúng hạn")
                                if (submission.resubmissionRequested) {
                                    Text("Giảng viên yêu cầu nộp lại.", color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                    if (submission.content.isNotBlank()) {
                        item { SubmissionTextCard("Nội dung bài làm", submission.content) }
                    }
                    if (submission.linkUrl.isNotBlank()) {
                        item {
                            OutlinedButton(
                                onClick = {
                                    openSubmissionUri(context, submission.linkUrl)?.let { scope.launch { snackbar.showSnackbar(it) } }
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.OpenInNew, contentDescription = null)
                                Spacer(Modifier.width(8.dp))
                                Text("Mở liên kết bài làm")
                            }
                        }
                    }
                    if (submission.attachments.isNotEmpty()) {
                        item { Text("Tệp đã nộp", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold) }
                        items(submission.attachments, key = { it.id }) { attachment ->
                            Card(
                                onClick = {
                                    openSubmissionUri(context, attachment.uri)?.let { scope.launch { snackbar.showSnackbar(it) } }
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(Modifier.padding(14.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Icon(Icons.Default.Description, contentDescription = null)
                                    Column(Modifier.weight(1f)) {
                                        Text(attachment.displayName, fontWeight = FontWeight.SemiBold)
                                        Text(attachment.mimeType, style = MaterialTheme.typography.labelSmall)
                                    }
                                    Icon(Icons.Default.OpenInNew, contentDescription = "Mở ${attachment.displayName}")
                                }
                            }
                        }
                    } else if (submission.fileName.isNotBlank()) {
                        item { SubmissionTextCard("Tệp đã nộp", submission.fileName) }
                    }
                    if (uiState.history.size > 1) {
                        item {
                            OutlinedButton(
                                onClick = { onNavigateToHistory(submission.assignmentId) },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.History, contentDescription = null)
                                Spacer(Modifier.width(8.dp))
                                Text("Xem lịch sử nộp bài")
                            }
                        }
                    }
                    uiState.grade?.let {
                        item {
                            Button(onClick = { onNavigateToResult(submission.id) }, modifier = Modifier.fillMaxWidth()) {
                                Text("Xem điểm và nhận xét")
                            }
                        }
                    }
                    item {
                        Button(
                            onClick = {
                                if (uiState.canResubmit) onNavigateToResubmit(submission.assignmentId)
                                else scope.launch { snackbar.showSnackbar(uiState.resubmitReason ?: "Không thể nộp lại bài này.") }
                            },
                            enabled = uiState.canResubmit,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Replay, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Nộp lại bài")
                        }
                        uiState.resubmitReason?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentSubmissionHistoryScreen(
    assignmentId: String,
    onNavigateBack: () -> Unit,
    onNavigateToSubmission: (String) -> Unit,
    viewModel: StudentSubmissionHistoryViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(assignmentId) { viewModel.load(assignmentId) }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Lịch sử nộp bài") },
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
                uiState.error ?: "Không thể tải lịch sử.",
                onRetry = { viewModel.load(assignmentId) },
                modifier = Modifier.padding(padding)
            )
            uiState.history.isEmpty() -> EmptyScreen("Bạn chưa nộp bài tập này.", Modifier.padding(padding))
            else -> LazyColumn(
                Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item { Text(uiState.assignment?.title.orEmpty(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold) }
                items(uiState.history, key = { it.id }) { submission ->
                    HistoryCard(submission) { onNavigateToSubmission(submission.id) }
                }
            }
        }
    }
}

@Composable
private fun HistoryCard(submission: Submission, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Lần nộp ${submission.attemptNumber}", fontWeight = FontWeight.Bold)
                SubmissionStatusBadge(submission.status)
            }
            Text(submission.submittedAt.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
            Text(if (submission.isLate) "Nộp muộn" else "Đúng hạn")
            if (submission.fileName.isNotBlank()) Text(submission.fileName, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun SubmissionTextCard(title: String, value: String) {
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, fontWeight = FontWeight.Bold)
            Text(value)
        }
    }
}

private fun openSubmissionUri(context: android.content.Context, raw: String): String? {
    val uri = runCatching { Uri.parse(raw) }.getOrNull() ?: return "Liên kết hoặc tệp không hợp lệ."
    if (uri.scheme !in setOf("http", "https", "content")) return "Liên kết hoặc tệp không hợp lệ."
    val intent = Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    if (intent.resolveActivity(context.packageManager) == null) return "Không có ứng dụng phù hợp để mở nội dung này."
    return runCatching { context.startActivity(intent) }.exceptionOrNull()?.let { "Không thể mở nội dung này." }
}
