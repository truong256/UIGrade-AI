/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.presentation.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.domain.model.Metric
import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.model.Rule
import com.uigrade.ai.ui.components.EmptyScreen
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen

private data class RubricConfirmation(val rubric: Rubric, val delete: Boolean, val active: Boolean = false)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RubricAdminScreen(
    onNavigateBack: () -> Unit,
    viewModel: AdminRubricViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var confirmation by remember { mutableStateOf<RubricConfirmation?>(null) }
    LaunchedEffect(uiState.successMessage) {
        uiState.successMessage?.let { snackbar.showSnackbar(it); viewModel.clearMessage() }
    }
    LaunchedEffect(uiState.errorMessage, uiState.allRubrics) {
        if (uiState.errorMessage != null && uiState.allRubrics.isNotEmpty()) {
            snackbar.showSnackbar(uiState.errorMessage.orEmpty())
            viewModel.clearError()
        }
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Quản lý Rubric", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Quay lại") } },
                actions = {
                    IconButton(onClick = { viewModel.load(refresh = true) }, enabled = !uiState.isRefreshing && !uiState.isSubmitting) {
                        if (uiState.isRefreshing) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                        else Icon(Icons.Default.Refresh, "Làm mới rubric")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.errorMessage != null && uiState.allRubrics.isEmpty() -> ErrorScreen(
                uiState.errorMessage.orEmpty(), { viewModel.load() }, Modifier.padding(padding)
            )
            else -> Column(Modifier.fillMaxSize().padding(padding)) {
                CatalogSearch(value = uiState.searchQuery, placeholder = "Tìm rubric theo tên", onValueChange = viewModel::search)
                ActiveFilterRow(uiState.activeFilter, viewModel::filterActive)
                Text(
                    "${uiState.rubrics.size} / ${uiState.allRubrics.size} rubric",
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                )
                if (uiState.rubrics.isEmpty()) {
                    EmptyScreen("Không tìm thấy rubric phù hợp.", Modifier.weight(1f))
                } else LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(uiState.rubrics, key = { it.id }) { rubric ->
                        RubricAdminCard(
                            rubric = rubric,
                            processing = uiState.isSubmitting,
                            onPreview = { viewModel.preview(rubric) },
                            onCopy = { viewModel.duplicate(rubric) },
                            onToggle = { active -> confirmation = RubricConfirmation(rubric, delete = false, active = active) },
                            onDelete = { confirmation = RubricConfirmation(rubric, delete = true) }
                        )
                    }
                }
            }
        }
    }
    uiState.previewRubric?.let { RubricPreviewDialog(it, onDismiss = { viewModel.preview(null) }) }
    confirmation?.let { pending ->
        val deleting = pending.delete
        AlertDialog(
            onDismissRequest = { if (!uiState.isSubmitting) confirmation = null },
            icon = { Icon(Icons.Default.Warning, null) },
            title = { Text(if (deleting) "Xóa rubric?" else if (pending.active) "Bật rubric?" else "Vô hiệu hóa rubric?") },
            text = {
                Text(
                    if (deleting) "Chỉ rubric chưa được dùng trong bài tập mới có thể xóa."
                    else if (pending.rubric.usedByAssignmentIds.isNotEmpty()) "Rubric đang được dùng bởi ${pending.rubric.usedByAssignmentIds.size} bài tập. Thay đổi sẽ áp dụng cho các lần chấm tiếp theo."
                    else "Trạng thái rubric sẽ được cập nhật ngay."
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (deleting) viewModel.delete(pending.rubric)
                        else viewModel.setActive(pending.rubric, pending.active)
                        confirmation = null
                    },
                    enabled = !uiState.isSubmitting,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (deleting || !pending.active) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                    )
                ) { Text("Xác nhận") }
            },
            dismissButton = { OutlinedButton(onClick = { confirmation = null }) { Text("Hủy") } }
        )
    }
}

@Composable
private fun RubricAdminCard(
    rubric: Rubric,
    processing: Boolean,
    onPreview: () -> Unit,
    onCopy: () -> Unit,
    onToggle: (Boolean) -> Unit,
    onDelete: () -> Unit
) {
    Card(onClick = onPreview, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(rubric.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    Text("v${rubric.version} · ${rubric.criteria.size} tiêu chí · ${rubric.totalMaxScore} điểm", style = MaterialTheme.typography.bodySmall)
                }
                Switch(
                    checked = rubric.isActive,
                    onCheckedChange = onToggle,
                    enabled = !processing
                )
            }
            Text(rubric.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2)
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    color = if (rubric.usedByAssignmentIds.isEmpty()) MaterialTheme.colorScheme.surfaceVariant else MaterialTheme.colorScheme.primaryContainer,
                    shape = MaterialTheme.shapes.extraSmall
                ) {
                    Text(
                        if (rubric.usedByAssignmentIds.isEmpty()) "Chưa sử dụng" else "Đang dùng ở ${rubric.usedByAssignmentIds.size} bài tập",
                        style = MaterialTheme.typography.labelSmall,
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
                    )
                }
                Spacer(Modifier.weight(1f))
                IconButton(onClick = onCopy, enabled = !processing) { Icon(Icons.Default.ContentCopy, "Sao chép ${rubric.title}") }
                IconButton(
                    onClick = onDelete,
                    enabled = !processing && rubric.usedByAssignmentIds.isEmpty()
                ) { Icon(Icons.Default.Delete, "Xóa ${rubric.title}") }
            }
        }
    }
}

