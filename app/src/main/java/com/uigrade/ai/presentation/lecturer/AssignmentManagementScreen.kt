package com.uigrade.ai.presentation.lecturer

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.uigrade.ai.domain.usecase.GetAssignmentsForLecturerUseCase
import com.uigrade.ai.domain.usecase.GetCurrentUserUseCase
import com.uigrade.ai.ui.components.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.format.DateTimeFormatter
import javax.inject.Inject

// ─── VM ──────────────────────────────────────────────────────────────────────
@HiltViewModel
class AssignmentManagementViewModel @Inject constructor(
    private val getCurrentUserUseCase: GetCurrentUserUseCase,
    private val getAssignmentsForLecturerUseCase: GetAssignmentsForLecturerUseCase
) : ViewModel() {
    private val _assignments = MutableStateFlow<List<Assignment>>(emptyList())
    val assignments: StateFlow<List<Assignment>> = _assignments.asStateFlow()
    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        viewModelScope.launch {
            val user = getCurrentUserUseCase()
            _assignments.value = if (user != null) getAssignmentsForLecturerUseCase(user.id) else emptyList()
            _isLoading.value = false
        }
    }
}

// ─── Screen ──────────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignmentManagementScreen(
    onNavigateBack: () -> Unit,
    onNavigateToSubmissions: (String) -> Unit,
    viewModel: AssignmentManagementViewModel = hiltViewModel()
) {
    val assignments by viewModel.assignments.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Quản lý bài tập", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Quay lại")
                    }
                }
            )
        }
    ) { padding ->
        when {
            isLoading -> LoadingScreen(Modifier.padding(padding))
            assignments.isEmpty() -> EmptyScreen("Chưa có bài tập nào", Modifier.padding(padding))
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(assignments) { assignment ->
                    AssignmentManagementCard(assignment, fmt, onViewSubmissions = { onNavigateToSubmissions(assignment.id) })
                }
            }
        }
    }
}

@Composable
private fun AssignmentManagementCard(assignment: Assignment, fmt: DateTimeFormatter, onViewSubmissions: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(assignment.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
            Text("Deadline: ${assignment.deadline.format(fmt)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(assignment.description, style = MaterialTheme.typography.bodySmall, maxLines = 2, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth()) {
                TextButton(onClick = onViewSubmissions) {
                    Icon(Icons.AutoMirrored.Filled.List, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Xem bài nộp")
                }
            }
        }
    }
}
