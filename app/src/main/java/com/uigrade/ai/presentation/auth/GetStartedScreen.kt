package com.uigrade.ai.presentation.auth

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.School
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.uigrade.ai.ui.components.button.GradePrimaryButton
import com.uigrade.ai.ui.components.mascot.CatMascot
import com.uigrade.ai.ui.components.mascot.CatMascotState
import com.uigrade.ai.ui.components.mascot.CatMascotStyle
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun GetStartedScreen(
    onNavigateToSignUp: () -> Unit,
    onNavigateToLogin: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var contentVisible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { contentVisible = true }

    var mascotState by remember { mutableStateOf(CatMascotState.Greeting) }
    var mascotMessage by remember { mutableStateOf("Chào bạn! Mình là Mèo UIGrade, trợ lý đồng hành học tập cùng bạn ✨") }
    var isNavigating by remember { mutableStateOf(false) }

    var totalDrag by remember { mutableFloatStateOf(0f) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .pointerInput(Unit) {
                detectHorizontalDragGestures(
                    onDragEnd = {
                        if (totalDrag < -100f && !isNavigating) {
                            isNavigating = true
                            onNavigateToSignUp()
                        }
                        totalDrag = 0f
                    },
                    onDragCancel = { totalDrag = 0f },
                    onHorizontalDrag = { _, dragAmount ->
                        totalDrag += dragAmount
                    }
                )
            }
            .systemBarsPadding()
    ) {
        AnimatedVisibility(
            visible = contentVisible,
            enter = fadeIn(tween(500)) + slideInVertically(tween(500)) { it / 5 },
            modifier = Modifier.fillMaxSize()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp, vertical = 20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                // ─── Header: App Branding ──────────────────────────────────────────
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(top = 12.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(MaterialTheme.colorScheme.primaryContainer)
                            .padding(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.School,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "UIGrade AI",
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                letterSpacing = 0.5.sp
                            )
                        )
                    }
                }

                // ─── Center: Cat Mascot & Guide Bubble ─────────────────────────────
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(vertical = 20.dp)
                ) {
                    CatMascot(
                        state = mascotState,
                        style = CatMascotStyle.Default.copy(size = 175.dp),
                        message = mascotMessage,
                        onClick = {
                            mascotState = CatMascotState.Excited
                        }
                    )

                    Spacer(Modifier.height(18.dp))

                    Text(
                        text = "Học tập thông minh cùng\ntrợ lý AI thân thiện",
                        style = MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                            fontSize = 24.sp,
                            lineHeight = 32.sp
                        ),
                        textAlign = TextAlign.Center
                    )

                    Spacer(Modifier.height(10.dp))

                    Text(
                        text = "Quản lý bài tập, theo dõi kết quả chấm điểm chuẩn xác và nhận phản hồi chi tiết trong một không gian học tập trực quan.",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            lineHeight = 22.sp
                        ),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 12.dp)
                    )
                }

                // ─── Bottom Actions ────────────────────────────────────────────────
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp)
                ) {
                    GradePrimaryButton(
                        text = "Bắt đầu ngay",
                        isLoading = isNavigating,
                        onClick = {
                            if (!isNavigating) {
                                coroutineScope.launch {
                                    isNavigating = true
                                    mascotState = CatMascotState.Excited
                                    mascotMessage = "Tuyệt vời! Cùng bắt đầu hành trình nào 🐾"
                                    delay(400)
                                    onNavigateToSignUp()
                                    isNavigating = false
                                }
                            }
                        },
                        trailingIcon = {
                            Icon(
                                imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                        },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(Modifier.height(18.dp))

                    Row(
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
                                color = MaterialTheme.colorScheme.primary
                            ),
                            modifier = Modifier.clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null,
                                onClick = onNavigateToLogin
                            )
                        )
                    }

                    Spacer(Modifier.height(6.dp))

                    Text(
                        text = "Vuốt sang trái để đăng ký ➔",
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                            fontSize = 11.sp
                        )
                    )
                }
            }
        }
    }
}
