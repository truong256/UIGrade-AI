package com.uigrade.ai.presentation.lecturer

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.uigrade.ai.domain.model.AssignmentPublishStatus
import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.ui.components.LoadingScreen
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateEditAssignmentScreen(
    classroomId: String,
    assignmentId: String? = null,
    onNavigateBack: () -> Unit,
    onSaved: () -> Unit,
    viewModel: AssignmentEditorViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val isEditMode = assignmentId != null

    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var totalMaxScore by remember { mutableStateOf("100") }
    var selectedRubricId by remember { mutableStateOf("") }
    var allowLateSubmission by remember { mutableStateOf(false) }
    var allowResubmission by remember { mutableStateOf(false) }
    var maxAttempts by remember { mutableStateOf("1") }
    var selectedFileTypes by remember { mutableStateOf(setOf("apk", "aab", "zip")) }

    // Deadlines
    var deadlineDays by remember { mutableStateOf("14") } // Default 14 days from now

    var rubricDropdownExpanded by remember { mutableStateOf(false) }

    var titleError by remember { mutableStateOf(false) }
    var descriptionError by remember { mutableStateOf(false) }

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(assignmentId) {
        if (isEditMode) {
            viewModel.loadForEdit(assignmentId!!)
        } else {
            viewModel.loadForCreate()
        }
    }

    // Populate existing values when in edit mode
    LaunchedEffect(uiState.existingAssignment) {
        uiState.existingAssignment?.let { assign ->
            title = assign.title
            description = assign.description
            totalMaxScore = assign.totalMaxScore.toString()
            selectedRubricId = assign.rubricId
            allowLateSubmission = assign.allowLateSubmission
            allowResubmission = assign.allowResubmission
            maxAttempts = assign.maxAttempts.toString()
            selectedFileTypes = assign.allowedFileTypes.toSet()
        }
    }

    // Default rubric selection when loaded
    LaunchedEffect(uiState.rubrics) {
        if (selectedRubricId.isBlank() && uiState.rubrics.isNotEmpty()) {
            selectedRubricId = uiState.rubrics.first().id
        }
    }

    LaunchedEffect(uiState.savedAssignment) {
        if (uiState.savedAssignment != null) {
            onSaved()
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
                title = { Text(if (isEditMode) "Chỉnh sửa bài tập" else "Tạo bài tập mới", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        if (uiState.isLoading && uiState.rubrics.isEmpty()) {
            LoadingScreen(Modifier.padding(padding))
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Notice if submissions exist
                if (isEditMode && uiState.hasSubmissions) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Warning, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    "Đã có sinh viên nộp bài. Một số cài đặt quan trọng không thể thay đổi để tránh ảnh hưởng kết quả.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                            }
                        }
                    }
                }

                item {
                    Text("Thông tin bài tập", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }

                item {
                    OutlinedTextField(
                        value = title,
                        onValueChange = {
                            title = it
                            titleError = it.isBlank()
                        },
                        label = { Text("Tên bài tập *") },
                        placeholder = { Text("Ví dụ: UI Assignment 01 – Basic Layouts") },
                        isError = titleError,
                        supportingText = if (titleError) { { Text("Tên bài tập không được để trống") } } else null,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                item {
                    OutlinedTextField(
                        value = description,
                        onValueChange = {
                            description = it
                            descriptionError = it.isBlank()
                        },
                        label = { Text("Mô tả chi tiết và yêu cầu *") },
                        placeholder = { Text("Mô tả các yêu cầu kỹ thuật, màn hình cần thiết kế, ràng buộc...") },
                        isError = descriptionError,
                        minLines = 4,
                        maxLines = 8,
                        supportingText = if (descriptionError) { { Text("Mô tả không được để trống") } } else null,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                // Rubric Selection
                item {
                    Text("Bộ tiêu chí chấm điểm (Rubric)", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }

                item {
                    val selectedRubric = uiState.rubrics.find { it.id == selectedRubricId }
                    ExposedDropdownMenuBox(
                        expanded = rubricDropdownExpanded,
                        onExpandedChange = { if (!uiState.hasSubmissions) rubricDropdownExpanded = !rubricDropdownExpanded }
                    ) {
                        OutlinedTextField(
                            value = selectedRubric?.title ?: "Chọn bộ tiêu chí",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Rubric") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = rubricDropdownExpanded) },
                            enabled = !uiState.hasSubmissions,
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = rubricDropdownExpanded,
                            onDismissRequest = { rubricDropdownExpanded = false }
                        ) {
                            uiState.rubrics.forEach { rubric ->
                                DropdownMenuItem(
                                    text = {
                                        Column {
                                            Text(rubric.title, fontWeight = FontWeight.SemiBold)
                                            Text("${rubric.criteria.size} tiêu chí", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }
                                    },
                                    onClick = {
                                        selectedRubricId = rubric.id
                                        rubricDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }

                // Max Score & Deadline
                item {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedTextField(
                            value = totalMaxScore,
                            onValueChange = { totalMaxScore = it.filter { ch -> ch.isDigit() } },
                            label = { Text("Điểm tối đa") },
                            modifier = Modifier.weight(1f),
                            enabled = !uiState.hasSubmissions,
                            shape = RoundedCornerShape(12.dp)
                        )

                        OutlinedTextField(
                            value = deadlineDays,
                            onValueChange = { deadlineDays = it.filter { ch -> ch.isDigit() } },
                            label = { Text("Hạn nộp (ngày tới)") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                }

                // File types
                item {
                    Text("Định dạng file cho phép", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("apk", "aab", "zip").forEach { type ->
                            val isSelected = type in selectedFileTypes
                            FilterChip(
                                selected = isSelected,
                                onClick = {
                                    selectedFileTypes = if (isSelected) {
                                        if (selectedFileTypes.size > 1) selectedFileTypes - type else selectedFileTypes
                                    } else {
                                        selectedFileTypes + type
                                    }
                                },
                                label = { Text(type.uppercase()) }
                            )
                        }
                    }
                }

                // Submission Policies
                item {
                    Text("Chính sách nộp bài", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }

                item {
                    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Cho phép nộp muộn")
                                Switch(
                                    checked = allowLateSubmission,
                                    onCheckedChange = { allowLateSubmission = it }
                                )
                            }

                            HorizontalDivider()

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Cho phép nộp lại")
                                Switch(
                                    checked = allowResubmission,
                                    onCheckedChange = { allowResubmission = it }
                                )
                            }

                            if (allowResubmission) {
                                OutlinedTextField(
                                    value = maxAttempts,
                                    onValueChange = { maxAttempts = it.filter { ch -> ch.isDigit() } },
                                    label = { Text("Số lần nộp tối đa") },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                            }
                        }
                    }
                }

                // Action Buttons
                item {
                    Spacer(Modifier.height(8.dp))
                    val daysInt = deadlineDays.toIntOrNull() ?: 14
                    val deadline = LocalDateTime.now().plusDays(daysInt.toLong())
                    val scoreInt = totalMaxScore.toIntOrNull() ?: 100
                    val attemptsInt = maxAttempts.toIntOrNull() ?: 1

                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        // Publish button
                        Button(
                            onClick = {
                                if (title.isBlank()) { titleError = true; return@Button }
                                if (description.isBlank()) { descriptionError = true; return@Button }
                                viewModel.save(
                                    classroomId = classroomId,
                                    title = title,
                                    description = description,
                                    deadline = deadline,
                                    startAt = LocalDateTime.now(),
                                    rubricId = selectedRubricId,
                                    courseId = "CS401",
                                    courseName = "Android UI Development",
                                    totalMaxScore = scoreInt,
                                    allowLateSubmission = allowLateSubmission,
                                    allowResubmission = allowResubmission,
                                    maxAttempts = attemptsInt,
                                    allowedFileTypes = selectedFileTypes.toList(),
                                    publish = true
                                )
                            },
                            enabled = !uiState.isLoading,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.Publish, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Xuất bản bài tập", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }

                        // Save draft button
                        OutlinedButton(
                            onClick = {
                                if (title.isBlank()) { titleError = true; return@OutlinedButton }
                                if (description.isBlank()) { descriptionError = true; return@OutlinedButton }
                                viewModel.save(
                                    classroomId = classroomId,
                                    title = title,
                                    description = description,
                                    deadline = deadline,
                                    startAt = LocalDateTime.now(),
                                    rubricId = selectedRubricId,
                                    courseId = "CS401",
                                    courseName = "Android UI Development",
                                    totalMaxScore = scoreInt,
                                    allowLateSubmission = allowLateSubmission,
                                    allowResubmission = allowResubmission,
                                    maxAttempts = attemptsInt,
                                    allowedFileTypes = selectedFileTypes.toList(),
                                    publish = false
                                )
                            },
                            enabled = !uiState.isLoading,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.Save, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Lưu bản nháp", fontWeight = FontWeight.SemiBold)
                        }

                        // Close assignment button if editing
                        if (isEditMode && uiState.existingAssignment?.publishStatus != AssignmentPublishStatus.CLOSED) {
                            OutlinedButton(
                                onClick = {
                                    assignmentId?.let { viewModel.closeAssignment(it) }
                                },
                                enabled = !uiState.isLoading,
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.Lock, contentDescription = null)
                                Spacer(Modifier.width(8.dp))
                                Text("Đóng bài tập (không nhận thêm bài nộp)", fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }
        }
    }
}
