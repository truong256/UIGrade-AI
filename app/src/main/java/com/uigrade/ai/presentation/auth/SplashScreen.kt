package com.uigrade.ai.presentation.auth

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.ui.components.mascot.CatMascotPose
import com.uigrade.ai.ui.components.mascot.UIGradeCatMascot
import com.uigrade.ai.ui.theme.BackgroundAltLight
import com.uigrade.ai.ui.theme.BackgroundLight
import com.uigrade.ai.ui.theme.Primary
import com.uigrade.ai.ui.theme.SecondaryLight
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    onNavigateToGetStarted: () -> Unit,
    onAutoLogin: (role: String) -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    val scale = remember { Animatable(0.85f) }

    LaunchedEffect(Unit) {
        viewModel.checkExistingSession()
        scale.animateTo(
            targetValue = 1f,
            animationSpec = spring(dampingRatio = 0.6f, stiffness = 300f)
        )
        delay(1400)
        val user = uiState.loggedInUser
        if (user != null) onAutoLogin(user.role.name) else onNavigateToGetStarted()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.background,
                        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        MaterialTheme.colorScheme.background
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.scale(scale.value)
        ) {
            UIGradeCatMascot(
                pose = CatMascotPose.WELCOME,
                size = 150.dp,
                showAura = true
            )

            Spacer(Modifier.height(16.dp))

            Text(
                text = "UIGrade AI",
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface,
                letterSpacing = 1.sp
            )

            Spacer(Modifier.height(6.dp))

            Text(
                text = "Intelligent UI Grading & Learning Platform",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(Modifier.height(42.dp))

            CircularProgressIndicator(
                color = Primary,
                strokeWidth = 2.5.dp,
                modifier = Modifier.size(28.dp)
            )
        }
    }
}
