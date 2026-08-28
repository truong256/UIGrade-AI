package com.uigrade.ai.presentation.student

import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.SubmissionAttachment
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import com.uigrade.ai.ui.components.mascot.CatMascot
import com.uigrade.ai.ui.components.mascot.CatMascotState
import com.uigrade.ai.ui.components.mascot.CatMascotStyle
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubmitAssignmentScreen(
    assignmentId: String,
    onNavigateBack: () -> Unit,
    onSubmitSuccess: (String) -> Unit,
    viewModel: SubmitAssignmentViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    var showSubmitConfirmation by remember { mutableStateOf(false) }
    var showDeleteConfirmation by remember { mutableStateOf(false) }
    var showLeaveConfirmation by remember { mutableStateOf(false) }

    val filePicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        val attachments = uris.mapNotNull { uri ->
            runCatching {
                context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            readAttachment(context, uri)
        }
        if (attachments.isNotEmpty()) viewModel.addAttachments(attachments)
    }

    LaunchedEffect(uiState.message, uiState.error) {
        val message = uiState.message ?: uiState.error
        if (message != null) {
            snackbar.showSnackbar(message)
            viewModel.consumeMessage()
        }
    }
    LaunchedEffect(uiState.success?.id) {
        uiState.success?.let { onSubmitSuccess(it.id) }
    }

    BackHandler(enabled = uiState.isDirty) { showLeaveConfirmation = true }

    if (showLeaveConfirmation) {
        AlertDialog(
            onDismissRequest = { showLeaveConfirmation = false },
            title = { Text("Rời trình soạn bài?") },
            text = { Text("Bạn có thay đổi chưa lưu. Hãy lưu bản nháp trước khi rời màn hình.") },
            confirmButton = {
                Button(onClick = {
                    showLeaveConfirmation = false
                    viewModel.saveDraft(afterSave = onNavigateBack)
                }) { Text("Lưu và rời đi") }
            },
            dismissButton = {
                TextButton(onClick = { showLeaveConfirmation = false; onNavigateBack() }) {
                    Text("Rời mà không lưu")
                }
            }
        )
    }

    if (showDeleteConfirmation) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirmation = false },
            title = { Text("Xóa bản nháp?") },
            text = { Text("Nội dung, liên kết và danh sách tệp trong bản nháp sẽ bị xóa.") },
            confirmButton = {
                Button(onClick = { showDeleteConfirmation = false; viewModel.deleteDraft() }) { Text("Xóa bản nháp") }
            },
            dismissButton = { TextButton(onClick = { showDeleteConfirmation = false }) { Text("Hủy") } }
        )
    }

    if (showSubmitConfirmation) {
        val assignment = uiState.assignment
        if (assignment != null) {
            val isLate = LocalDateTime.now().isAfter(assignment.deadline)
            AlertDialog(
                onDismissRequest = { if (!uiState.isSubmitting) showSubmitConfirmation = false },
                title = { Text("Xác nhận nộp bài") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(assignment.title, fontWeight = FontWeight.Bold)
                        Text("Lớp: ${uiState.classroomName}")
                        Text("Số tệp: ${uiState.attachments.size}")
                        Text(if (isLate) "Trạng thái: Nộp muộn" else "Trạng thái: Đúng hạn")
                        Text("Nếu bài tập không cho phép sửa, bạn sẽ không thể thay đổi sau khi nộp.")
                    }
                },
                confirmButton = {
                    Button(
                        onClick = { viewModel.submit() },
                        enabled = !uiState.isSubmitting && (
                            uiState.content.isNotBlank() ||
                                uiState.linkUrl.isNotBlank() ||
                                uiState.attachments.isNotEmpty()
                            )
                    ) {
                        if (uiState.isSubmitting) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                        else Text("Xác nhận nộp bài")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showSubmitConfirmation = false }, enabled = !uiState.isSubmitting) {
                        Text("Kiểm tra lại")
                    }
                }
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (uiState.draftId == null) "Soạn bài nộp" else "Tiếp tục bản nháp") },
                navigationIcon = {
                    IconButton(onClick = {
                        if (uiState.isDirty) showLeaveConfirmation = true else onNavigateBack()
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.assignment == null -> ErrorScreen(
                uiState.error ?: "Không thể mở trình soạn bài.",
                onRetry = viewModel::load,
                modifier = Modifier.padding(padding)
            )
            else -> {
                val assignment = uiState.assignment ?: return@Scaffold
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding).imePadding(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    item {
                        Card(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                                Text(assignment.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                Text(uiState.classroomName)
                                Text("Hạn: ${assignment.deadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))}")
                                Text("Định dạng: ${assignment.allowedFileTypes.joinToString(", ").uppercase()}")
                            }
                        }
                    }
                    item {
                        OutlinedTextField(
                            value = uiState.content,
                            onValueChange = viewModel::onContentChange,
                            label = { Text("Nội dung bài làm") },
                            placeholder = { Text("Mô tả bài làm, quyết định thiết kế hoặc ghi chú cho giảng viên...") },
                            minLines = 5,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    item {
                        OutlinedTextField(
                            value = uiState.linkUrl,
                            onValueChange = viewModel::onLinkChange,
                            label = { Text("Liên kết bài làm (không bắt buộc)") },
                            placeholder = { Text("https://github.com/...") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    item {
                        OutlinedButton(
                            onClick = { filePicker.launch(arrayOf("*/*")) },
                            enabled = !uiState.isSubmitting && uiState.attachments.size < 5,
                            modifier = Modifier.fillMaxWidth().height(50.dp)
                        ) {
                            Icon(Icons.Default.AttachFile, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Chọn tệp (${uiState.attachments.size}/5)")
                        }
                    }
                    if (uiState.attachments.isNotEmpty()) {
                        items(uiState.attachments, key = { it.id }) { attachment ->
                            AttachmentRow(
                                attachment = attachment,
                                onOpen = {
                                    openSelectedAttachment(context, attachment.uri)?.let {
                                        scope.launch { snackbar.showSnackbar(it) }
                                    }
                                },
                                onRemove = { viewModel.removeAttachment(attachment.id) }
                            )
                        }
                    }
                    item {
                        val savedText = uiState.lastSavedAt?.format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(
                                when {
                                    uiState.isSaving -> "Đang lưu..."
                                    savedText != null -> "Đã lưu lúc $savedText"
                                    else -> "Chưa lưu bản nháp"
                                },
                                style = MaterialTheme.typography.labelMedium
                            )
                            if (uiState.draftId != null) {
                                TextButton(onClick = { showDeleteConfirmation = true }, enabled = !uiState.isDeleting) {
                                    Icon(Icons.Default.Delete, contentDescription = null)
                                    Text("Xóa nháp")
                                }
                            }
                        }
                    }
                    item {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedButton(
                                onClick = { viewModel.saveDraft() },
                                enabled = !uiState.isSaving && !uiState.isSubmitting,
                                modifier = Modifier.weight(1f).height(52.dp)
                            ) {
                                Icon(Icons.Default.Save, contentDescription = null)
                                Spacer(Modifier.width(6.dp))
                                Text("Lưu nháp")
                            }
                            Button(
                                onClick = { showSubmitConfirmation = true },
                                enabled = !uiState.isSaving && !uiState.isSubmitting,
                                modifier = Modifier.weight(1f).height(52.dp)
                            ) {
                                Icon(Icons.Default.Send, contentDescription = null)
                                Spacer(Modifier.width(6.dp))
                                Text("Nộp bài")
                            }
                        }
                    }
                    item {
                        CatMascot(
                            state = when {
                                uiState.success != null -> CatMascotState.Success
                                uiState.error != null -> CatMascotState.Worried
                                else -> CatMascotState.Listening
                            },
                            style = CatMascotStyle.Default.copy(size = 72.dp, showSpeechBubble = false)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AttachmentRow(
    attachment: SubmissionAttachment,
    onOpen: () -> Unit,
    onRemove: () -> Unit
) {
    Card(Modifier.fillMaxWidth()) {
        Row(
            Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Icon(Icons.Default.Description, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Column(Modifier.weight(1f)) {
                Text(attachment.displayName, fontWeight = FontWeight.SemiBold, maxLines = 1)
                Text(
                    listOfNotNull(
                        attachment.mimeType,
                        attachment.sizeBytes?.let(::formatBytes)
                    ).joinToString(" • "),
                    style = MaterialTheme.typography.labelSmall
                )
            }
            IconButton(onClick = onOpen) { Icon(Icons.Default.OpenInNew, contentDescription = "Mở ${attachment.displayName}") }
            IconButton(onClick = onRemove) { Icon(Icons.Default.Delete, contentDescription = "Xóa ${attachment.displayName}") }
        }
    }
}

private fun readAttachment(context: android.content.Context, uri: Uri): SubmissionAttachment? {
    var name = uri.lastPathSegment ?: "Tệp bài làm"
    var size: Long? = null
    runCatching {
        context.contentResolver.query(
            uri,
            arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE),
            null,
            null,
            null
        )?.use { cursor ->
            if (cursor.moveToFirst()) {
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                if (nameIndex >= 0) name = cursor.getString(nameIndex) ?: name
                if (sizeIndex >= 0 && !cursor.isNull(sizeIndex)) size = cursor.getLong(sizeIndex)
            }
        }
    }
    return SubmissionAttachment(
        id = UUID.randomUUID().toString(),
        uri = uri.toString(),
        displayName = name,
        mimeType = context.contentResolver.getType(uri) ?: "application/octet-stream",
        sizeBytes = size
    )
}

private fun openSelectedAttachment(context: android.content.Context, rawUri: String): String? {
    val uri = runCatching { Uri.parse(rawUri) }.getOrNull() ?: return "Tệp không tồn tại hoặc liên kết không hợp lệ."
    val intent = Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    if (intent.resolveActivity(context.packageManager) == null) return "Không có ứng dụng phù hợp để mở tệp."
    return runCatching { context.startActivity(intent) }.exceptionOrNull()?.let { "Không thể mở tệp này." }
}

private fun formatBytes(size: Long): String = when {
    size >= 1024 * 1024 -> "%.1f MB".format(size / (1024f * 1024f))
    size >= 1024 -> "%.1f KB".format(size / 1024f)
    else -> "$size B"
}