@Composable
private fun RubricPreviewDialog(rubric: Rubric, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Xem trước Rubric") },
        text = {
            Column(Modifier.heightIn(max = 500.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(rubric.title, fontWeight = FontWeight.Bold)
                Text(rubric.description, style = MaterialTheme.typography.bodySmall)
                Text("Tổng trọng số: ${rubric.criteria.sumOf { it.weightPercent }}% · Tổng điểm: ${rubric.totalMaxScore}")
                rubric.criteria.forEach { criterion ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(10.dp)) {
                            Text("${criterion.name} · ${criterion.weightPercent}%", fontWeight = FontWeight.SemiBold)
                            Text("${criterion.maxScore} điểm · ${criterion.rules.size} quy tắc", style = MaterialTheme.typography.bodySmall)
                            Text(criterion.description, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
                if (rubric.usedByAssignmentIds.isNotEmpty()) {
                    Text("Bài tập đang sử dụng: ${rubric.usedByAssignmentIds.joinToString()}", style = MaterialTheme.typography.bodySmall)
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Đóng") } }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RuleManagementScreen(
    onNavigateBack: () -> Unit,
    viewModel: RuleManagementViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var disablingCritical by remember { mutableStateOf<Rule?>(null) }
    LaunchedEffect(uiState.successMessage) {
        uiState.successMessage?.let { snackbar.showSnackbar(it); viewModel.clearMessage() }
    }
    LaunchedEffect(uiState.errorMessage, uiState.allRules) {
        if (uiState.errorMessage != null && uiState.allRules.isNotEmpty()) {
            snackbar.showSnackbar(uiState.errorMessage.orEmpty())
            viewModel.clearError()
        }
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Quản lý quy tắc", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Quay lại") } },
                actions = { IconButton(onClick = { viewModel.load() }) { Icon(Icons.Default.Refresh, "Làm mới quy tắc") } }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.errorMessage != null && uiState.allRules.isEmpty() -> ErrorScreen(
                uiState.errorMessage.orEmpty(),
                { viewModel.load() },
                Modifier.padding(padding)
            )
            else -> CatalogListLayout(
                modifier = Modifier.padding(padding),
                search = uiState.searchQuery,
                placeholder = "Tìm theo mã hoặc mô tả quy tắc",
                active = uiState.activeFilter,
                count = "${uiState.rules.size} / ${uiState.allRules.size} quy tắc",
                empty = uiState.rules.isEmpty(),
                onSearch = viewModel::search,
                onFilter = viewModel::filterActive
            ) {
                items(uiState.rules, key = { it.id }) { rule ->
                    RuleAdminCard(
                        rule = rule,
                        processing = uiState.isSubmitting,
                        onOpen = { viewModel.select(rule) },
                        onToggle = { active ->
                            if (!active && rule.isCritical) disablingCritical = rule
                            else viewModel.setActive(rule, active)
                        }
                    )
                }
            }
        }
    }
    uiState.selectedRule?.let { rule ->
        RuleEditDialog(rule, uiState.isSubmitting, onDismiss = { viewModel.select(null) }, onSave = viewModel::update)
    }
    disablingCritical?.let { rule ->
        AlertDialog(
            onDismissRequest = { disablingCritical = null },
            icon = { Icon(Icons.Default.Warning, null, tint = MaterialTheme.colorScheme.error) },
            title = { Text("Vô hiệu hóa quy tắc quan trọng?") },
            text = { Text("Quy tắc này ảnh hưởng đến ${rule.affectedFeature}. Kết quả chấm mới có thể thay đổi.") },
            confirmButton = {
                Button(onClick = { viewModel.setActive(rule, false); disablingCritical = null }) { Text("Vô hiệu hóa") }
            },
            dismissButton = { OutlinedButton(onClick = { disablingCritical = null }) { Text("Hủy") } }
        )
    }
}

@Composable
private fun RuleAdminCard(rule: Rule, processing: Boolean, onOpen: () -> Unit, onToggle: (Boolean) -> Unit) {
    Card(onClick = onOpen, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(rule.id, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                    Text(rule.description, fontWeight = FontWeight.SemiBold, maxLines = 2)
                }
                Switch(checked = rule.isActive, onCheckedChange = onToggle, enabled = !processing)
            }
            Text("Điều kiện: ${rule.threshold} · Điểm tối đa: ${rule.maxScore}", style = MaterialTheme.typography.bodySmall)
            Text("Ảnh hưởng: ${rule.affectedFeature}${if (rule.isCritical) " · Quan trọng" else ""}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun RuleEditDialog(rule: Rule, processing: Boolean, onDismiss: () -> Unit, onSave: (Rule) -> Unit) {
    var description by rememberSaveable(rule.id) { mutableStateOf(rule.description) }
    var threshold by rememberSaveable(rule.id) { mutableStateOf(rule.threshold) }
    var maxScore by rememberSaveable(rule.id) { mutableStateOf(rule.maxScore.toString()) }
    var penalty by rememberSaveable(rule.id) { mutableStateOf(rule.penalty.toString()) }
    var error by remember { mutableStateOf<String?>(null) }
    AlertDialog(
        modifier = Modifier.imePadding(),
        onDismissRequest = { if (!processing) onDismiss() },
        title = { Text("Chi tiết quy tắc") },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(9.dp)) {
                Text(rule.id, color = MaterialTheme.colorScheme.primary)
                OutlinedTextField(description, { description = it; error = null }, label = { Text("Mô tả *") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(threshold, { threshold = it; error = null }, label = { Text("Điều kiện *") }, modifier = Modifier.fillMaxWidth())
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(maxScore, { maxScore = it.filter(Char::isDigit); error = null }, label = { Text("Điểm tối đa") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), modifier = Modifier.weight(1f))
                    OutlinedTextField(penalty, { penalty = it.filter(Char::isDigit); error = null }, label = { Text("Điểm trừ") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), modifier = Modifier.weight(1f))
                }
                Text("Tính năng: ${rule.affectedFeature}", style = MaterialTheme.typography.bodySmall)
                error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            }
        },
        confirmButton = {
            Button(onClick = {
                val parsedMax = maxScore.toIntOrNull()
                val parsedPenalty = penalty.toIntOrNull()
                error = when {
                    description.isBlank() -> "Mô tả không được để trống."
                    threshold.isBlank() -> "Điều kiện không được để trống."
                    parsedMax == null || parsedMax <= 0 -> "Điểm tối đa phải lớn hơn 0."
                    parsedPenalty == null || parsedPenalty < 0 -> "Điểm trừ không hợp lệ."
                    else -> null
                }
                if (error == null && parsedMax != null && parsedPenalty != null) {
                    onSave(
                        rule.copy(
                            description = description.trim(),
                            threshold = threshold.trim(),
                            maxScore = parsedMax,
                            penalty = parsedPenalty
                        )
                    )
                }
            }, enabled = !processing) {
                if (processing) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp) else { Icon(Icons.Default.Edit, null); Text("Lưu") }
            }
        },
        dismissButton = { OutlinedButton(onClick = onDismiss, enabled = !processing) { Text("Đóng") } }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MetricManagementScreen(
    onNavigateBack: () -> Unit,
    viewModel: MetricManagementViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    LaunchedEffect(uiState.successMessage) {
        uiState.successMessage?.let { snackbar.showSnackbar(it); viewModel.clearMessage() }
    }
    LaunchedEffect(uiState.errorMessage, uiState.allMetrics) {
        if (uiState.errorMessage != null && uiState.allMetrics.isNotEmpty()) {
            snackbar.showSnackbar(uiState.errorMessage.orEmpty())
            viewModel.clearError()
        }
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Quản lý metric", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Quay lại") } },
                actions = { IconButton(onClick = { viewModel.load() }) { Icon(Icons.Default.Refresh, "Làm mới metric") } }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.errorMessage != null && uiState.allMetrics.isEmpty() -> ErrorScreen(
                uiState.errorMessage.orEmpty(),
                { viewModel.load() },
                Modifier.padding(padding)
            )
            else -> CatalogListLayout(
                modifier = Modifier.padding(padding),
                search = uiState.searchQuery,
                placeholder = "Tìm theo mã hoặc tên metric",
                active = uiState.activeFilter,
                count = "${uiState.metrics.size} / ${uiState.allMetrics.size} metric",
                empty = uiState.metrics.isEmpty(),
                onSearch = viewModel::search,
                onFilter = viewModel::filterActive
            ) {
                items(uiState.metrics, key = { it.id }) { metric ->
                    MetricAdminCard(
                        metric = metric,
                        processing = uiState.isSubmitting,
                        onOpen = { viewModel.select(metric) },
                        onToggle = { viewModel.setActive(metric, it) }
                    )
                }
            }
        }
    }
    uiState.selectedMetric?.let { metric ->
        MetricEditDialog(metric, uiState.isSubmitting, onDismiss = { viewModel.select(null) }, onSave = viewModel::update)
    }
}

