/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.presentation.lecturer

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.model.RubricCriterion
import com.uigrade.ai.domain.model.RubricLevel
import com.uigrade.ai.domain.usecase.CreateRubricUseCase
import com.uigrade.ai.domain.usecase.DeleteRubricUseCase
import com.uigrade.ai.domain.usecase.GetRubricByIdUseCase
import com.uigrade.ai.domain.usecase.UpdateRubricUseCase
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class RubricEditorUiState(
    val existing: Rubric? = null,
    val title: String = "",
    val description: String = "",
    val version: String = "1.0",
    val criteria: List<RubricCriterion> = emptyList(),
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val saved: Boolean = false,
    val deleted: Boolean = false,
    val error: String? = null
) {
    val totalScore: Int get() = criteria.sumOf { it.maxScore }
}

@HiltViewModel
class RubricEditorViewModel @Inject constructor(
    private val getRubric: GetRubricByIdUseCase,
    private val createRubric: CreateRubricUseCase,
    private val updateRubric: UpdateRubricUseCase,
    private val deleteRubric: DeleteRubricUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(RubricEditorUiState())
    val uiState: StateFlow<RubricEditorUiState> = _uiState.asStateFlow()

    fun load(rubricId: String?) {
        if (rubricId.isNullOrBlank()) {
            _uiState.value = RubricEditorUiState()
            return
        }
        viewModelScope.launch {
            _uiState.value = RubricEditorUiState(isLoading = true)
            runCatching { getRubric(rubricId) }.fold(
                onSuccess = { rubric ->
                    _uiState.value = if (rubric == null) {
                        RubricEditorUiState(error = "Không tìm thấy rubric")
                    } else {
                        RubricEditorUiState(
                            existing = rubric,
                            title = rubric.title,
                            description = rubric.description,
                            version = rubric.version,
                            criteria = rubric.criteria
                        )
                    }
                },
                onFailure = { _uiState.value = RubricEditorUiState(error = it.message) }
            )
        }
    }

    fun setTitle(value: String) { _uiState.value = _uiState.value.copy(title = value) }
    fun setDescription(value: String) { _uiState.value = _uiState.value.copy(description = value) }
    fun setVersion(value: String) { _uiState.value = _uiState.value.copy(version = value) }

    fun addCriterion() {
        val criterion = RubricCriterion(
            id = UUID.randomUUID().toString(),
            name = "",
            description = "",
            weightPercent = 0,
            maxScore = 10,
            levels = listOf(
                RubricLevel(UUID.randomUUID().toString(), "Tốt", "Đáp ứng đầy đủ yêu cầu", 10),
                RubricLevel(UUID.randomUUID().toString(), "Đạt", "Đáp ứng phần lớn yêu cầu", 7),
                RubricLevel(UUID.randomUUID().toString(), "Chưa đạt", "Cần cải thiện", 3)
            )
        )
        _uiState.value = _uiState.value.copy(criteria = _uiState.value.criteria + criterion)
        normalizeWeights()
    }

    fun updateCriterion(index: Int, transform: (RubricCriterion) -> RubricCriterion) {
        val criteria = _uiState.value.criteria.toMutableList()
        if (index !in criteria.indices) return
        criteria[index] = transform(criteria[index])
        _uiState.value = _uiState.value.copy(criteria = criteria)
    }

    fun removeCriterion(index: Int) {
        if (index !in _uiState.value.criteria.indices) return
        _uiState.value = _uiState.value.copy(
            criteria = _uiState.value.criteria.filterIndexed { current, _ -> current != index }
        )
        normalizeWeights()
    }

    fun moveCriterion(index: Int, offset: Int) {
        val target = index + offset
        val criteria = _uiState.value.criteria.toMutableList()
        if (index !in criteria.indices || target !in criteria.indices) return
        val item = criteria.removeAt(index)
        criteria.add(target, item)
        _uiState.value = _uiState.value.copy(criteria = criteria)
    }

    fun addLevel(criterionIndex: Int) = updateCriterion(criterionIndex) { criterion ->
        criterion.copy(
            levels = criterion.levels + RubricLevel(
                id = UUID.randomUUID().toString(),
                title = "",
                description = "",
                score = 0
            )
        )
    }

    fun updateLevel(criterionIndex: Int, levelIndex: Int, transform: (RubricLevel) -> RubricLevel) =
        updateCriterion(criterionIndex) { criterion ->
            criterion.copy(
                levels = criterion.levels.mapIndexed { current, level ->
                    if (current == levelIndex) transform(level) else level
                }
            )
        }

    fun removeLevel(criterionIndex: Int, levelIndex: Int) =
        updateCriterion(criterionIndex) { criterion ->
            criterion.copy(levels = criterion.levels.filterIndexed { current, _ -> current != levelIndex })
        }

    fun save() {
        val state = _uiState.value
        if (state.isSaving) return
        viewModelScope.launch {
            _uiState.value = state.copy(isSaving = true, error = null)
            val rubric = Rubric(
                id = state.existing?.id.orEmpty(),
                title = state.title.trim(),
                description = state.description.trim(),
                version = state.version.trim().ifBlank { "1.0" },
                criteria = state.criteria,
                totalMaxScore = state.totalScore,
                lecturerId = state.existing?.lecturerId.orEmpty()
            )
            val result = if (state.existing == null) createRubric(rubric) else updateRubric(rubric)
            result.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(existing = it, isSaving = false, saved = true) },
                onFailure = { _uiState.value = _uiState.value.copy(isSaving = false, error = it.message) }
            )
        }
    }

    fun delete() {
        val id = _uiState.value.existing?.id ?: return
        if (_uiState.value.isSaving) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true)
            deleteRubric(id).fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isSaving = false, deleted = true) },
                onFailure = { _uiState.value = _uiState.value.copy(isSaving = false, error = it.message) }
            )
        }
    }

    fun clearError() { _uiState.value = _uiState.value.copy(error = null) }

    private fun normalizeWeights() {
        val criteria = _uiState.value.criteria
        if (criteria.isEmpty()) return
        val base = 100 / criteria.size
        val remainder = 100 - base * criteria.size
        _uiState.value = _uiState.value.copy(
            criteria = criteria.mapIndexed { index, criterion ->
                criterion.copy(weightPercent = base + if (index < remainder) 1 else 0)
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RubricEditorScreen(
    rubricId: String?,
    onNavigateBack: () -> Unit,
    onSaved: () -> Unit,
    viewModel: RubricEditorViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showLeaveDialog by remember { mutableStateOf(false) }

    LaunchedEffect(rubricId) { viewModel.load(rubricId) }
    LaunchedEffect(uiState.saved, uiState.deleted) {
        if (uiState.saved || uiState.deleted) onSaved()
    }
    LaunchedEffect(uiState.error) {
        uiState.error?.let {
            snackbar.showSnackbar(it)
            viewModel.clearError()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = { Text(if (rubricId == null) "Tạo rubric" else "Chỉnh sửa rubric", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = {
                        if (uiState.title.isNotBlank() || uiState.criteria.isNotEmpty()) showLeaveDialog = true
                        else onNavigateBack()
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    if (uiState.existing != null) {
                        IconButton(onClick = { showDeleteDialog = true }, enabled = !uiState.isSaving) {
                            Icon(Icons.Default.Delete, contentDescription = "Xóa rubric")
                        }
                    }
                }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    OutlinedTextField(
                        value = uiState.title,
                        onValueChange = viewModel::setTitle,
                        label = { Text("Tên rubric *") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = uiState.description,
                        onValueChange = viewModel::setDescription,
                        label = { Text("Mô tả") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2
                    )
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedTextField(
                            value = uiState.version,
                            onValueChange = viewModel::setVersion,
                            label = { Text("Phiên bản") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedCard(modifier = Modifier.weight(1f)) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("Tổng điểm", style = MaterialTheme.typography.labelSmall)
                                Text(uiState.totalScore.toString(), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
                item {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Tiêu chí", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        TextButton(onClick = viewModel::addCriterion) {
                            Icon(Icons.Default.Add, contentDescription = null)
                            Text("Thêm tiêu chí")
                        }
                    }
                }
                if (uiState.criteria.isEmpty()) {
                    item {
                        Text(
                            "Rubric chưa có tiêu chí. Hãy thêm ít nhất một tiêu chí để lưu.",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                itemsIndexed(uiState.criteria, key = { _, item -> item.id }) { index, criterion ->
                    RubricCriterionEditor(
                        index = index,
                        total = uiState.criteria.size,
                        criterion = criterion,
                        onUpdate = { transform -> viewModel.updateCriterion(index, transform) },
                        onRemove = { viewModel.removeCriterion(index) },
                        onMoveUp = { viewModel.moveCriterion(index, -1) },
                        onMoveDown = { viewModel.moveCriterion(index, 1) },
                        onAddLevel = { viewModel.addLevel(index) },
                        onUpdateLevel = { levelIndex, transform -> viewModel.updateLevel(index, levelIndex, transform) },
                        onRemoveLevel = { levelIndex -> viewModel.removeLevel(index, levelIndex) }
                    )
                }
                item {
                    Button(
                        onClick = viewModel::save,
                        enabled = !uiState.isSaving && uiState.title.isNotBlank() && uiState.criteria.isNotEmpty(),
                        modifier = Modifier.fillMaxWidth().height(50.dp)
                    ) {
                        if (uiState.isSaving) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(22.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Lưu rubric")
                        }
                    }
                }
            }
        }
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Xóa rubric?") },
            text = { Text("Không thể xóa rubric đang được dùng bởi một bài tập.") },
            confirmButton = {
                Button(onClick = {
                    showDeleteDialog = false
                    viewModel.delete()
                }) { Text("Xóa") }
            },
            dismissButton = { TextButton(onClick = { showDeleteDialog = false }) { Text("Hủy") } }
        )
    }
    if (showLeaveDialog) {
        AlertDialog(
            onDismissRequest = { showLeaveDialog = false },
            title = { Text("Rời trình sửa rubric?") },
            text = { Text("Các thay đổi chưa lưu sẽ bị mất.") },
            confirmButton = {
                Button(onClick = {
                    showLeaveDialog = false
                    onNavigateBack()
                }) { Text("Rời đi") }
            },
            dismissButton = { TextButton(onClick = { showLeaveDialog = false }) { Text("Tiếp tục sửa") } }
        )
    }
}

@Composable
private fun RubricCriterionEditor(
    index: Int,
    total: Int,
    criterion: RubricCriterion,
    onUpdate: ((RubricCriterion) -> RubricCriterion) -> Unit,
    onRemove: () -> Unit,
    onMoveUp: () -> Unit,
    onMoveDown: () -> Unit,
    onAddLevel: () -> Unit,
    onUpdateLevel: (Int, (RubricLevel) -> RubricLevel) -> Unit,
    onRemoveLevel: (Int) -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Tiêu chí ${index + 1}", fontWeight = FontWeight.Bold)
                Row {
                    IconButton(onClick = onMoveUp, enabled = index > 0) {
                        Icon(Icons.Default.KeyboardArrowUp, contentDescription = "Đưa tiêu chí lên")
                    }
                    IconButton(onClick = onMoveDown, enabled = index < total - 1) {
                        Icon(Icons.Default.KeyboardArrowDown, contentDescription = "Đưa tiêu chí xuống")
                    }
                    IconButton(onClick = onRemove) {
                        Icon(Icons.Default.DeleteOutline, contentDescription = "Xóa tiêu chí")
                    }
                }
            }
            OutlinedTextField(
                value = criterion.name,
                onValueChange = { value -> onUpdate { it.copy(name = value) } },
                label = { Text("Tên tiêu chí *") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = criterion.description,
                onValueChange = { value -> onUpdate { it.copy(description = value) } },
                label = { Text("Mô tả") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = criterion.maxScore.toString(),
                onValueChange = { value ->
                    val score = value.filter(Char::isDigit).toIntOrNull() ?: 0
                    onUpdate { it.copy(maxScore = score) }
                },
                label = { Text("Điểm tối đa") },
                modifier = Modifier.fillMaxWidth()
            )
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Mức đánh giá", fontWeight = FontWeight.SemiBold)
                TextButton(onClick = onAddLevel) { Text("Thêm mức") }
            }
            criterion.levels.forEachIndexed { levelIndex, level ->
                OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = level.title,
                                onValueChange = { value -> onUpdateLevel(levelIndex) { it.copy(title = value) } },
                                label = { Text("Tên mức") },
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = level.score.toString(),
                                onValueChange = { value ->
                                    val score = value.filter(Char::isDigit).toIntOrNull() ?: 0
                                    onUpdateLevel(levelIndex) { it.copy(score = score) }
                                },
                                label = { Text("Điểm") },
                                modifier = Modifier.width(100.dp)
                            )
                            IconButton(onClick = { onRemoveLevel(levelIndex) }) {
                                Icon(Icons.Default.Close, contentDescription = "Xóa mức đánh giá")
                            }
                        }
                        OutlinedTextField(
                            value = level.description,
                            onValueChange = { value -> onUpdateLevel(levelIndex) { it.copy(description = value) } },
                            label = { Text("Mô tả mức") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}
