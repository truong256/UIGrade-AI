package com.uigrade.ai.presentation.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.data.mock.MockData
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.ui.components.*

// ─── User Management ──────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserManagementScreen(
    onNavigateBack: () -> Unit,
    viewModel: UserManagementViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        topBar = { TopAppBar(title = { Text("Quản lý người dùng") }, navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Back") } }) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.error != null -> ErrorScreen(uiState.error!!, modifier = Modifier.padding(padding))
            else -> LazyColumn(modifier = Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                item { Text("${uiState.users.size} người dùng", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold) }
                items(uiState.users) { user ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(user.name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                                Text(user.email, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Surface(color = when(user.role) {
                                UserRole.ADMIN -> MaterialTheme.colorScheme.errorContainer
                                UserRole.LECTURER -> MaterialTheme.colorScheme.secondaryContainer
                                UserRole.STUDENT -> MaterialTheme.colorScheme.primaryContainer
                            }, shape = MaterialTheme.shapes.extraSmall) {
                                Text(user.role.name, style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(6.dp, 3.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─── Rubric Admin ─────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RubricAdminScreen(onNavigateBack: () -> Unit, viewModel: com.uigrade.ai.presentation.lecturer.RubricManagementViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(topBar = { TopAppBar(title = { Text("Quản lý Rubric (Admin)") }, navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Back") } }) }) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            else -> LazyColumn(modifier = Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(uiState.rubrics) { rubric ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(rubric.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                            Text("${rubric.criteria.size} tiêu chí · v${rubric.version}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
        }
    }
}

// ─── Rule Management ──────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RuleManagementScreen(onNavigateBack: () -> Unit) {
    val allRules = remember { MockData.typographyRules + MockData.colorRules + MockData.layoutRules + MockData.spacingRules + MockData.accessibilityRules }
    Scaffold(topBar = { TopAppBar(title = { Text("Quản lý Rules") }, navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Back") } }) }) { padding ->
        LazyColumn(modifier = Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item { Text("${allRules.size} rules tổng cộng", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold) }
            items(allRules) { rule -> RuleCard(rule) }
        }
    }
}

// ─── Metric Management ────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MetricManagementScreen(onNavigateBack: () -> Unit) {
    val allMetrics = remember { MockData.gradingResult1.criteriaScores.flatMap { it.metrics } }
    Scaffold(topBar = { TopAppBar(title = { Text("Quản lý Metrics") }, navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Back") } }) }) { padding ->
        LazyColumn(modifier = Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item { Text("${allMetrics.size} metrics", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold) }
            items(allMetrics) { metric -> MetricCard(metric) }
        }
    }
}

// ─── System Logs ─────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SystemLogsScreen(onNavigateBack: () -> Unit, viewModel: SystemLogsViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(topBar = { TopAppBar(title = { Text("System Logs") }, navigationIcon = { IconButton(onClick = onNavigateBack) { Icon(Icons.Default.ArrowBack, "Back") } }) }) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            else -> LazyColumn(modifier = Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(uiState.logs) { log ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Top) {
                            LogLevelBadge(log.level)
                            Column(modifier = Modifier.weight(1f)) {
                                Text("[${log.tag}] ${log.message}", style = MaterialTheme.typography.bodySmall)
                                Text(log.timestamp, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }
    }
}
