package com.uigrade.ai.presentation.lecturer

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.AssignmentPublishStatus
import com.uigrade.ai.domain.usecase.*
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.format.DateTimeFormatter
import javax.inject.Inject

data class AssignmentManagementUiState(
    val assignments: List<Assignment> = emptyList(),
    val filtered: List<Assignment> = emptyList(),
    val query: String = "",
    val status: AssignmentPublishStatus? = null,
    val classroomId: String? = null,
    val showArchived: Boolean = false,
    val isLoading: Boolean = true,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val message: String? = null
)

@HiltViewModel
class AssignmentManagementViewModel @Inject constructor(
    private val getCurrentUserUseCase: GetCurrentUserUseCase,
    private val getAssignmentsForLecturerUseCase: GetAssignmentsForLecturerUseCase,
    private val duplicateAssignmentUseCase: DuplicateAssignmentUseCase,
    private val archiveAssignmentUseCase: ArchiveAssignmentUseCase,
    private val deleteAssignmentUseCase: DeleteAssignmentUseCase,
    private val publishAssignmentUseCase: PublishAssignmentUseCase,
    private val closeAssignmentUseCase: CloseAssignmentUseCase,
    private val reopenAssignmentUseCase: ReopenAssignmentUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(AssignmentManagementUiState())
    val uiState: StateFlow<AssignmentManagementUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            runCatching {
                val user = getCurrentUserUseCase() ?: error("Bạn chưa đăng nhập")
                getAssignmentsForLecturerUseCase(user.id)
            }.fold(
                onSuccess = { assignments ->
                    _uiState.value = _uiState.value.copy(
                        assignments = assignments,
                        filtered = filter(assignments, _uiState.value),
                        isLoading = false
                    )
                },
                onFailure = { _uiState.value = _uiState.value.copy(isLoading = false, error = messageOf(it)) }
            )
        }
    }

    fun setQuery(query: String) {
        val next = _uiState.value.copy(query = query)
        _uiState.value = next.copy(filtered = filter(next.assignments, next))
    }

    fun setStatus(status: AssignmentPublishStatus?) {
        val next = _uiState.value.copy(status = status)
        _uiState.value = next.copy(filtered = filter(next.assignments, next))
    }

    fun setClassroom(classroomId: String?) {
        val next = _uiState.value.copy(classroomId = classroomId)
        _uiState.value = next.copy(filtered = filter(next.assignments, next))
    }

    fun setShowArchived(show: Boolean) {
        val next = _uiState.value.copy(showArchived = show)
        _uiState.value = next.copy(filtered = filter(next.assignments, next))
    }

    fun duplicate(id: String) = perform("Đã sao chép bài tập.") { duplicateAssignmentUseCase(id).map { Unit } }
    fun archive(id: String, archived: Boolean) = perform(
        if (archived) "Đã lưu trữ bài tập." else "Đã khôi phục bài tập."
    ) { archiveAssignmentUseCase(id, archived).map { Unit } }
    fun delete(id: String) = perform("Đã xóa bài tập.") { deleteAssignmentUseCase(id) }
    fun publish(id: String) = perform("Đã xuất bản bài tập.") { publishAssignmentUseCase(id).map { Unit } }
    fun close(id: String) = perform("Đã đóng bài tập.") { closeAssignmentUseCase(id).map { Unit } }
    fun reopen(id: String) = perform("Đã mở lại bài tập.") { reopenAssignmentUseCase(id).map { Unit } }

    private fun perform(successMessage: String, action: suspend () -> Result<Unit>) {
        if (_uiState.value.isSubmitting) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            action().fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, message = successMessage)
                    load()
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, error = messageOf(it))
                }
            )
        }
    }

    fun consumeMessage() { _uiState.value = _uiState.value.copy(message = null, error = null) }

    private fun filter(items: List<Assignment>, state: AssignmentManagementUiState): List<Assignment> =
        items.filter { assignment ->
            assignment.isArchived == state.showArchived &&
                (state.status == null || assignment.publishStatus == state.status) &&
                (state.classroomId == null || assignment.classroomId == state.classroomId) &&
                (state.query.isBlank() ||
                    assignment.title.contains(state.query, ignoreCase = true) ||
                    assignment.courseName.contains(state.query, ignoreCase = true))
        }.sortedByDescending { it.createdAt }

    private fun messageOf(error: Throwable): String =
        error.message?.takeIf { it.isNotBlank() } ?: "Không thể hoàn tất thao tác. Vui lòng thử lại."
}

