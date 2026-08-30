/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.presentation.auth

import androidx.compose.animation.*
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.R
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.ui.components.button.GradePrimaryButton
import com.uigrade.ai.ui.components.mascot.CatMascot
import com.uigrade.ai.ui.components.mascot.CatMascotState
import com.uigrade.ai.ui.components.mascot.CatMascotStyle
import kotlinx.coroutines.delay

@Composable
fun SignUpScreen(
    onNavigateBack: () -> Unit,
    onNavigateToLogin: () -> Unit,
    onSignUpSuccess: (role: String) -> Unit,
    viewModel: SignUpViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val focusManager = LocalFocusManager.current
    val scrollState = rememberScrollState()
    val snackbarHostState = remember { SnackbarHostState() }

    var contentVisible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        contentVisible = true
    }

    var mascotState by remember { mutableStateOf(CatMascotState.Idle) }
    var mascotMessage by remember { mutableStateOf<String?>("Đăng ký để bắt đầu trải nghiệm cùng UIGrade AI ✨") }

    // Sync mascot with UI state changes
    LaunchedEffect(uiState.isLoading, uiState.generalError, uiState.registeredUser) {
        when {
            uiState.registeredUser != null -> {
                mascotState = CatMascotState.Success
                mascotMessage = "Tài khoản của bạn đã sẵn sàng! 🎉"
            }
            uiState.generalError != null -> {
                mascotState = CatMascotState.Error
                mascotMessage = uiState.generalError
            }
            uiState.isLoading -> {
                mascotState = CatMascotState.Thinking
                mascotMessage = "Đang kiểm tra và khởi tạo tài khoản..."
            }
        }
    }

    val successMessage = stringResource(R.string.register_success_msg)
    LaunchedEffect(uiState.registeredUser) {
        uiState.registeredUser?.let { user ->
            snackbarHostState.showSnackbar(successMessage)
            delay(900)
            onSignUpSuccess(user.role.name)
        }
    }

    LaunchedEffect(uiState.generalError) {
        uiState.generalError?.let { err ->
            snackbarHostState.showSnackbar(err)
            viewModel.clearGeneralError()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .systemBarsPadding()
                .imePadding()
        ) {
            AnimatedVisibility(
                visible = contentVisible,
                enter = fadeIn(tween(350)) + slideInVertically(tween(350)) { 24 },
                modifier = Modifier.fillMaxSize()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState)
                        .padding(horizontal = 24.dp, vertical = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Spacer(Modifier.height(4.dp))

                    // ─── Center: Mascot Header ─────────────────────────────────────
                    CatMascot(
                        state = mascotState,
                        style = CatMascotStyle.Default.copy(size = 135.dp),
                        message = mascotMessage,
                        onClick = {
                            mascotState = CatMascotState.Happy
                        }
                    )

                    Spacer(Modifier.height(10.dp))

                    // ─── Header: Titles ───────────────────────────────────────────
                    Text(
                        text = stringResource(R.string.register_title),
                        style = MaterialTheme.typography.headlineSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        ),
                        textAlign = TextAlign.Center
                    )

                    Spacer(Modifier.height(4.dp))

                    Text(
                        text = stringResource(R.string.register_subtitle),
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        ),
                        textAlign = TextAlign.Center
                    )

                    Spacer(Modifier.height(20.dp))

                    // ─── Role Selection Section: "Bạn là ai?" ─────────────────────
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = stringResource(R.string.register_who_are_you),
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Option: Sinh viên
                            RoleSelectionCard(
                                title = stringResource(R.string.role_student),
                                isSelected = uiState.role == UserRole.STUDENT,
                                onClick = {
                                    viewModel.onRoleChange(UserRole.STUDENT)
                                    mascotState = CatMascotState.Happy
                                    mascotMessage = "Chào mừng bạn đến lớp học! 🎓"
                                },
                                modifier = Modifier.weight(1f)
                            )

                            // Option: Giảng viên
                            RoleSelectionCard(
                                title = stringResource(R.string.role_lecturer),
                                isSelected = uiState.role == UserRole.LECTURER,
                                onClick = {
                                    viewModel.onRoleChange(UserRole.LECTURER)
                                    mascotState = CatMascotState.Excited
                                    mascotMessage = "Cùng tạo một lớp học thật tuyệt nhé! 👨‍🏫"
                                },
                                modifier = Modifier.weight(1f)
                            )
                        }

                        // Role selection error
                        AnimatedVisibility(
                            visible = uiState.roleError != null,
                            enter = fadeIn(tween(200)) + expandVertically(),
                            exit = fadeOut(tween(200)) + shrinkVertically()
                        ) {
                            Text(
                                text = uiState.roleError.orEmpty(),
                                color = MaterialTheme.colorScheme.error,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(start = 4.dp, top = 2.dp)
                            )
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    // ─── Form Inputs ───────────────────────────────────────────────
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        // 1. Full Name Field
                        RegistrationInputField(
                            value = uiState.name,
                            onValueChange = viewModel::onNameChange,
                            label = stringResource(R.string.label_full_name),
                            placeholder = stringResource(R.string.placeholder_full_name),
                            errorMessage = uiState.nameError,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Text,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { focusManager.moveFocus(FocusDirection.Down) }
                            ),
                            modifier = Modifier.onFocusChanged {
                                if (it.isFocused && !uiState.isLoading && uiState.registeredUser == null) {
                                    mascotState = CatMascotState.Listening
                                    mascotMessage = "Hãy cho mình biết tên của bạn nhé 🐾"
                                }
                            }
                        )

                        // 2. Email Field
                        RegistrationInputField(
                            value = uiState.email,
                            onValueChange = viewModel::onEmailChange,
                            label = stringResource(R.string.label_email),
                            placeholder = stringResource(R.string.placeholder_email),
                            errorMessage = uiState.emailError,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Email,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { focusManager.moveFocus(FocusDirection.Down) }
                            ),
                            modifier = Modifier.onFocusChanged {
                                if (it.isFocused && !uiState.isLoading && uiState.registeredUser == null) {
                                    mascotState = CatMascotState.Listening
                                    mascotMessage = "Nhập email của bạn nhé ✉️"
                                }
                            }
                        )

                        // 3. Password Field
                        RegistrationInputField(
                            value = uiState.password,
                            onValueChange = viewModel::onPasswordChange,
                            label = stringResource(R.string.label_password),
                            placeholder = stringResource(R.string.placeholder_password),
                            errorMessage = uiState.passwordError,
                            isPassword = true,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { focusManager.moveFocus(FocusDirection.Down) }
                            ),
                            modifier = Modifier.onFocusChanged {
                                if (it.isFocused && !uiState.isLoading && uiState.registeredUser == null) {
                                    mascotState = CatMascotState.Shy
                                    mascotMessage = "Mật khẩu tối thiểu 8 ký tự để bảo mật nha 🔒"
                                }
                            }
                        )

                        // 4. Confirm Password Field
                        RegistrationInputField(
                            value = uiState.confirmPassword,
                            onValueChange = viewModel::onConfirmPasswordChange,
                            label = stringResource(R.string.label_confirm_password),
                            placeholder = stringResource(R.string.placeholder_confirm_password),
                            errorMessage = uiState.confirmPasswordError,
                            isPassword = true,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(
                                onDone = {
                                    focusManager.clearFocus()
                                    viewModel.signUp()
                                }
                            ),
                            modifier = Modifier.onFocusChanged {
                                if (it.isFocused && !uiState.isLoading && uiState.registeredUser == null) {
                                    mascotState = CatMascotState.Listening
                                    mascotMessage = "Nhập lại mật khẩu để xác nhận nha ✨"
                                }
                            }
                        )
                    }

                    Spacer(Modifier.height(24.dp))

                    // ─── Register Button ──────────────────────────────────────────
                    GradePrimaryButton(
                        text = if (uiState.isLoading) stringResource(R.string.btn_registering) else stringResource(R.string.btn_register),
                        isLoading = uiState.isLoading,
                        onClick = {
                            focusManager.clearFocus()
                            mascotState = CatMascotState.Thinking
                            viewModel.signUp()
                        },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(Modifier.height(20.dp))

                    // ─── Footer: Already have account? Login ───────────────────────
                    Row(
                        modifier = Modifier.padding(bottom = 16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = stringResource(R.string.already_have_account) + " ",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = stringResource(R.string.login_action),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null,
                                onClick = onNavigateToLogin
                            )
                        )
                    }

                    Spacer(Modifier.height(12.dp))
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE SELECTION CARD (Text-based, Material 3 Theme reactive)
// ═══════════════════════════════════════════════════════════════════════════════
@Composable
private fun RoleSelectionCard(
    title: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.97f else 1.0f,
        animationSpec = tween(durationMillis = 120),
        label = "roleCardScale"
    )

    val animatedBgColor by animateColorAsState(
        targetValue = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface,
        animationSpec = tween(durationMillis = 200),
        label = "roleCardBg"
    )

    val animatedBorderColor by animateColorAsState(
        targetValue = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
        animationSpec = tween(durationMillis = 200),
        label = "roleCardBorder"
    )

    val animatedTextColor by animateColorAsState(
        targetValue = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface,
        animationSpec = tween(durationMillis = 200),
        label = "roleCardText"
    )

    Surface(
        onClick = onClick,
        interactionSource = interactionSource,
        shape = RoundedCornerShape(14.dp),
        color = animatedBgColor,
        modifier = modifier
            .height(50.dp)
            .scale(scale)
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                color = animatedBorderColor,
                shape = RoundedCornerShape(14.dp)
            )
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = animatedTextColor,
                textAlign = TextAlign.Center
            )
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRATION INPUT FIELD (Outlined, Theme-Driven)
// ═══════════════════════════════════════════════════════════════════════════════
@Composable
private fun RegistrationInputField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String,
    errorMessage: String? = null,
    isPassword: Boolean = false,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    modifier: Modifier = Modifier
) {
    val isError = errorMessage != null

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = {
                Text(
                    text = label,
                    fontSize = 14.sp
                )
            },
            placeholder = {
                Text(
                    text = placeholder,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                )
            },
            isError = isError,
            singleLine = true,
            visualTransformation = if (isPassword) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
            keyboardOptions = keyboardOptions,
            keyboardActions = keyboardActions,
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                focusedLabelColor = MaterialTheme.colorScheme.primary,
                unfocusedLabelColor = MaterialTheme.colorScheme.onSurfaceVariant,
                errorBorderColor = MaterialTheme.colorScheme.error,
                errorLabelColor = MaterialTheme.colorScheme.error,
                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                focusedContainerColor = MaterialTheme.colorScheme.surface,
                unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                errorContainerColor = MaterialTheme.colorScheme.surface
            ),
            modifier = Modifier.fillMaxWidth()
        )

        // Animated error message below the input field
        AnimatedVisibility(
            visible = isError,
            enter = fadeIn(tween(180)) + expandVertically(),
            exit = fadeOut(tween(180)) + shrinkVertically()
        ) {
            Text(
                text = errorMessage.orEmpty(),
                color = MaterialTheme.colorScheme.error,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(start = 6.dp, top = 2.dp)
            )
        }
    }
}
