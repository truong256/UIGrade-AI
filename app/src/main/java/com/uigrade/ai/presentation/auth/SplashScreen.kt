package com.uigrade.ai.presentation.auth

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.uigrade.ai.ui.components.mascot.CatMascot
import com.uigrade.ai.ui.components.mascot.CatMascotState
import com.uigrade.ai.ui.components.mascot.CatMascotStyle
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
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.scale(scale.value)
        ) {
            CatMascot(
                state = CatMascotState.Greeting,
                style = CatMascotStyle.Default.copy(size = 155.dp, showSpeechBubble = false)
            )

            Spacer(Modifier.height(16.dp))

            Text(
                text = "UIGrade AI",
                fontSize = 32.sp,
                fontWeight = FontWeight.ExtraBold,
                color = MaterialTheme.colorScheme.primary,
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
                color = MaterialTheme.colorScheme.primary,
                strokeWidth = 2.5.dp,
                modifier = Modifier.size(28.dp)
            )
        }
    }
}
