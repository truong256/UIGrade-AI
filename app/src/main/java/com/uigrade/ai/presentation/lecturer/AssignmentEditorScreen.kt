/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.presentation.lecturer

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.saveable.Saver
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.AssignmentPublishStatus
import com.uigrade.ai.ui.components.LoadingScreen
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit

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

    var title by rememberSaveable { mutableStateOf("") }
    var description by rememberSaveable { mutableStateOf("") }
    var instructions by rememberSaveable { mutableStateOf("") }
    var resourceUrl by rememberSaveable { mutableStateOf("") }
    var attachmentUri by rememberSaveable { mutableStateOf("") }
    var assignmentType by rememberSaveable { mutableStateOf("Bài tập") }
    var totalMaxScore by rememberSaveable { mutableStateOf("100") }
    var selectedRubricId by rememberSaveable { mutableStateOf("") }
    var selectedClassroomId by rememberSaveable(classroomId) { mutableStateOf(classroomId) }
    var allowLateSubmission by rememberSaveable { mutableStateOf(false) }
    var latePenaltyPercent by rememberSaveable { mutableStateOf("0") }
    var allowResubmission by rememberSaveable { mutableStateOf(false) }
    var maxAttempts by rememberSaveable { mutableStateOf("1") }
    var selectedFileTypes by rememberSaveable(
        stateSaver = Saver(
            save = { it.joinToString(",") },
            restore = { saved -> saved.split(",").filter(String::isNotBlank).toSet() }
        )
    ) { mutableStateOf(setOf("apk", "aab", "zip")) }

    // Deadlines
    var deadlineDays by rememberSaveable { mutableStateOf("14") }
    var closeAfterDays by rememberSaveable { mutableStateOf("7") }

    var rubricDropdownExpanded by remember { mutableStateOf(false) }
    var classroomDropdownExpanded by remember { mutableStateOf(false) }

    var titleError by remember { mutableStateOf(false) }
    var descriptionError by remember { mutableStateOf(false) }

    val snackbarHostState = remember { SnackbarHostState() }
    val attachmentLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) attachmentUri = uri.toString()
    }

    LaunchedEffect(assignmentId) {
        if (isEditMode) {
            assignmentId?.let(viewModel::loadForEdit)
        } else {
            viewModel.loadForCreate()
        }
    }

    // Populate existing values when in edit mode
    LaunchedEffect(uiState.existingAssignment) {
        uiState.existingAssignment?.let { assign ->
            title = assign.title
            description = assign.description
            instructions = assign.instructions
            resourceUrl = assign.resourceUrl
            attachmentUri = assign.attachmentUri.orEmpty()
            assignmentType = assign.assignmentType
            totalMaxScore = assign.totalMaxScore.toString()
            selectedRubricId = assign.rubricId
            selectedClassroomId = assign.classroomId
            allowLateSubmission = assign.allowLateSubmission
            latePenaltyPercent = assign.latePenaltyPercent.toString()
            allowResubmission = assign.allowResubmission
            maxAttempts = assign.maxAttempts.toString()
            selectedFileTypes = assign.allowedFileTypes.toSet()
            deadlineDays = ChronoUnit.DAYS.between(LocalDateTime.now(), assign.deadline)
                .coerceAtLeast(1)
                .toString()
            closeAfterDays = assign.closeAt?.let {
                ChronoUnit.DAYS.between(assign.deadline, it).coerceAtLeast(0).toString()
            } ?: "7"
        }
    }

    // Default rubric selection when loaded
    LaunchedEffect(uiState.rubrics) {
        if (selectedRubricId.isBlank() && uiState.rubrics.isNotEmpty()) {
            selectedRubricId = uiState.rubrics.first().id
        }
    }

    LaunchedEffect(uiState.classrooms) {
        if (selectedClassroomId.isBlank() && uiState.classrooms.isNotEmpty()) {
            selectedClassroomId = uiState.classrooms.first().id
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
                    val selectedClassroom = uiState.classrooms.find { it.id == selectedClassroomId }
                    ExposedDropdownMenuBox(
                        expanded = classroomDropdownExpanded,
                        onExpandedChange = {
                            if (!uiState.hasSubmissions) classroomDropdownExpanded = !classroomDropdownExpanded
                        }
                    ) {
                        OutlinedTextField(
                            value = selectedClassroom?.name ?: "Chọn lớp học",
                            onValueChange = { value ->
                                uiState.classrooms.find { it.name == value }?.let { selectedClassroomId = it.id }
                            },
                            readOnly = true,
                            label = { Text("Lớp được giao *") },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = classroomDropdownExpanded)
                            },
                            enabled = !uiState.hasSubmissions,
                            modifier = Modifier.fillMaxWidth().menuAnchor(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = classroomDropdownExpanded,
                            onDismissRequest = { classroomDropdownExpanded = false }
                        ) {
                            uiState.classrooms.forEach { classroom ->
                                DropdownMenuItem(
                                    text = {
                                        Column {
                                            Text(classroom.name, fontWeight = FontWeight.SemiBold)
                                            Text(
                                                "${classroom.courseCode} · ${classroom.semester}",
                                                style = MaterialTheme.typography.bodySmall
                                            )
                                        }
                                    },
                                    onClick = {
                                        selectedClassroomId = classroom.id
                                        classroomDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
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
                        value = instructions,
                        onValueChange = { instructions = it },
                        label = { Text("Hướng dẫn thực hiện") },
                        placeholder = { Text("Các bước thực hiện, yêu cầu nộp bài và lưu ý...") },
                        minLines = 3,
                        maxLines = 6,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedTextField(
                            value = assignmentType,
                            onValueChange = { assignmentType = it },
                            label = { Text("Loại bài tập") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = resourceUrl,
                            onValueChange = { resourceUrl = it },
                            label = { Text("Liên kết tài liệu") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }
                }

                item {
                    OutlinedCard(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Tệp đính kèm", fontWeight = FontWeight.SemiBold)
                            if (attachmentUri.isBlank()) {
                                Text("Chưa chọn tệp", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            } else {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.AttachFile, contentDescription = null)
                                    Text(attachmentUri.substringAfterLast('/'), modifier = Modifier.weight(1f), maxLines = 1)
                                    IconButton(onClick = { attachmentUri = "" }) {
                                        Icon(Icons.Default.Clear, contentDescription = "Bỏ tệp đính kèm")
                                    }
                                }
                            }
                            OutlinedButton(onClick = { attachmentLauncher.launch("*/*") }) {
                                Icon(Icons.Default.UploadFile, contentDescription = null)
                                Spacer(Modifier.width(8.dp))
                                Text(if (attachmentUri.isBlank()) "Chọn tệp" else "Đổi tệp")
                            }
                        }
                    }
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
                            onValueChange = { value ->
                                uiState.rubrics.find { it.title == value }?.let { selectedRubricId = it.id }
                            },
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

                item {
                    OutlinedTextField(
                        value = closeAfterDays,
                        onValueChange = { closeAfterDays = it.filter(Char::isDigit) },
                        label = { Text("Đóng bài sau hạn nộp (số ngày)") },
                        supportingText = { Text("Nhập 0 để đóng ngay khi hết hạn") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
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

                            if (allowLateSubmission) {
                                OutlinedTextField(
                                    value = latePenaltyPercent,
                                    onValueChange = {
                                        latePenaltyPercent = it.filter(Char::isDigit).take(3)
                                    },
                                    label = { Text("Mức phạt nộp muộn (%)") },
                                    supportingText = { Text("Từ 0 đến 100%") },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
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
                    val daysInt = (deadlineDays.toIntOrNull() ?: 14).coerceAtLeast(1)
                    val deadline = LocalDateTime.now().plusDays(daysInt.toLong())
                    val closeAt = deadline.plusDays((closeAfterDays.toLongOrNull() ?: 7L).coerceAtLeast(0L))
                    val scoreInt = totalMaxScore.toIntOrNull() ?: 100
                    val attemptsInt = maxAttempts.toIntOrNull() ?: 1
                    val penaltyInt = (latePenaltyPercent.toIntOrNull() ?: 0).coerceIn(0, 100)
                    val selectedClassroom = uiState.classrooms.find { it.id == selectedClassroomId }

                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        // Publish button
                        Button(
                            onClick = {
                                if (title.isBlank()) { titleError = true; return@Button }
                                if (description.isBlank()) { descriptionError = true; return@Button }
                                viewModel.save(
                                    classroomId = selectedClassroomId,
                                    title = title,
                                    description = description,
                                    deadline = deadline,
                                    startAt = LocalDateTime.now(),
                                    rubricId = selectedRubricId,
                                    courseId = selectedClassroom?.courseCode.orEmpty(),
                                    courseName = selectedClassroom
                                        ?.let { it.courseName.ifBlank { it.name } }
                                        .orEmpty(),
                                    totalMaxScore = scoreInt,
                                    allowLateSubmission = allowLateSubmission,
                                    allowResubmission = allowResubmission,
                                    maxAttempts = attemptsInt,
                                    allowedFileTypes = selectedFileTypes.toList(),
                                    publish = true,
                                    instructions = instructions,
                                    closeAt = closeAt,
                                    assignmentType = assignmentType,
                                    attachmentUri = attachmentUri.ifBlank { null },
                                    resourceUrl = resourceUrl,
                                    latePenaltyPercent = penaltyInt
                                )
                            },
                            enabled = !uiState.isLoading && selectedClassroomId.isNotBlank() && selectedRubricId.isNotBlank(),
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
                                    classroomId = selectedClassroomId,
                                    title = title,
                                    description = description,
                                    deadline = deadline,
                                    startAt = LocalDateTime.now(),
                                    rubricId = selectedRubricId,
                                    courseId = selectedClassroom?.courseCode.orEmpty(),
                                    courseName = selectedClassroom
                                        ?.let { it.courseName.ifBlank { it.name } }
                                        .orEmpty(),
                                    totalMaxScore = scoreInt,
                                    allowLateSubmission = allowLateSubmission,
                                    allowResubmission = allowResubmission,
                                    maxAttempts = attemptsInt,
                                    allowedFileTypes = selectedFileTypes.toList(),
                                    publish = false,
                                    instructions = instructions,
                                    closeAt = closeAt,
                                    assignmentType = assignmentType,
                                    attachmentUri = attachmentUri.ifBlank { null },
                                    resourceUrl = resourceUrl,
                                    latePenaltyPercent = penaltyInt
                                )
                            },
                            enabled = !uiState.isLoading && selectedClassroomId.isNotBlank() && selectedRubricId.isNotBlank(),
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
