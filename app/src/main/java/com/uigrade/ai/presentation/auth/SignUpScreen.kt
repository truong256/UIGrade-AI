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
import androidx.compose.material.icons.rounded.Email
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.LockReset
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.ui.components.UIGradeButton
import com.uigrade.ai.ui.components.UIGradePasswordTextField
import com.uigrade.ai.ui.components.UIGradeTextField
import com.uigrade.ai.ui.components.mascot.GuideBubble
import com.uigrade.ai.ui.components.mascot.UIGradeCatMascot
import com.uigrade.ai.ui.theme.Primary
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

    var contentVisible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { contentVisible = true }

    LaunchedEffect(uiState.registeredUser) {
        uiState.registeredUser?.let { user ->
            delay(1200) // Let user see the happy mascot pose and guide message
            onSignUpSuccess(user.role.name)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.background,
                        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                        MaterialTheme.colorScheme.background
                    )
                )
            )
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

                // ─── Mascot Header & Guide Bubble ─────────────────────────────────
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(bottom = 14.dp)
                ) {
                    UIGradeCatMascot(
                        pose = uiState.catPose,
                        size = 135.dp,
                        showAura = true
                    )

                    Spacer(Modifier.height(10.dp))

                    GuideBubble(
                        text = uiState.guideText,
                        isError = uiState.isGuideError,
                        isSuccess = uiState.isSuccess,
                        modifier = Modifier.fillMaxWidth(0.95f)
                    )
                }

                // ─── Header Titles ─────────────────────────────────────────────────
                Text(
                    text = "Tạo tài khoản",
                    style = MaterialTheme.typography.headlineSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                )
                Text(
                    text = "Mèo UIGrade sẽ giúp bạn bắt đầu chỉ trong vài bước",
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
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        // Name Field
                        UIGradeTextField(
                            value = uiState.name,
                            onValueChange = viewModel::onNameChange,
                            label = "Tên người dùng",
                            placeholder = "Nhập tên của bạn",
                            leadingIcon = Icons.Rounded.Person,
                            errorMessage = uiState.nameError,
                            isValid = uiState.name.trim().length >= 2,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Text,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { focusManager.moveFocus(FocusDirection.Down) }
                            ),
                            modifier = Modifier.onFocusChanged {
                                if (it.isFocused) viewModel.onFieldFocused("name")
                            }
                        )

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
                                if (it.isFocused) viewModel.onFieldFocused("email")
                            }
                        )

                        // Password Field
                        UIGradePasswordTextField(
                            value = uiState.password,
                            onValueChange = viewModel::onPasswordChange,
                            label = "Mật khẩu",
                            placeholder = "Tối thiểu 8 ký tự",
                            leadingIcon = Icons.Rounded.Lock,
                            errorMessage = uiState.passwordError,
                            isValid = uiState.password.length >= 8,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { focusManager.moveFocus(FocusDirection.Down) }
                            ),
                            modifier = Modifier.onFocusChanged {
                                if (it.isFocused) viewModel.onFieldFocused("password")
                            }
                        )

                        // Confirm Password Field
                        UIGradePasswordTextField(
                            value = uiState.confirmPassword,
                            onValueChange = viewModel::onConfirmPasswordChange,
                            label = "Xác nhận mật khẩu",
                            placeholder = "Nhập lại mật khẩu",
                            leadingIcon = Icons.Rounded.LockReset,
                            errorMessage = uiState.confirmPasswordError,
                            isValid = uiState.confirmPassword.isNotEmpty() && uiState.confirmPassword == uiState.password,
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
                                if (it.isFocused) viewModel.onFieldFocused("confirmPassword")
                            }
                        )

                        Spacer(Modifier.height(4.dp))

                        // Submit Button
                        UIGradeButton(
                            text = "Tạo tài khoản",
                            onClick = {
                                focusManager.clearFocus()
                                viewModel.signUp()
                            },
                            isLoading = uiState.isLoading,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }

                // ─── Footer ────────────────────────────────────────────────────────
                Row(
                    modifier = Modifier.padding(top = 20.dp, bottom = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "Đã có tài khoản? ",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                    Text(
                        text = "Đăng nhập",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Primary
                        ),
                        modifier = Modifier.clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            onClick = onNavigateToLogin
                        )
                    )
                }
            }
        }
    }
}