@Composable
private fun MetricAdminCard(metric: Metric, processing: Boolean, onOpen: () -> Unit, onToggle: (Boolean) -> Unit) {
    Card(onClick = onOpen, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(metric.id, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                    Text(metric.name, fontWeight = FontWeight.SemiBold)
                }
                Switch(checked = metric.isActive, onCheckedChange = onToggle, enabled = !processing)
            }
            Text("Đơn vị: ${metric.unit.ifBlank { "Không có" }} · Yêu cầu: ${metric.expectedValue}", style = MaterialTheme.typography.bodySmall)
            Text("Sử dụng tại: ${metric.usedIn}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun MetricEditDialog(metric: Metric, processing: Boolean, onDismiss: () -> Unit, onSave: (Metric) -> Unit) {
    var name by rememberSaveable(metric.id) { mutableStateOf(metric.name) }
    var min by rememberSaveable(metric.id) { mutableStateOf(metric.minValue?.toString().orEmpty()) }
    var max by rememberSaveable(metric.id) { mutableStateOf(metric.maxValue?.toString().orEmpty()) }
    var error by remember { mutableStateOf<String?>(null) }
    AlertDialog(
        modifier = Modifier.imePadding(),
        onDismissRequest = { if (!processing) onDismiss() },
        icon = { Icon(Icons.Default.Info, null) },
        title = { Text("Chi tiết metric") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
                Text(metric.id, color = MaterialTheme.colorScheme.primary)
                OutlinedTextField(name, { name = it; error = null }, label = { Text("Tên metric *") }, modifier = Modifier.fillMaxWidth())
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(min, { min = it; error = null }, label = { Text("Min") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), modifier = Modifier.weight(1f))
                    OutlinedTextField(max, { max = it; error = null }, label = { Text("Max") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), modifier = Modifier.weight(1f))
                }
                Text("Đơn vị: ${metric.unit.ifBlank { "Không có" }}")
                Text("Giá trị hiện tại: ${metric.actualValue} · Kỳ vọng: ${metric.expectedValue}")
                Text("Sử dụng tại: ${metric.usedIn}", style = MaterialTheme.typography.bodySmall)
                error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            }
        },
        confirmButton = {
            Button(onClick = {
                val minValue = min.takeIf(String::isNotBlank)?.toDoubleOrNull()
                val maxValue = max.takeIf(String::isNotBlank)?.toDoubleOrNull()
                error = when {
                    name.isBlank() -> "Tên metric không được để trống."
                    min.isNotBlank() && minValue == null -> "Giá trị min không hợp lệ."
                    max.isNotBlank() && maxValue == null -> "Giá trị max không hợp lệ."
                    minValue != null && maxValue != null && minValue > maxValue -> "Min không được lớn hơn max."
                    else -> null
                }
                if (error == null) onSave(metric.copy(name = name.trim(), minValue = minValue, maxValue = maxValue))
            }, enabled = !processing) {
                if (processing) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp) else Text("Lưu")
            }
        },
        dismissButton = { OutlinedButton(onClick = onDismiss, enabled = !processing) { Text("Đóng") } }
    )
}

