/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.presentation.auth

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.AdminPanelSettings
import androidx.compose.material.icons.rounded.Email
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.School
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.ui.components.UIGradePasswordTextField
import com.uigrade.ai.ui.components.UIGradeTextField
import com.uigrade.ai.ui.components.button.GradePrimaryButton
import com.uigrade.ai.ui.components.mascot.CatMascot
import com.uigrade.ai.ui.components.mascot.CatMascotState
import com.uigrade.ai.ui.components.mascot.CatMascotStyle
import kotlinx.coroutines.delay

@Composable
fun LoginScreen(
    onNavigateBack: () -> Unit,
    onNavigateToSignUp: () -> Unit,
    onLoginSuccess: (role: String) -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val focusManager = LocalFocusManager.current
    val scrollState = rememberScrollState()

    var contentVisible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { contentVisible = true }

    var mascotState by remember { mutableStateOf(CatMascotState.Idle) }
    var mascotMessage by remember { mutableStateOf<String?>("Chào bạn quay trở lại! Đăng nhập để tiếp tục nhé ✨") }

    // Sync mascot state with UI state
    LaunchedEffect(uiState.isLoading, uiState.error, uiState.loggedInUser) {
        when {
            uiState.loggedInUser != null -> {
                mascotState = CatMascotState.Success
                mascotMessage = "Đăng nhập thành công rồi! Đang chuyển hướng... 🎉"
            }
            uiState.error != null -> {
                mascotState = CatMascotState.Error
                mascotMessage = uiState.error
            }
            uiState.isLoading -> {
                mascotState = CatMascotState.Thinking
                mascotMessage = "Đang kiểm tra tài khoản, đợi mình chút nha..."
            }
        }
    }

    LaunchedEffect(uiState.loggedInUser) {
        uiState.loggedInUser?.let { user ->
            delay(900)
            onLoginSuccess(user.role.name)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .systemBarsPadding()
            .imePadding()
    ) {
        AnimatedVisibility(
            visible = contentVisible,
            enter = fadeIn(tween(400)) + slideInVertically(tween(400)) { it / 6 },
            modifier = Modifier.fillMaxSize()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .padding(horizontal = 24.dp, vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // ─── Top Bar with Back Navigation ──────────────────────────────────
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = onNavigateBack,
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.surface)
                            .shadow(2.dp, CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                            contentDescription = "Quay lại",
                            tint = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                // ─── Center Mascot & Speech Bubble ─────────────────────────────────
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(bottom = 12.dp)
                ) {
                    CatMascot(
                        state = mascotState,
                        style = CatMascotStyle.Default.copy(size = 145.dp),
                        message = mascotMessage,
                        onClick = {
                            mascotState = CatMascotState.Happy
                        }
                    )
                }

                // ─── Header Titles ─────────────────────────────────────────────────
                Text(
                    text = "Đăng nhập",
                    style = MaterialTheme.typography.headlineSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                )
                Text(
                    text = "Nhập thông tin để tiếp tục với UIGrade AI",
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    ),
                    modifier = Modifier.padding(top = 4.dp, bottom = 18.dp)
                )

                // ─── Form Card ─────────────────────────────────────────────────────
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        // Email Field
                        UIGradeTextField(
                            value = uiState.email,
                            onValueChange = viewModel::onEmailChange,
                            label = "Email",
                            placeholder = "example@gmail.com",
                            leadingIcon = Icons.Rounded.Email,
                            errorMessage = uiState.emailError,
                            isValid = android.util.Patterns.EMAIL_ADDRESS.matcher(uiState.email.trim()).matches(),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Email,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { focusManager.moveFocus(FocusDirection.Down) }
                            ),
                            modifier = Modifier.onFocusChanged {
                                if (it.isFocused && !uiState.isLoading && uiState.loggedInUser == null) {
                                    mascotState = CatMascotState.Listening
                                    mascotMessage = "Nhập email của bạn để nhận thông báo nhé ✉️"
                                }
                            }
                        )

                        // Password Field
                        UIGradePasswordTextField(
                            value = uiState.password,
                            onValueChange = viewModel::onPasswordChange,
                            label = "Mật khẩu",
                            placeholder = "Nhập mật khẩu",
                            leadingIcon = Icons.Rounded.Lock,
                            errorMessage = uiState.passwordError,
                            isValid = uiState.password.isNotBlank(),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(
                                onDone = {
                                    focusManager.clearFocus()
                                    viewModel.login()
                                }
                            ),
                            modifier = Modifier.onFocusChanged {
                                if (it.isFocused && !uiState.isLoading && uiState.loggedInUser == null) {
                                    mascotState = CatMascotState.Shy
                                    mascotMessage = "Mật khẩu đang được bảo mật an toàn nè 🔒"
                                }
                            }
                        )

                        Spacer(Modifier.height(4.dp))

                        // Submit Button
                        GradePrimaryButton(
                            text = "Đăng nhập",
                            onClick = {
                                focusManager.clearFocus()
                                viewModel.login()
                            },
                            isLoading = uiState.isLoading,
                            modifier = Modifier.fillMaxWidth()
                        )

                        // ─── Demo Account Quick Select ─────────────────────────────
                        HorizontalDivider(
                            modifier = Modifier.padding(vertical = 4.dp),
                            color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                        )

                        Text(
                            text = "Hoặc chọn tài khoản demo trải nghiệm:",
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontWeight = FontWeight.Medium
                            )
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Student Quick Fill
                            FilterChip(
                                selected = uiState.email == "student@uigrade.ai",
                                onClick = {
                                    viewModel.selectDemoAccount("student@uigrade.ai", "Sinh viên")
                                    mascotState = CatMascotState.Happy
                                    mascotMessage = "Đã chọn tài khoản Sinh viên mẫu 🎓"
                                },
                                label = { Text("Sinh viên", fontSize = 12.sp) },
                                leadingIcon = {
                                    Icon(Icons.Rounded.Person, contentDescription = null, modifier = Modifier.size(14.dp))
                                },
                                modifier = Modifier.weight(1f)
                            )

                            // Lecturer Quick Fill
                            FilterChip(
                                selected = uiState.email == "lecturer@uigrade.ai",
                                onClick = {
                                    viewModel.selectDemoAccount("lecturer@uigrade.ai", "Giảng viên")
                                    mascotState = CatMascotState.Excited
                                    mascotMessage = "Đã chọn tài khoản Giảng viên mẫu 👨‍🏫"
                                },
                                label = { Text("Giảng viên", fontSize = 12.sp) },
                                leadingIcon = {
                                    Icon(Icons.Rounded.School, contentDescription = null, modifier = Modifier.size(14.dp))
                                },
                                modifier = Modifier.weight(1f)
                            )

                            // Admin Quick Fill
                            FilterChip(
                                selected = uiState.email == "admin@uigrade.ai",
                                onClick = {
                                    viewModel.selectDemoAccount("admin@uigrade.ai", "Admin")
                                    mascotState = CatMascotState.Thinking
                                    mascotMessage = "Đã chọn tài khoản Quản trị viên ⚙️"
                                },
                                label = { Text("Admin", fontSize = 12.sp) },
                                leadingIcon = {
                                    Icon(Icons.Rounded.AdminPanelSettings, contentDescription = null, modifier = Modifier.size(14.dp))
                                },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }

                // ─── Footer ────────────────────────────────────────────────────────
                Row(
                    modifier = Modifier.padding(top = 20.dp, bottom = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "Chưa có tài khoản? ",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                    Text(
                        text = "Đăng ký ngay",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        ),
                        modifier = Modifier.clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            onClick = onNavigateToSignUp
                        )
                    )
                }
            }
        }
    }
}
