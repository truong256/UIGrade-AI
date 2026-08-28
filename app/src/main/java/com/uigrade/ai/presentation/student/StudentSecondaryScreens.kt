package com.uigrade.ai.presentation.student

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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Sort
import androidx.compose.material3.Card
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.ui.components.AssignmentStatusBadge
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignmentListScreen(
    initialFilter: String?,
    onNavigateBack: () -> Unit,
    onNavigateToAssignment: (String) -> Unit,
    viewModel: StudentAssignmentListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var sortExpanded by remember { mutableStateOf(false) }
    LaunchedEffect(initialFilter) { viewModel.applyInitialFilter(initialFilter) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Bài tập", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.load(refresh = true) }, enabled = !uiState.isRefreshing) {
                        Icon(Icons.Default.Refresh, contentDescription = "Làm mới bài tập")
                    }
                    androidx.compose.foundation.layout.Box {
                        IconButton(onClick = { sortExpanded = true }) {
                            Icon(Icons.Default.Sort, contentDescription = "Sắp xếp bài tập")
                        }
                        DropdownMenu(expanded = sortExpanded, onDismissRequest = { sortExpanded = false }) {
                            StudentAssignmentSort.entries.forEach { sort ->
                                DropdownMenuItem(
                                    text = {
                                        Text(
                                            when (sort) {
                                                StudentAssignmentSort.DEADLINE -> "Hạn nộp"
                                                StudentAssignmentSort.ASSIGNED_DATE -> "Ngày giao"
                                                StudentAssignmentSort.TITLE -> "Tiêu đề"
                                            }
                                        )
                                    },
                                    onClick = { viewModel.onSortChange(sort); sortExpanded = false }
                                )
                            }
                        }
                    }
                }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(
                uiState.error ?: "Không thể tải bài tập.",
                onRetry = { viewModel.load() },
                modifier = Modifier.padding(padding)
            )
            else -> Column(Modifier.fillMaxSize().padding(padding)) {
                OutlinedTextField(
                    value = uiState.query,
                    onValueChange = viewModel::onQueryChange,
                    placeholder = { Text("Tìm tiêu đề, mô tả, môn học...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    trailingIcon = {
                        if (uiState.query.isNotBlank()) {
                            IconButton(onClick = { viewModel.onQueryChange("") }) {
                                Icon(Icons.Default.Clear, contentDescription = "Xóa nội dung tìm kiếm")
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    singleLine = true
                )
                val classrooms = uiState.assignments.map { it.assignment.classroomId to it.assignment.courseName }.distinctBy { it.first }
                LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    item { FilterChip(uiState.classId == null, { viewModel.onClassChange(null) }, { Text("Tất cả lớp") }) }
                    items(classrooms, key = { it.first }) { (id, name) ->
                        FilterChip(
                            selected = uiState.classId == id,
                            onClick = { viewModel.onClassChange(id) },
                            label = { Text(name.ifBlank { id }, maxLines = 1) }
                        )
                    }
                }
                LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(StudentAssignmentFilter.entries) { filter ->
                        FilterChip(
                            selected = uiState.filter == filter,
                            onClick = { viewModel.onFilterChange(filter) },
                            label = {
                                Text(
                                    when (filter) {
                                        StudentAssignmentFilter.ALL -> "Tất cả"
                                        StudentAssignmentFilter.MISSING -> "Chưa nộp"
                                        StudentAssignmentFilter.UPCOMING -> "Sắp hết hạn"
                                        StudentAssignmentFilter.DRAFT -> "Bản nháp"
                                        StudentAssignmentFilter.SUBMITTED -> "Đã nộp"
                                        StudentAssignmentFilter.GRADED -> "Đã chấm"
                                        StudentAssignmentFilter.OVERDUE -> "Quá hạn"
                                    }
                                )
                            }
                        )
                    }
                }
                if (uiState.filtered.isEmpty()) {
                    EmptyScreen(
                        when (uiState.filter) {
                            StudentAssignmentFilter.MISSING -> "Tuyệt vời! Bạn đã hoàn thành tất cả bài tập hiện tại."
                            StudentAssignmentFilter.GRADED -> "Chưa có kết quả nào được công bố."
                            else -> "Hiện chưa có bài tập phù hợp."
                        },
                        Modifier.fillMaxSize()
                    )
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(uiState.filtered, key = { it.assignment.id }) { item ->
                            StudentAssignmentListCard(item) { onNavigateToAssignment(item.assignment.id) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StudentAssignmentListCard(item: AssignmentWithStatus, onClick: () -> Unit) {
    val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(item.assignment.title, Modifier.weight(1f), fontWeight = FontWeight.Bold)
                Spacer(Modifier.width(8.dp))
                AssignmentStatusBadge(item.status)
            }
            Text(item.assignment.courseName, style = MaterialTheme.typography.bodySmall)
            Text("Hạn nộp: ${item.assignment.deadline.format(formatter)}", style = MaterialTheme.typography.bodySmall)
            Text("Lần nộp còn lại: ${item.attemptsRemaining}", style = MaterialTheme.typography.labelSmall)
            item.score?.let { Text("Điểm: $it/${item.assignment.totalMaxScore}", fontWeight = FontWeight.SemiBold) }
            item.disabledReason?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.labelSmall) }
        }
    }
}
