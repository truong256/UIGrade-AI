package com.uigrade.ai.presentation.lecturer

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.AssignmentPublishStatus
import com.uigrade.ai.domain.model.Classroom
import com.uigrade.ai.domain.model.ClassroomStatus
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import com.uigrade.ai.ui.theme.Primary
import com.uigrade.ai.ui.theme.Success
import com.uigrade.ai.ui.theme.Warning
import java.time.format.DateTimeFormatter

// ═══════════════════════════════════════════════════════════════════════════════
// 1. LECTURER CLASSROOM LIST SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LecturerClassroomListScreen(
    onNavigateBack: () -> Unit,
    onNavigateToCreateClassroom: () -> Unit,
    onNavigateToClassroomDetail: (classroomId: String) -> Unit,
    viewModel: LecturerClassroomListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Lớp học của tôi", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNavigateToCreateClassroom,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Tạo lớp học") },
                containerColor = MaterialTheme.colorScheme.primary
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(
                message = uiState.error!!,
                onRetry = { viewModel.load() },
                modifier = Modifier.padding(padding)
            )
            else -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                ) {
                    // Search Bar
                    OutlinedTextField(
                        value = uiState.searchQuery,
                        onValueChange = { viewModel.onSearchChange(it) },
                        placeholder = { Text("Tìm kiếm lớp học hoặc mã học phần...") },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                        trailingIcon = {
                            if (uiState.searchQuery.isNotBlank()) {
                                IconButton(onClick = { viewModel.onSearchChange("") }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Xóa")
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true
                    )

                    // Filter Chips
                    LazyRow(
                        modifier = Modifier.fillMaxWidth(),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        item {
                            FilterChip(
                                selected = uiState.filterStatus == null,
                                onClick = { viewModel.onFilterChange(null) },
                                label = { Text("Tất cả (${uiState.classrooms.size})") }
                            )
                        }
                        item {
                            FilterChip(
                                selected = uiState.filterStatus == ClassroomStatus.ACTIVE,
                                onClick = { viewModel.onFilterChange(ClassroomStatus.ACTIVE) },
                                label = { Text("Đang hoạt động") }
                            )
                        }
                        item {
                            FilterChip(
                                selected = uiState.filterStatus == ClassroomStatus.ARCHIVED,
                                onClick = { viewModel.onFilterChange(ClassroomStatus.ARCHIVED) },
                                label = { Text("Đã lưu trữ") }
                            )
                        }
                    }

                    Spacer(Modifier.height(8.dp))

                    if (uiState.filtered.isEmpty()) {
                        EmptyScreen(
                            message = if (uiState.searchQuery.isNotBlank()) "Không tìm thấy lớp học phù hợp" else "Bạn chưa tạo lớp học nào",
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 88.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(uiState.filtered, key = { it.id }) { classroom ->
                                LecturerClassroomCard(
                                    classroom = classroom,
                                    onClick = { onNavigateToClassroomDetail(classroom.id) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LecturerClassroomCard(
    classroom: Classroom,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = classroom.courseCode,
                    style = MaterialTheme.typography.labelMedium,
                    color = Primary,
                    fontWeight = FontWeight.Bold
                )
                Surface(
                    color = if (classroom.status == ClassroomStatus.ACTIVE) Success.copy(alpha = 0.15f) else Color.Gray.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = if (classroom.status == ClassroomStatus.ACTIVE) "Đang hoạt động" else "Đã lưu trữ",
                        color = if (classroom.status == ClassroomStatus.ACTIVE) Success else Color.Gray,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Text(
                text = classroom.name,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            if (classroom.description.isNotBlank()) {
                Text(
                    text = classroom.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2
                )
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Default.DateRange, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(classroom.semester, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }

                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(Icons.Default.Key, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onPrimaryContainer)
                        Text(
                            text = classroom.joinCode,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CREATE CLASSROOM SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateClassroomScreen(
    onNavigateBack: () -> Unit,
    onClassroomCreated: (classroomId: String) -> Unit,
    viewModel: CreateClassroomViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    var name by remember { mutableStateOf("") }
    var courseCode by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var semester by remember { mutableStateOf("HK1 2026-2027") }

    var nameError by remember { mutableStateOf(false) }
    var courseCodeError by remember { mutableStateOf(false) }

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.success) {
        uiState.success?.let { classroom ->
            onClassroomCreated(classroom.id)
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
                title = { Text("Tạo lớp học", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    "Thông tin lớp học",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "Điền các thông tin cơ bản để tạo lớp học mới. Hệ thống sẽ tự động tạo mã tham gia lớp.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            item {
                OutlinedTextField(
                    value = name,
                    onValueChange = {
                        name = it
                        nameError = it.isBlank()
                    },
                    label = { Text("Tên lớp học *") },
                    placeholder = { Text("Ví dụ: Android UI Development - Nhóm 01") },
                    isError = nameError,
                    supportingText = if (nameError) { { Text("Tên lớp không được để trống") } } else null,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
            }

            item {
                OutlinedTextField(
                    value = courseCode,
                    onValueChange = {
                        courseCode = it.uppercase()
                        courseCodeError = it.isBlank()
                    },
                    label = { Text("Mã học phần *") },
                    placeholder = { Text("Ví dụ: CS401") },
                    isError = courseCodeError,
                    supportingText = if (courseCodeError) { { Text("Mã học phần không được để trống") } } else null,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
            }

            item {
                OutlinedTextField(
                    value = semester,
                    onValueChange = { semester = it },
                    label = { Text("Học kỳ *") },
                    placeholder = { Text("Ví dụ: HK1 2026-2027") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
            }

            item {
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Mô tả lớp học") },
                    placeholder = { Text("Mục tiêu học phần, yêu cầu và nội dung chính...") },
                    minLines = 3,
                    maxLines = 5,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
            }

            item {
                Spacer(Modifier.height(8.dp))
                Button(
                    onClick = {
                        val isNameValid = name.isNotBlank()
                        val isCodeValid = courseCode.isNotBlank()
                        nameError = !isNameValid
                        courseCodeError = !isCodeValid
                        if (isNameValid && isCodeValid) {
                            viewModel.create(name, courseCode, description, semester)
                        }
                    },
                    enabled = !uiState.isLoading,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(Icons.Default.Add, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Tạo lớp học", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CLASSROOM DETAIL SCREEN (LECTURER)
// ═══════════════════════════════════════════════════════════════════════════════
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClassroomDetailScreen(
    classroomId: String,
    onNavigateBack: () -> Unit,
    onNavigateToCreateAssignment: (classroomId: String) -> Unit,
    onNavigateToEditAssignment: (assignmentId: String) -> Unit,
    onNavigateToStudents: (classroomId: String) -> Unit,
    onNavigateToSubmissions: (assignmentId: String) -> Unit,
    viewModel: ClassroomDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    var showRegenDialog by remember { mutableStateOf(false) }
    var showArchiveDialog by remember { mutableStateOf(false) }

    LaunchedEffect(classroomId) {
        viewModel.load(classroomId)
    }

    LaunchedEffect(uiState.snackbarMessage) {
        uiState.snackbarMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearSnackbar()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(uiState.classroom?.courseCode ?: "Chi tiết lớp học", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    if (uiState.classroom?.status == ClassroomStatus.ACTIVE) {
                        IconButton(onClick = { showArchiveDialog = true }) {
                            Icon(Icons.Default.Archive, contentDescription = "Lưu trữ lớp")
                        }
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            if (uiState.classroom != null && uiState.classroom?.status == ClassroomStatus.ACTIVE) {
                ExtendedFloatingActionButton(
                    onClick = { onNavigateToCreateAssignment(classroomId) },
                    icon = { Icon(Icons.Default.Add, contentDescription = null) },
                    text = { Text("Tạo bài tập") },
                    containerColor = MaterialTheme.colorScheme.primary
                )
            }
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(
                message = uiState.error!!,
                onRetry = { viewModel.load(classroomId) },
                modifier = Modifier.padding(padding)
            )
            uiState.classroom == null -> EmptyScreen("Không tìm thấy lớp học", Modifier.padding(padding))
            else -> {
                val classroom = uiState.classroom!!
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 88.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Header Info Card
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f))
                        ) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(classroom.name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                    Text("Mã HP: ${classroom.courseCode}", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                                    Text("Học kỳ: ${classroom.semester}", style = MaterialTheme.typography.bodyMedium)
                                }
                                Text("Giảng viên: ${classroom.lecturerName}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                if (classroom.description.isNotBlank()) {
                                    Text(classroom.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }

                    // Join Code Banner
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text("Mã tham gia lớp", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(
                                    text = classroom.joinCode,
                                    style = MaterialTheme.typography.headlineMedium,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontFamily = FontFamily.Monospace,
                                    letterSpacing = 4.sp,
                                    color = Primary
                                )
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceEvenly
                                ) {
                                    TextButton(onClick = {
                                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                        val clip = ClipData.newPlainText("Mã tham gia lớp", classroom.joinCode)
                                        clipboard.setPrimaryClip(clip)
                                        Toast.makeText(context, "Đã sao chép mã: ${classroom.joinCode}", Toast.LENGTH_SHORT).show()
                                    }) {
                                        Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(Modifier.width(4.dp))
                                        Text("Sao chép mã")
                                    }

                                    TextButton(onClick = {
                                        val sendIntent = Intent().apply {
                                            action = Intent.ACTION_SEND
                                            putExtra(Intent.EXTRA_TEXT, "Tham gia lớp ${classroom.name} (${classroom.courseCode}) trên UIGrade AI với mã: ${classroom.joinCode}")
                                            type = "text/plain"
                                        }
                                        context.startActivity(Intent.createChooser(sendIntent, "Chia sẻ mã tham gia"))
                                    }) {
                                        Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(Modifier.width(4.dp))
                                        Text("Chia sẻ mã")
                                    }

                                    TextButton(onClick = { showRegenDialog = true }) {
                                        Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(Modifier.width(4.dp))
                                        Text("Tạo mã mới")
                                    }
                                }
                            }
                        }
                    }

                    // Quick Actions / Students Count
                    item {
                        Card(
                            onClick = { onNavigateToStudents(classroomId) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Icon(Icons.Default.People, contentDescription = null, tint = Primary)
                                    Column {
                                        Text("Danh sách sinh viên", fontWeight = FontWeight.SemiBold)
                                        Text("${uiState.studentCount} sinh viên đã tham gia", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                                Icon(Icons.Default.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }

                    // Assignments section
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Danh sách bài tập (${uiState.assignments.size})", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        }
                    }

                    if (uiState.assignments.isEmpty()) {
                        item {
                            EmptyScreen(
                                message = "Lớp học chưa có bài tập nào",
                                modifier = Modifier.height(180.dp)
                            )
                        }
                    } else {
                        items(uiState.assignments, key = { it.id }) { assignment ->
                            LecturerAssignmentCard(
                                assignment = assignment,
                                onCardClick = { onNavigateToSubmissions(assignment.id) },
                                onEditClick = { onNavigateToEditAssignment(assignment.id) }
                            )
                        }
                    }
                }
            }
        }
    }

    // Regenerate Code Confirm Dialog
    if (showRegenDialog) {
        AlertDialog(
            onDismissRequest = { showRegenDialog = false },
            title = { Text("Tạo mã tham gia mới?") },
            text = { Text("Mã cũ sẽ lập tức không còn hiệu lực. Sinh viên đã tham gia lớp vẫn giữ nguyên tư cách thành viên.") },
            confirmButton = {
                Button(onClick = {
                    showRegenDialog = false
                    viewModel.regenerateJoinCode(classroomId)
                }) {
                    Text("Tạo mã mới")
                }
            },
            dismissButton = {
                TextButton(onClick = { showRegenDialog = false }) { Text("Hủy") }
            }
        )
    }

    // Archive Classroom Confirm Dialog
    if (showArchiveDialog) {
        AlertDialog(
            onDismissRequest = { showArchiveDialog = false },
            title = { Text("Lưu trữ lớp học?") },
            text = { Text("Sau khi lưu trữ, sinh viên mới sẽ không thể tham gia lớp học này nữa. Dữ liệu bài nộp vẫn được giữ nguyên.") },
            confirmButton = {
                Button(
                    onClick = {
                        showArchiveDialog = false
                        viewModel.archiveClassroom(classroomId, onNavigateBack)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Lưu trữ")
                }
            },
            dismissButton = {
                TextButton(onClick = { showArchiveDialog = false }) { Text("Hủy") }
            }
        )
    }
}

@Composable
private fun LecturerAssignmentCard(
    assignment: Assignment,
    onCardClick: () -> Unit,
    onEditClick: () -> Unit
) {
    val fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
    Card(
        onClick = onCardClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(assignment.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                Surface(
                    color = when (assignment.publishStatus) {
                        AssignmentPublishStatus.PUBLISHED -> Success.copy(alpha = 0.15f)
                        AssignmentPublishStatus.DRAFT -> Warning.copy(alpha = 0.15f)
                        AssignmentPublishStatus.CLOSED -> Color.Gray.copy(alpha = 0.15f)
                    },
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = when (assignment.publishStatus) {
                            AssignmentPublishStatus.PUBLISHED -> "Đã xuất bản"
                            AssignmentPublishStatus.DRAFT -> "Bản nháp"
                            AssignmentPublishStatus.CLOSED -> "Đã đóng"
                        },
                        color = when (assignment.publishStatus) {
                            AssignmentPublishStatus.PUBLISHED -> Success
                            AssignmentPublishStatus.DRAFT -> Warning
                            AssignmentPublishStatus.CLOSED -> Color.Gray
                        },
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            Text("Hạn nộp: ${assignment.deadline.format(fmt)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("Điểm tối đa: ${assignment.totalMaxScore}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                TextButton(onClick = onEditClick) {
                    Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Chỉnh sửa")
                }
                TextButton(onClick = onCardClick) {
                    Icon(Icons.Default.List, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Xem bài nộp")
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. CLASSROOM STUDENT LIST SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClassroomStudentListScreen(
    classroomId: String,
    onNavigateBack: () -> Unit,
    viewModel: ClassroomStudentListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(classroomId) {
        viewModel.load(classroomId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Danh sách sinh viên", fontWeight = FontWeight.Bold) },
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
            uiState.error != null -> ErrorScreen(uiState.error!!, onRetry = { viewModel.load(classroomId) }, modifier = Modifier.padding(padding))
            uiState.students.isEmpty() -> EmptyScreen("Lớp học chưa có sinh viên nào", Modifier.padding(padding))
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item {
                        Text(
                            "Tổng số: ${uiState.students.size} sinh viên",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    items(uiState.students, key = { it.id }) { student ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(RoundedCornerShape(22.dp))
                                        .background(Primary.copy(alpha = 0.15f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = student.name.take(1).uppercase(),
                                        fontWeight = FontWeight.Bold,
                                        color = Primary,
                                        fontSize = 18.sp
                                    )
                                }

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(student.name, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
                                    student.studentId?.let {
                                        Text("MSSV: $it", style = MaterialTheme.typography.bodySmall, color = Primary, fontWeight = FontWeight.Medium)
                                    }
                                    Text(student.email, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