private enum class AssignmentConfirmAction { ARCHIVE, DELETE }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignmentManagementScreen(
    onNavigateBack: () -> Unit,
    onNavigateToCreate: () -> Unit,
    onNavigateToDetail: (String) -> Unit,
    onNavigateToEdit: (String) -> Unit,
    onNavigateToSubmissions: (String) -> Unit,
    viewModel: AssignmentManagementViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    var confirmation by remember { mutableStateOf<Pair<Assignment, AssignmentConfirmAction>?>(null) }

    LaunchedEffect(uiState.message, uiState.error) {
        val message = uiState.message ?: uiState.error
        if (message != null) {
            snackbarHostState.showSnackbar(message)
            viewModel.consumeMessage()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Quản lý bài tập", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Quay lại")
                    }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNavigateToCreate,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Tạo bài tập") }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null && uiState.assignments.isEmpty() ->
                ErrorScreen(uiState.error.orEmpty(), onRetry = viewModel::load, modifier = Modifier.padding(padding))
            else -> Column(
                modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp)
            ) {
                OutlinedTextField(
                    value = uiState.query,
                    onValueChange = viewModel::setQuery,
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                    label = { Text("Tìm bài tập") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    singleLine = true
                )
                LazyRow(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    item {
                        FilterChip(
                            selected = uiState.status == null,
                            onClick = { viewModel.setStatus(null) },
                            label = { Text("Tất cả trạng thái") }
                        )
                    }
                    item {
                        FilterChip(
                            selected = uiState.status == AssignmentPublishStatus.DRAFT,
                            onClick = { viewModel.setStatus(AssignmentPublishStatus.DRAFT) },
                            label = { Text("Bản nháp") }
                        )
                    }
                    item {
                        FilterChip(
                            selected = uiState.status == AssignmentPublishStatus.PUBLISHED,
                            onClick = { viewModel.setStatus(AssignmentPublishStatus.PUBLISHED) },
                            label = { Text("Đã xuất bản") }
                        )
                    }
                    item {
                        FilterChip(
                            selected = uiState.status == AssignmentPublishStatus.CLOSED,
                            onClick = { viewModel.setStatus(AssignmentPublishStatus.CLOSED) },
                            label = { Text("Đã đóng") }
                        )
                    }
                }
                LazyRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    item {
                        FilterChip(
                            selected = uiState.classroomId == null,
                            onClick = { viewModel.setClassroom(null) },
                            label = { Text("Tất cả lớp") }
                        )
                    }
                    items(uiState.assignments.distinctBy { it.classroomId }) { assignment ->
                        FilterChip(
                            selected = uiState.classroomId == assignment.classroomId,
                            onClick = { viewModel.setClassroom(assignment.classroomId) },
                            label = { Text(assignment.courseName.ifBlank { assignment.courseId }) }
                        )
                    }
                }
                FilterChip(
                    selected = uiState.showArchived,
                    onClick = { viewModel.setShowArchived(!uiState.showArchived) },
                    label = { Text(if (uiState.showArchived) "Đang xem mục lưu trữ" else "Xem mục lưu trữ") },
                    leadingIcon = { Icon(Icons.Default.Archive, contentDescription = null, modifier = Modifier.size(18.dp)) }
                )
                Spacer(Modifier.height(8.dp))
                if (uiState.filtered.isEmpty()) {
                    EmptyScreen(
                        if (uiState.showArchived) "Chưa có bài tập đã lưu trữ" else "Chưa có bài tập phù hợp"
                    )
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 96.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(uiState.filtered, key = { it.id }) { assignment ->
                            AssignmentManagementCard(
                                assignment = assignment,
                                enabled = !uiState.isSubmitting,
                                onView = { onNavigateToDetail(assignment.id) },
                                onEdit = { onNavigateToEdit(assignment.id) },
                                onSubmissions = { onNavigateToSubmissions(assignment.id) },
                                onDuplicate = { viewModel.duplicate(assignment.id) },
                                onPublish = { viewModel.publish(assignment.id) },
                                onClose = { viewModel.close(assignment.id) },
                                onReopen = { viewModel.reopen(assignment.id) },
                                onRestore = { viewModel.archive(assignment.id, false) },
                                onArchive = { confirmation = assignment to AssignmentConfirmAction.ARCHIVE },
                                onDelete = { confirmation = assignment to AssignmentConfirmAction.DELETE }
                            )
                        }
                    }
                }
            }
        }
    }

    confirmation?.let { (assignment, action) ->
        AlertDialog(
            onDismissRequest = { if (!uiState.isSubmitting) confirmation = null },
            title = { Text(if (action == AssignmentConfirmAction.DELETE) "Xóa bài tập?" else "Lưu trữ bài tập?") },
            text = {
                Text(
                    if (action == AssignmentConfirmAction.DELETE)
                        "Chỉ có thể xóa khi bài tập chưa có bài nộp. Thao tác này không thể hoàn tác."
                    else "Bài tập sẽ không còn xuất hiện trong danh sách chính nhưng mọi dữ liệu vẫn được giữ lại."
                )
            },
            confirmButton = {
                Button(
                    enabled = !uiState.isSubmitting,
                    onClick = {
                        if (action == AssignmentConfirmAction.DELETE) viewModel.delete(assignment.id)
                        else viewModel.archive(assignment.id, true)
                        confirmation = null
                    }
                ) { Text(if (action == AssignmentConfirmAction.DELETE) "Xóa" else "Lưu trữ") }
            },
            dismissButton = {
                TextButton(onClick = { confirmation = null }, enabled = !uiState.isSubmitting) { Text("Hủy") }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LecturerAssignmentDetailScreen(
    assignmentId: String,
    onNavigateBack: () -> Unit,
    onNavigateToEdit: (String) -> Unit,
    onNavigateToSubmissions: (String) -> Unit,
    viewModel: AssignmentEditorViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(assignmentId) { viewModel.loadForEdit(assignmentId) }
    val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chi tiết bài tập", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    IconButton(onClick = { onNavigateToEdit(assignmentId) }) {
                        Icon(Icons.Default.Edit, contentDescription = "Chỉnh sửa bài tập")
                    }
                }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(
                uiState.error.orEmpty(),
                onRetry = { viewModel.loadForEdit(assignmentId) },
                modifier = Modifier.padding(padding)
            )
            uiState.existingAssignment == null -> EmptyScreen("Không tìm thấy bài tập", Modifier.padding(padding))
            else -> {
                val assignment = uiState.existingAssignment
                if (assignment != null) {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize().padding(padding),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        item {
                            Text(assignment.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                            Text(assignment.courseName, color = MaterialTheme.colorScheme.primary)
                        }
                        item {
                            AssignmentDetailSection("Mô tả", assignment.description)
                        }
                        if (assignment.instructions.isNotBlank()) {
                            item { AssignmentDetailSection("Hướng dẫn", assignment.instructions) }
                        }
                        item {
                            AssignmentDetailSection(
                                "Thời gian",
                                "Bắt đầu: ${assignment.startAt?.format(formatter) ?: "Ngay khi xuất bản"}\n" +
                                    "Hạn nộp: ${assignment.deadline.format(formatter)}\n" +
                                    "Đóng bài: ${assignment.closeAt?.format(formatter) ?: "Không đặt"}"
                            )
                        }
                        item {
                            AssignmentDetailSection(
                                "Chính sách",
                                "Điểm tối đa: ${assignment.totalMaxScore}\n" +
                                    "Nộp muộn: ${if (assignment.allowLateSubmission) "Có, phạt ${assignment.latePenaltyPercent}%" else "Không"}\n" +
                                    "Số lần nộp: ${assignment.maxAttempts}\n" +
                                    "Định dạng: ${assignment.allowedFileTypes.joinToString { it.uppercase() }}"
                            )
                        }
                        if (assignment.resourceUrl.isNotBlank() || !assignment.attachmentUri.isNullOrBlank()) {
                            item {
                                AssignmentDetailSection(
                                    "Tài liệu",
                                    listOfNotNull(
                                        assignment.resourceUrl.takeIf { it.isNotBlank() },
                                        assignment.attachmentUri
                                    ).joinToString("\n")
                                )
                            }
                        }
                        item {
                            Button(
                                onClick = { onNavigateToSubmissions(assignmentId) },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.AutoMirrored.Filled.List, contentDescription = null)
                                Spacer(Modifier.width(8.dp))
                                Text("Xem bài nộp")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AssignmentDetailSection(title: String, value: String) {
    OutlinedCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, fontWeight = FontWeight.Bold)
            Text(value, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun AssignmentManagementCard(
    assignment: Assignment,
    enabled: Boolean,
    onView: () -> Unit,
    onEdit: () -> Unit,
    onSubmissions: () -> Unit,
    onDuplicate: () -> Unit,
    onPublish: () -> Unit,
    onClose: () -> Unit,
    onReopen: () -> Unit,
    onArchive: () -> Unit,
    onRestore: () -> Unit,
    onDelete: () -> Unit
) {
    val fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
    var menuExpanded by remember { mutableStateOf(false) }
    Card(onClick = onView, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(assignment.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                    Text(
                        "Hạn nộp: ${assignment.deadline.format(fmt)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Box {
                    IconButton(onClick = { menuExpanded = true }, enabled = enabled) {
                        Icon(Icons.Default.MoreVert, contentDescription = "Tùy chọn bài tập")
                    }
                    DropdownMenu(expanded = menuExpanded, onDismissRequest = { menuExpanded = false }) {
                        DropdownMenuItem(
                            text = { Text("Chỉnh sửa") },
                            leadingIcon = { Icon(Icons.Default.Edit, contentDescription = null) },
                            onClick = { menuExpanded = false; onEdit() }
                        )
                        DropdownMenuItem(
                            text = { Text("Sao chép") },
                            leadingIcon = { Icon(Icons.Default.ContentCopy, contentDescription = null) },
                            onClick = { menuExpanded = false; onDuplicate() }
                        )
                        when (assignment.publishStatus) {
                            AssignmentPublishStatus.DRAFT -> DropdownMenuItem(
                                text = { Text("Xuất bản") },
                                leadingIcon = { Icon(Icons.Default.Publish, contentDescription = null) },
                                onClick = { menuExpanded = false; onPublish() }
                            )
                            AssignmentPublishStatus.PUBLISHED -> DropdownMenuItem(
                                text = { Text("Đóng bài tập") },
                                onClick = { menuExpanded = false; onClose() }
                            )
                            AssignmentPublishStatus.CLOSED -> DropdownMenuItem(
                                text = { Text("Mở lại") },
                                onClick = { menuExpanded = false; onReopen() }
                            )
                        }
                        DropdownMenuItem(
                            text = { Text(if (assignment.isArchived) "Khôi phục" else "Lưu trữ") },
                            leadingIcon = {
                                Icon(
                                    if (assignment.isArchived) Icons.Default.Unarchive else Icons.Default.Archive,
                                    contentDescription = null
                                )
                            },
                            onClick = {
                                menuExpanded = false
                                if (assignment.isArchived) onRestore() else onArchive()
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Xóa") },
                            leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null) },
                            onClick = { menuExpanded = false; onDelete() }
                        )
                    }
                }
            }
            Text(
                assignment.description,
                style = MaterialTheme.typography.bodySmall,
                maxLines = 2,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AssistChip(onClick = onEdit, enabled = enabled, label = { Text("Sửa") })
                TextButton(onClick = onSubmissions, enabled = enabled) {
                    Icon(Icons.AutoMirrored.Filled.List, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Xem bài nộp")
                }
            }
        }
    }
}
