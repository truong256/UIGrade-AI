package com.uigrade.ai.presentation.auth

import androidx.compose.animation.*
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.isSystemInDarkTheme
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
import com.uigrade.ai.ui.theme.*
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
    val isDark = isSystemInDarkTheme()
    val snackbarHostState = remember { SnackbarHostState() }

    // Colors according to blue specification
    val primaryColor = if (isDark) AuthBluePrimaryDarkTheme else AuthBluePrimary
    val primaryDarkColor = AuthBluePrimaryDark
    val backgroundColor = if (isDark) AuthBlueBackgroundDarkTheme else AuthBlueBackgroundLight
    val surfaceColor = if (isDark) AuthBlueSurfaceDarkTheme else AuthBlueSurface
    val textPrimaryColor = if (isDark) AuthBlueTextPrimaryDarkTheme else AuthBlueTextPrimary
    val textSecondaryColor = if (isDark) AuthBlueTextSecondaryDarkTheme else AuthBlueTextSecondary
    val borderColor = if (isDark) AuthBlueBorderDarkTheme else AuthBlueBorder
    val errorColor = AuthBlueError

    var contentVisible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        contentVisible = true
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
        containerColor = backgroundColor
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
                        .padding(horizontal = 24.dp, vertical = 20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Spacer(Modifier.height(8.dp))

                    // ─── App Brand Title ──────────────────────────────────────────
                    Text(
                        text = stringResource(R.string.app_name),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = primaryColor,
                        letterSpacing = 0.5.sp,
                        textAlign = TextAlign.Center
                    )

                    Spacer(Modifier.height(16.dp))

                    // ─── Header: Titles ───────────────────────────────────────────
                    Text(
                        text = stringResource(R.string.register_title),
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = textPrimaryColor,
                        textAlign = TextAlign.Center
                    )

                    Spacer(Modifier.height(6.dp))

                    Text(
                        text = stringResource(R.string.register_subtitle),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Normal,
                        color = textSecondaryColor,
                        textAlign = TextAlign.Center
                    )

                    Spacer(Modifier.height(24.dp))

                    // ─── Role Selection Section: "Bạn là ai?" ─────────────────────
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = stringResource(R.string.register_who_are_you),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = textPrimaryColor
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Option: Sinh viên
                            RoleSelectionCard(
                                title = stringResource(R.string.role_student),
                                isSelected = uiState.role == UserRole.STUDENT,
                                onClick = { viewModel.onRoleChange(UserRole.STUDENT) },
                                primaryColor = primaryColor,
                                primaryDarkColor = primaryDarkColor,
                                surfaceColor = surfaceColor,
                                textPrimaryColor = textPrimaryColor,
                                textSecondaryColor = textSecondaryColor,
                                borderColor = borderColor,
                                modifier = Modifier.weight(1f)
                            )

                            // Option: Giảng viên
                            RoleSelectionCard(
                                title = stringResource(R.string.role_lecturer),
                                isSelected = uiState.role == UserRole.LECTURER,
                                onClick = { viewModel.onRoleChange(UserRole.LECTURER) },
                                primaryColor = primaryColor,
                                primaryDarkColor = primaryDarkColor,
                                surfaceColor = surfaceColor,
                                textPrimaryColor = textPrimaryColor,
                                textSecondaryColor = textSecondaryColor,
                                borderColor = borderColor,
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
                                color = errorColor,
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
                            primaryColor = primaryColor,
                            surfaceColor = surfaceColor,
                            textPrimaryColor = textPrimaryColor,
                            textSecondaryColor = textSecondaryColor,
                            borderColor = borderColor,
                            errorColor = errorColor
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
                            primaryColor = primaryColor,
                            surfaceColor = surfaceColor,
                            textPrimaryColor = textPrimaryColor,
                            textSecondaryColor = textSecondaryColor,
                            borderColor = borderColor,
                            errorColor = errorColor
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
                            primaryColor = primaryColor,
                            surfaceColor = surfaceColor,
                            textPrimaryColor = textPrimaryColor,
                            textSecondaryColor = textSecondaryColor,
                            borderColor = borderColor,
                            errorColor = errorColor
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
                            primaryColor = primaryColor,
                            surfaceColor = surfaceColor,
                            textPrimaryColor = textPrimaryColor,
                            textSecondaryColor = textSecondaryColor,
                            borderColor = borderColor,
                            errorColor = errorColor
                        )
                    }

                    Spacer(Modifier.height(24.dp))

                    // ─── Register Button ──────────────────────────────────────────
                    InteractiveRegisterButton(
                        text = if (uiState.isLoading) stringResource(R.string.btn_registering) else stringResource(R.string.btn_register),
                        isLoading = uiState.isLoading,
                        onClick = {
                            focusManager.clearFocus()
                            viewModel.signUp()
                        },
                        primaryColor = primaryColor,
                        primaryDarkColor = primaryDarkColor,
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
                            color = textSecondaryColor
                        )
                        Text(
                            text = stringResource(R.string.login_action),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = primaryColor,
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
// ROLE SELECTION CARD (Pure Text & Blue Animation, Zero Icons)
// ═══════════════════════════════════════════════════════════════════════════════
@Composable
private fun RoleSelectionCard(
    title: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    primaryColor: Color,
    primaryDarkColor: Color,
    surfaceColor: Color,
    textPrimaryColor: Color,
    textSecondaryColor: Color,
    borderColor: Color,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    // Smooth subtle scale animation when pressed (1.0 -> 0.97 -> 1.0)
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.97f else 1.0f,
        animationSpec = tween(durationMillis = 120),
        label = "roleCardScale"
    )

    // Smooth background color animation
    val animatedBgColor by animateColorAsState(
        targetValue = if (isSelected) primaryColor else surfaceColor,
        animationSpec = tween(durationMillis = 200),
        label = "roleCardBg"
    )

    // Smooth border color animation
    val animatedBorderColor by animateColorAsState(
        targetValue = if (isSelected) primaryDarkColor else borderColor,
        animationSpec = tween(durationMillis = 200),
        label = "roleCardBorder"
    )

    // Smooth text color animation
    val animatedTextColor by animateColorAsState(
        targetValue = if (isSelected) Color.White else textPrimaryColor,
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
// REGISTRATION INPUT FIELD (Minimalist, Outlined, Zero Icons)
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
    primaryColor: Color,
    surfaceColor: Color,
    textPrimaryColor: Color,
    textSecondaryColor: Color,
    borderColor: Color,
    errorColor: Color,
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
                    color = textSecondaryColor.copy(alpha = 0.7f)
                )
            },
            isError = isError,
            singleLine = true,
            visualTransformation = if (isPassword) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
            keyboardOptions = keyboardOptions,
            keyboardActions = keyboardActions,
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = primaryColor,
                unfocusedBorderColor = borderColor,
                focusedLabelColor = primaryColor,
                unfocusedLabelColor = textSecondaryColor,
                errorBorderColor = errorColor,
                errorLabelColor = errorColor,
                focusedTextColor = textPrimaryColor,
                unfocusedTextColor = textPrimaryColor,
                focusedContainerColor = surfaceColor,
                unfocusedContainerColor = surfaceColor,
                errorContainerColor = surfaceColor
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
                color = errorColor,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(start = 6.dp, top = 2.dp)
            )
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE REGISTER BUTTON (Blue Theme, Press Scale, Zero Icons)
// ═══════════════════════════════════════════════════════════════════════════════
@Composable
private fun InteractiveRegisterButton(
    text: String,
    isLoading: Boolean,
    onClick: () -> Unit,
    primaryColor: Color,
    primaryDarkColor: Color,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    // Smooth subtle scale animation when pressed (1.0 -> 0.98 -> 1.0)
    val scale by animateFloatAsState(
        targetValue = if (isPressed && !isLoading) 0.98f else 1.0f,
        animationSpec = tween(durationMillis = 100),
        label = "btnScale"
    )

    val buttonBgColor by animateColorAsState(
        targetValue = if (isPressed) primaryDarkColor else primaryColor,
        animationSpec = tween(durationMillis = 150),
        label = "btnBgColor"
    )

    Button(
        onClick = onClick,
        enabled = !isLoading,
        interactionSource = interactionSource,
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = buttonBgColor,
            disabledContainerColor = primaryColor.copy(alpha = 0.65f),
            contentColor = Color.White,
            disabledContentColor = Color.White.copy(alpha = 0.85f)
        ),
        modifier = modifier
            .height(54.dp)
            .scale(scale)
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                color = Color.White,
                strokeWidth = 2.5.dp,
                modifier = Modifier.size(20.dp)
            )
            Spacer(Modifier.width(10.dp))
            Text(
                text = text,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        } else {
            Text(
                text = text,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}