@Composable
private fun CatalogSearch(value: String, placeholder: String, onValueChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        placeholder = { Text(placeholder) },
        leadingIcon = { Icon(Icons.Default.Search, null) },
        singleLine = true
    )
}

@Composable
private fun ActiveFilterRow(selected: Boolean?, onSelect: (Boolean?) -> Unit) {
    LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        item { FilterChip(selected = selected == null, onClick = { onSelect(null) }, label = { Text("Tất cả") }) }
        item { FilterChip(selected = selected == true, onClick = { onSelect(true) }, label = { Text("Đang hoạt động") }) }
        item { FilterChip(selected = selected == false, onClick = { onSelect(false) }, label = { Text("Đã vô hiệu hóa") }) }
    }
}

@Composable
private fun CatalogListLayout(
    modifier: Modifier,
    search: String,
    placeholder: String,
    active: Boolean?,
    count: String,
    empty: Boolean,
    onSearch: (String) -> Unit,
    onFilter: (Boolean?) -> Unit,
    content: androidx.compose.foundation.lazy.LazyListScope.() -> Unit
) {
    Column(modifier.fillMaxSize()) {
        CatalogSearch(search, placeholder, onSearch)
        ActiveFilterRow(active, onFilter)
        Text(count, style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp))
        if (empty) EmptyScreen("Không tìm thấy dữ liệu phù hợp.", Modifier.weight(1f))
        else LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            content = content
        )
    }
}
