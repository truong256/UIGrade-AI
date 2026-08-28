package com.uigrade.ai.presentation.student

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.ui.components.ErrorScreen
import com.uigrade.ai.ui.components.LoadingScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentProfileScreen(
    onNavigateBack: () -> Unit,
    onNavigateToChangePassword: () -> Unit,
    onLogout: () -> Unit,
    viewModel: StudentProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var confirmLogout by remember { mutableStateOf(false) }
    LaunchedEffect(uiState.message, uiState.error) {
        val message = uiState.message ?: uiState.error
        if (message != null && !uiState.isLoading) { snackbar.showSnackbar(message); viewModel.consumeMessage() }
    }
    if (confirmLogout) {
        AlertDialog(
            onDismissRequest = { confirmLogout = false },
            title = { Text("Đăng xuất?") },
            text = { Text("Phiên đăng nhập trên thiết bị sẽ được kết thúc.") },
            confirmButton = {
                Button(onClick = { confirmLogout = false; viewModel.logout(onLogout) }) { Text("Đăng xuất") }
            },
            dismissButton = { TextButton(onClick = { confirmLogout = false }) { Text("Hủy") } }
        )
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Hồ sơ Sinh viên") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    if (uiState.user != null) {
                        IconButton(onClick = { viewModel.setEditing(!uiState.isEditing) }, enabled = !uiState.isSaving) {
                            Icon(Icons.Default.Edit, contentDescription = if (uiState.isEditing) "Hủy chỉnh sửa" else "Chỉnh sửa hồ sơ")
                        }
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) }
    ) { padding ->
        when {
            uiState.isLoading -> LoadingScreen(Modifier.padding(padding))
            uiState.user == null -> ErrorScreen(
                uiState.error ?: "Không thể tải hồ sơ.",
                onRetry = viewModel::load,
                modifier = Modifier.padding(padding)
            )
            else -> Column(
                Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).imePadding().padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Surface(
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.size(88.dp)
                ) {
                    Text(
                        uiState.name.trim().firstOrNull()?.uppercase() ?: "S",
                        modifier = Modifier.padding(top = 22.dp),
                        textAlign = TextAlign.Center,
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(uiState.user?.email.orEmpty(), style = MaterialTheme.typography.bodyMedium)

                ProfileField("Họ và tên", uiState.name, uiState.isEditing, viewModel::updateName)
                ProfileField("Mã sinh viên", uiState.studentId, uiState.isEditing, viewModel::updateStudentId)
                ProfileField("Số điện thoại", uiState.phone, uiState.isEditing, viewModel::updatePhone)
                ProfileField("Khoa / ngành", uiState.department, uiState.isEditing, viewModel::updateDepartment)
                ProfileField("Trường / tổ chức", uiState.organization, uiState.isEditing, viewModel::updateOrganization)
                ProfileField("Giới thiệu", uiState.bio, uiState.isEditing, viewModel::updateBio, singleLine = false)

                if (uiState.isEditing) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedButton(onClick = { viewModel.setEditing(false) }, modifier = Modifier.weight(1f)) { Text("Hủy") }
                        Button(onClick = viewModel::save, enabled = !uiState.isSaving, modifier = Modifier.weight(1f)) {
                            if (uiState.isSaving) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                            else Icon(Icons.Default.Save, contentDescription = null)
                            Text("Lưu")
                        }
                    }
                }
                OutlinedButton(onClick = onNavigateToChangePassword, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Default.Lock, contentDescription = null)
                    Text("Đổi mật khẩu")
                }
                OutlinedButton(
                    onClick = { confirmLogout = true },
                    enabled = !uiState.isLoggingOut,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null)
                    Text("Đăng xuất")
                }
                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun ProfileField(
    label: String,
    value: String,
    editing: Boolean,
    onValueChange: (String) -> Unit,
    singleLine: Boolean = true
) {
    if (editing) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text(label) },
            singleLine = singleLine,
            minLines = if (singleLine) 1 else 3,
            modifier = Modifier.fillMaxWidth()
        )
    } else {
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(14.dp)) {
                Text(label, style = MaterialTheme.typography.labelSmall)
                Text(value.ifBlank { "Chưa cập nhật" })
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentChangePasswordScreen(
    onNavigateBack: () -> Unit,
    viewModel: StudentPasswordViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(uiState.success) { if (uiState.success) onNavigateBack() }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Đổi mật khẩu") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).imePadding().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            PasswordField("Mật khẩu hiện tại", uiState.currentPassword, viewModel::updateCurrent)
            PasswordField("Mật khẩu mới", uiState.newPassword, viewModel::updateNew)
            PasswordField("Xác nhận mật khẩu mới", uiState.confirmPassword, viewModel::updateConfirm)
            Text("Mật khẩu mới cần ít nhất 8 ký tự và phải khác mật khẩu hiện tại.", style = MaterialTheme.typography.bodySmall)
            uiState.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            Button(
                onClick = viewModel::submit,
                enabled = !uiState.isSubmitting,
                modifier = Modifier.fillMaxWidth().height(52.dp)
            ) {
                if (uiState.isSubmitting) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                else Text("Cập nhật mật khẩu")
            }
        }
    }
}

@Composable
private fun PasswordField(label: String, value: String, onValueChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        visualTransformation = PasswordVisualTransformation(),
        singleLine = true,
        modifier = Modifier.fillMaxWidth()
    )
}
