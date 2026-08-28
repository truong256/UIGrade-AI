package com.uigrade.ai.presentation.student

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.GroupAdd
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Sort
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
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
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.model.ClassAnnouncement
import com.uigrade.ai.domain.model.Classroom
import com.uigrade.ai.domain.model.JoinClassResult
import com.uigrade.ai.domain.model.JoinRequestStatus
import com.uigrade.ai.domain.model.LearningMaterial
import com.uigrade.ai.ui.components.AssignmentStatusBadge
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import com.uigrade.ai.ui.components.mascot.CatMascot
import com.uigrade.ai.ui.components.mascot.CatMascotState
import com.uigrade.ai.ui.components.mascot.CatMascotStyle
import java.time.format.DateTimeFormatter
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentClassroomListScreen(
    onNavigateBack: () -> Unit,
    onNavigateToJoinClassroom: () -> Unit,
    onNavigateToJoinRequests: () -> Unit,
    onNavigateToClassroomDetail: (String) -> Unit,
    viewModel: StudentClassroomListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var leaveTarget by remember { mutableStateOf<Classroom?>(null) }
    var sortMenu by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.message, uiState.error) {
        val message = uiState.message ?: uiState.error
        if (message != null && !uiState.isLoading) {
            snackbar.showSnackbar(message)
            viewModel.consumeMessage()
        }
    }

    leaveTarget?.let { classroom ->
        AlertDialog(
            onDismissRequest = { leaveTarget = null },
            title = { Text("Rời lớp học?") },
            text = {
                Text("Bạn sẽ mất quyền truy cập bài tập mới của ${classroom.name}. Lịch sử học tập không bị xóa. Lớp có bài nộp sẽ yêu cầu bạn liên hệ giảng viên.")
            },
            confirmButton = {
                Button(
                    onClick = {
                        leaveTarget = null
                        viewModel.leaveClassroom(classroom.id)
                    },
                    enabled = uiState.leavingClassroomId == null
                ) { Text("Xác nhận rời lớp") }
            },
            dismissButton = { TextButton(onClick = { leaveTarget = null }) { Text("Hủy") } }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Lớp học của tôi", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.load(refresh = true) }, enabled = !uiState.isRefreshing) {
                        Icon(Icons.Default.Refresh, contentDescription = "Làm mới danh sách lớp")
                    }
                    Box {
                        IconButton(onClick = { sortMenu = true }) {
                            Icon(Icons.Default.Sort, contentDescription = "Sắp xếp lớp học")
                        }
                        DropdownMenu(expanded = sortMenu, onDismissRequest = { sortMenu = false }) {
                            DropdownMenuItem(
                                text = { Text("Tên lớp") },
                                onClick = { viewModel.onSortChange(StudentClassSort.NAME); sortMenu = false }
                            )
                            DropdownMenuItem(
                                text = { Text("Tham gia gần đây") },
                                onClick = { viewModel.onSortChange(StudentClassSort.JOINED_RECENTLY); sortMenu = false }
                            )
                        }
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNavigateToJoinClassroom,
                icon = { Icon(Icons.Default.GroupAdd, contentDescription = null) },
                text = { Text("Tham gia lớp") }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null && uiState.classrooms.isEmpty() -> ErrorScreen(
                uiState.error ?: "Không thể tải lớp học.",
                onRetry = { viewModel.load() },
                modifier = Modifier.padding(padding)
            )
            else -> Column(Modifier.fillMaxSize().padding(padding)) {
                OutlinedTextField(
                    value = uiState.searchQuery,
                    onValueChange = viewModel::onSearchChange,
                    placeholder = { Text("Tìm tên lớp, mã môn học, giảng viên...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    trailingIcon = {
                        if (uiState.searchQuery.isNotBlank()) {
                            IconButton(onClick = { viewModel.onSearchChange("") }) {
                                Icon(Icons.Default.Clear, contentDescription = "Xóa nội dung tìm kiếm")
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    singleLine = true
                )
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(StudentClassFilter.entries) { filter ->
                        FilterChip(
                            selected = uiState.filter == filter,
                            onClick = { viewModel.onFilterChange(filter) },
                            label = {
                                Text(
                                    when (filter) {
                                        StudentClassFilter.ALL -> "Tất cả"
                                        StudentClassFilter.ACTIVE -> "Đang học"
                                        StudentClassFilter.ARCHIVED -> "Đã kết thúc"
                                    }
                                )
                            }
                        )
                    }
                    item {
                        AssistChip(
                            onClick = onNavigateToJoinRequests,
                            label = { Text("Yêu cầu (${uiState.requests.size})") },
                            leadingIcon = { Icon(Icons.Default.GroupAdd, contentDescription = null) }
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
                if (uiState.filtered.isEmpty()) {
                    Column(
                        Modifier.fillMaxSize().padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            if (uiState.searchQuery.isBlank()) {
                                "Bạn chưa tham gia lớp học nào.\nNhập mã lớp do giảng viên cung cấp để bắt đầu."
                            } else "Không tìm thấy lớp học phù hợp.",
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(16.dp))
                        Button(onClick = onNavigateToJoinClassroom) { Text("Tham gia lớp học") }
                    }
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 96.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(uiState.filtered, key = { it.id }) { classroom ->
                            StudentClassroomCard(
                                classroom = classroom,
                                assignmentCount = uiState.assignmentCounts[classroom.id] ?: 0,
                                missingCount = uiState.missingCounts[classroom.id] ?: 0,
                                isLeaving = uiState.leavingClassroomId == classroom.id,
                                onClick = { onNavigateToClassroomDetail(classroom.id) },
                                onLeave = { leaveTarget = classroom }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StudentClassroomCard(
    classroom: Classroom,
    assignmentCount: Int,
    missingCount: Int,
    isLeaving: Boolean,
    onClick: () -> Unit,
    onLeave: () -> Unit
) {
    var menuExpanded by remember { mutableStateOf(false) }
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(classroom.courseCode, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                    Text(classroom.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }
                Box {
                    IconButton(onClick = { menuExpanded = true }, enabled = !isLeaving) {
                        if (isLeaving) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                        else Icon(Icons.Default.MoreVert, contentDescription = "Tùy chọn lớp ${classroom.name}")
                    }
                    DropdownMenu(expanded = menuExpanded, onDismissRequest = { menuExpanded = false }) {
                        DropdownMenuItem(
                            text = { Text("Rời lớp") },
                            onClick = { menuExpanded = false; onLeave() },
                            leadingIcon = { Icon(Icons.Default.Cancel, contentDescription = null) }
                        )
                    }
                }
            }
            Text("${classroom.courseName.ifBlank { classroom.courseCode }} • ${classroom.semester}")
            Text("GV: ${classroom.lecturerName}", style = MaterialTheme.typography.bodySmall)
            if (classroom.schedule.isNotBlank()) Text("${classroom.schedule} • ${classroom.room}", style = MaterialTheme.typography.bodySmall)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AssistChip(onClick = onClick, label = { Text("$assignmentCount bài tập") })
                AssistChip(onClick = onClick, label = { Text("$missingCount chưa nộp") })
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JoinClassroomScreen(
    onNavigateBack: () -> Unit,
    onJoined: (String) -> Unit,
    onPending: () -> Unit,
    viewModel: JoinClassroomViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val clipboard = LocalClipboardManager.current
    val snackbar = remember { SnackbarHostState() }
    val mascotState = when {
        uiState.outcome != null -> CatMascotState.Success
        uiState.error != null -> CatMascotState.Worried
        uiState.preview != null -> CatMascotState.Happy
        else -> CatMascotState.Idle
    }

    LaunchedEffect(uiState.error) {
        uiState.error?.let { snackbar.showSnackbar(it); viewModel.clearError() }
    }
    LaunchedEffect(uiState.outcome) {
        when (val outcome = uiState.outcome) {
            is JoinClassResult.Joined -> onJoined(outcome.classroom.id)
            is JoinClassResult.Pending -> onPending()
            null -> Unit
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tham gia lớp học", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).imePadding(),
            contentPadding = PaddingValues(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                CatMascot(
                    state = mascotState,
                    style = CatMascotStyle.Default.copy(size = 96.dp, showSpeechBubble = false)
                )
            }
            item { Text("Nhập mã lớp do giảng viên cung cấp", textAlign = TextAlign.Center) }
            item {
                OutlinedTextField(
                    value = uiState.joinCode,
                    onValueChange = viewModel::onCodeChange,
                    label = { Text("Mã tham gia") },
                    placeholder = { Text("Ví dụ: A7K9PX") },
                    isError = uiState.error != null,
                    singleLine = true,
                    trailingIcon = {
                        IconButton(onClick = {
                            val text = clipboard.getText()?.text.orEmpty()
                            if (text.isBlank()) {
                                viewModel.onCodeChange("")
                            } else viewModel.onCodeChange(text)
                        }) {
                            Icon(Icons.Default.ContentPaste, contentDescription = "Dán mã lớp")
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                )
            }
            val preview = uiState.preview
            if (preview == null) {
                item {
                    Button(
                        onClick = viewModel::preview,
                        enabled = uiState.joinCode.isNotBlank() && !uiState.isChecking,
                        modifier = Modifier.fillMaxWidth().height(52.dp)
                    ) {
                        if (uiState.isChecking) CircularProgressIndicator(Modifier.size(22.dp), strokeWidth = 2.dp)
                        else Text("Kiểm tra mã lớp")
                    }
                }
            } else {
                item { JoinPreviewCard(preview) }
                item {
                    Button(
                        onClick = viewModel::confirmJoin,
                        enabled = !uiState.isSubmitting,
                        modifier = Modifier.fillMaxWidth().height(52.dp)
                    ) {
                        if (uiState.isSubmitting) CircularProgressIndicator(Modifier.size(22.dp), strokeWidth = 2.dp)
                        else Text(if (preview.requiresApproval) "Gửi yêu cầu tham gia" else "Xác nhận tham gia")
                    }
                }
                item {
                    TextButton(onClick = { viewModel.onCodeChange("") }, enabled = !uiState.isSubmitting) {
                        Text("Nhập mã khác")
                    }
                }
            }
        }
    }
}

@Composable
private fun JoinPreviewCard(classroom: Classroom) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(classroom.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("${classroom.courseCode} • ${classroom.courseName.ifBlank { "Môn học" }}")
            Text("Giảng viên: ${classroom.lecturerName}")
            Text("${classroom.semester} • ${classroom.academicYear}")
            if (classroom.schedule.isNotBlank()) Text("${classroom.schedule} • ${classroom.room}")
            Text(
                if (classroom.requiresApproval) "Lớp cần giảng viên duyệt yêu cầu tham gia."
                else "Bạn sẽ được thêm vào lớp ngay sau khi xác nhận.",
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentClassroomDetailScreen(
    classroomId: String,
    onNavigateBack: () -> Unit,
    onNavigateToAssignment: (String) -> Unit,
    viewModel: StudentClassroomDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(classroomId) { viewModel.load(classroomId) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(uiState.classroom?.courseCode ?: "Chi tiết lớp học") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.load(classroomId, refresh = true) }, enabled = !uiState.isRefreshing) {
                        Icon(Icons.Default.Refresh, contentDescription = "Làm mới lớp học")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(
                uiState.error ?: "Không thể tải lớp học.",
                onRetry = { viewModel.load(classroomId) },
                modifier = Modifier.padding(padding)
            )
            uiState.classroom == null -> EmptyScreen("Không tìm thấy lớp học.", Modifier.padding(padding))
            else -> Column(Modifier.fillMaxSize().padding(padding)) {
                TabRow(selectedTabIndex = uiState.selectedTab) {
                    listOf("Tổng quan", "Bài tập", "Thông báo", "Tài liệu").forEachIndexed { index, title ->
                        Tab(
                            selected = uiState.selectedTab == index,
                            onClick = { viewModel.selectTab(index) },
                            text = { Text(title, maxLines = 1) }
                        )
                    }
                }
                when (uiState.selectedTab) {
                    0 -> ClassroomOverview(uiState, onNavigateToAssignment)
                    1 -> ClassroomAssignments(uiState, viewModel, onNavigateToAssignment)
                    2 -> ClassroomAnnouncements(uiState.announcements) { uri ->
                        openUri(context, uri)?.let { message ->
                            scope.launch { snackbar.showSnackbar(message) }
                        }
                    }
                    else -> ClassroomMaterials(uiState.materials) { uri ->
                        openUri(context, uri)?.let { message ->
                            scope.launch { snackbar.showSnackbar(message) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ClassroomOverview(
    uiState: StudentClassroomDetailUiState,
    onNavigateToAssignment: (String) -> Unit
) {
    val classroom = uiState.classroom ?: return
    val submitted = uiState.assignments.count { it.status in setOf(AssignmentStatus.SUBMITTED, AssignmentStatus.LATE, AssignmentStatus.GRADED) }
    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(classroom.name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text("Giảng viên: ${classroom.lecturerName}")
                    Text("Môn học: ${classroom.courseName.ifBlank { classroom.courseCode }}")
                    Text("${classroom.semester} • ${classroom.academicYear}")
                    if (classroom.schedule.isNotBlank()) Text("Lịch: ${classroom.schedule}")
                    if (classroom.room.isNotBlank()) Text("Phòng: ${classroom.room}")
                    if (classroom.description.isNotBlank()) Text(classroom.description, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        item {
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
                Column(Modifier.padding(16.dp)) {
                    Text("Tiến độ trong lớp", fontWeight = FontWeight.Bold)
                    Text("Đã nộp $submitted/${uiState.assignments.size} bài tập")
                    Text("Đã chấm ${uiState.assignments.count { it.status == AssignmentStatus.GRADED }} bài")
                }
            }
        }
        item {
            Text("Bài sắp đến hạn", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
        val upcoming = uiState.assignments.filter { it.status == AssignmentStatus.NOT_SUBMITTED }.take(3)
        if (upcoming.isEmpty()) item { EmptyScreen("Không có bài tập cần ưu tiên.", Modifier.height(120.dp)) }
        else items(upcoming) { item ->
            AssignmentSummaryCard(item) { onNavigateToAssignment(item.assignment.id) }
        }
    }
}

@Composable
private fun ClassroomAssignments(
    uiState: StudentClassroomDetailUiState,
    viewModel: StudentClassroomDetailViewModel,
    onNavigateToAssignment: (String) -> Unit
) {
    Column(Modifier.fillMaxSize()) {
        OutlinedTextField(
            value = uiState.searchQuery,
            onValueChange = viewModel::onSearchChange,
            placeholder = { Text("Tìm bài tập...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            singleLine = true
        )
        LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            item { FilterChip(uiState.filterStatus == null, { viewModel.onFilterChange(null) }, { Text("Tất cả") }) }
            items(listOf(AssignmentStatus.NOT_SUBMITTED, AssignmentStatus.DRAFT, AssignmentStatus.SUBMITTED, AssignmentStatus.GRADED)) { status ->
                FilterChip(
                    selected = uiState.filterStatus == status,
                    onClick = { viewModel.onFilterChange(status) },
                    label = { AssignmentStatusBadge(status) }
                )
            }
        }
        if (uiState.filteredAssignments.isEmpty()) {
            EmptyScreen("Lớp học này chưa có bài tập phù hợp.", Modifier.fillMaxSize())
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(uiState.filteredAssignments, key = { it.assignment.id }) { item ->
                    AssignmentSummaryCard(item) { onNavigateToAssignment(item.assignment.id) }
                }
            }
        }
    }
}

@Composable
private fun AssignmentSummaryCard(item: AssignmentWithStatus, onClick: () -> Unit) {
    val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(item.assignment.title, Modifier.weight(1f), fontWeight = FontWeight.Bold)
                Spacer(Modifier.width(8.dp))
                AssignmentStatusBadge(item.status)
            }
            Text("Hạn nộp: ${item.assignment.deadline.format(formatter)}", style = MaterialTheme.typography.bodySmall)
            item.score?.let { Text("Điểm: $it/${item.assignment.totalMaxScore}", fontWeight = FontWeight.SemiBold) }
        }
    }
}

@Composable
private fun ClassroomAnnouncements(announcements: List<ClassAnnouncement>, onOpen: (String) -> Unit) {
    if (announcements.isEmpty()) {
        EmptyScreen("Chưa có thông báo mới.", Modifier.fillMaxSize())
        return
    }
    val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items(announcements, key = { it.id }) { item ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(item.title, fontWeight = FontWeight.Bold)
                    Text("${item.authorName} • ${item.createdAt.format(formatter)}", style = MaterialTheme.typography.labelSmall)
                    Text(item.content)
                    item.attachmentUri?.let { uri ->
                        TextButton(onClick = { onOpen(uri) }) {
                            Icon(Icons.Default.OpenInNew, contentDescription = null)
                            Spacer(Modifier.width(6.dp))
                            Text("Mở liên kết đính kèm")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ClassroomMaterials(materials: List<LearningMaterial>, onOpen: (String) -> Unit) {
    if (materials.isEmpty()) {
        EmptyScreen("Giảng viên chưa đăng tài liệu nào.", Modifier.fillMaxSize())
        return
    }
    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items(materials, key = { it.id }) { material ->
            Card(onClick = { onOpen(material.uri) }, modifier = Modifier.fillMaxWidth()) {
                Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Icon(
                        if (material.type.contains("link", true)) Icons.Default.Link else Icons.Default.Description,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Column(Modifier.weight(1f)) {
                        Text(material.title, fontWeight = FontWeight.Bold)
                        Text(material.description, style = MaterialTheme.typography.bodySmall)
                        Text(material.type, style = MaterialTheme.typography.labelSmall)
                    }
                    Icon(Icons.Default.OpenInNew, contentDescription = "Mở ${material.title}")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentJoinRequestsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToClassroom: (String) -> Unit,
    viewModel: StudentJoinRequestsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var cancelTarget by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(uiState.message, uiState.error) {
        val message = uiState.message ?: uiState.error
        if (message != null) { snackbar.showSnackbar(message); viewModel.consumeMessage() }
    }
    cancelTarget?.let { requestId ->
        AlertDialog(
            onDismissRequest = { cancelTarget = null },
            title = { Text("Hủy yêu cầu tham gia?") },
            text = { Text("Giảng viên sẽ không còn thấy yêu cầu đang chờ này.") },
            confirmButton = {
                Button(onClick = { cancelTarget = null; viewModel.cancel(requestId) }) { Text("Hủy yêu cầu") }
            },
            dismissButton = { TextButton(onClick = { cancelTarget = null }) { Text("Quay lại") } }
        )
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Yêu cầu tham gia") },
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
            uiState.requests.isEmpty() -> EmptyScreen("Bạn chưa có yêu cầu tham gia lớp nào.", Modifier.padding(padding))
            else -> LazyColumn(
                Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(uiState.requests, key = { it.request.id }) { item ->
                    Card(
                        onClick = {
                            item.classroom?.let { onNavigateToClassroom(it.id) }
                        },
                        enabled = item.request.status == JoinRequestStatus.APPROVED && item.classroom != null,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(item.classroom?.name ?: "Lớp học không còn tồn tại", fontWeight = FontWeight.Bold)
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    when (item.request.status) {
                                        JoinRequestStatus.PENDING -> Icons.Default.Warning
                                        JoinRequestStatus.APPROVED -> Icons.Default.CheckCircle
                                        JoinRequestStatus.REJECTED -> Icons.Default.Cancel
                                    },
                                    contentDescription = null
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    when (item.request.status) {
                                        JoinRequestStatus.PENDING -> "Đang chờ giảng viên duyệt"
                                        JoinRequestStatus.APPROVED -> "Đã được chấp nhận"
                                        JoinRequestStatus.REJECTED -> "Đã bị từ chối"
                                    }
                                )
                            }
                            if (item.request.status == JoinRequestStatus.PENDING) {
                                OutlinedButton(
                                    onClick = { cancelTarget = item.request.id },
                                    enabled = uiState.busyRequestId == null
                                ) { Text("Hủy yêu cầu") }
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun openUri(context: android.content.Context, uriValue: String): String? {
    val uri = runCatching { Uri.parse(uriValue) }.getOrNull()
        ?: return "Liên kết không hợp lệ."
    if (uri.scheme !in setOf("http", "https", "content")) return "Liên kết không hợp lệ."
    val intent = Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    return if (intent.resolveActivity(context.packageManager) != null) {
        runCatching { context.startActivity(intent) }.exceptionOrNull()?.let { "Không thể mở tài liệu này." }
    } else "Không có ứng dụng phù hợp để mở tài liệu."
}
