package com.uigrade.ai.presentation.student

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.ui.theme.Primary
import com.uigrade.ai.ui.theme.Success

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubmitAssignmentScreen(
    assignmentId: String,
    onNavigateBack: () -> Unit,
    onSubmitSuccess: (submissionId: String) -> Unit,
    viewModel: SubmitAssignmentViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(uiState.success) {
        uiState.success?.let { onSubmitSuccess(it.id) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Nộp bài tập") },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Back") } }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Upload area
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Primary.copy(0.05f))
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(Icons.Default.CloudUpload, contentDescription = "Upload", modifier = Modifier.size(48.dp), tint = Primary)
                    Text("Chọn file bài tập", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    Text("Hỗ trợ: APK, AAB, ZIP", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

                    if (uiState.selectedFileName != null) {
                        Surface(color = Success.copy(0.1f), shape = MaterialTheme.shapes.small) {
                            Row(modifier = Modifier.padding(8.dp, 4.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Success, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(6.dp))
                                Text(uiState.selectedFileName!!, style = MaterialTheme.typography.bodySmall, color = Success)
                            }
                        }
                    }

                    // Mock file picker — in real app, use ActivityResultContracts.GetContent
                    OutlinedButton(
                        onClick = { viewModel.onFileSelected("MyAndroidApp_v1.apk") }
                    ) {
                        Icon(Icons.Default.FolderOpen, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Chọn file")
                    }
                }
            }

            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Lưu ý", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                    listOf(
                        "File APK/AAB sẽ được phân tích tự động",
                        "Kết quả chấm điểm dựa trên metric và rule có thể kiểm tra",
                        "AI chỉ tạo phản hồi bằng văn bản, không quyết định điểm"
                    ).forEach { note ->
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("•", color = Primary)
                            Text(note, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }

            uiState.error?.let { error ->
                Text(error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }

            Spacer(Modifier.weight(1f))

            Button(
                onClick = { viewModel.submit(assignmentId) },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                enabled = !uiState.isSubmitting,
                shape = MaterialTheme.shapes.medium
            ) {
                if (uiState.isSubmitting) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                    Spacer(Modifier.width(8.dp))
                    Text("Đang nộp bài...")
                } else {
                    Icon(Icons.Default.Send, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Xác nhận nộp bài", fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}
