/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.ui.components.mascot

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.uigrade.ai.R
import com.uigrade.ai.ui.theme.AccentMint
import com.uigrade.ai.ui.theme.Primary
import com.uigrade.ai.ui.theme.Secondary

/**
 * UIGrade AI's official Cat Mascot guide component with smooth idle floating motion.
 */
@Composable
fun UIGradeCatMascot(
    pose: CatMascotPose,
    modifier: Modifier = Modifier,
    size: Dp = 160.dp,
    showAura: Boolean = true
) {
    val infiniteTransition = rememberInfiniteTransition(label = "CatIdleMotion")

    // Subtle gentle bobbing
    val offsetY by infiniteTransition.animateFloat(
        initialValue = -5f,
        targetValue = 5f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = EaseInOutQuad),
            repeatMode = RepeatMode.Reverse
        ),
        label = "CatBobbing"
    )

    // Gentle breathing scale
    val breathingScale by infiniteTransition.animateFloat(
        initialValue = 0.985f,
        targetValue = 1.015f,
        animationSpec = infiniteRepeatable(
            animation = tween(2800, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "CatBreathing"
    )

    val drawableRes = when (pose) {
        CatMascotPose.WELCOME -> R.drawable.ic_ui_grade_cat_welcome
        CatMascotPose.GUIDE -> R.drawable.ic_ui_grade_cat_guide
        CatMascotPose.SUCCESS -> R.drawable.ic_ui_grade_cat_success
        CatMascotPose.THINKING -> R.drawable.ic_ui_grade_cat_guide
    }

    Box(
        modifier = modifier
            .size(size)
            .offset(y = offsetY.dp)
            .scale(breathingScale),
        contentAlignment = Alignment.Center
    ) {
        if (showAura) {
            // Soft atmospheric pastel halo
            val haloColor1 = when (pose) {
                CatMascotPose.SUCCESS -> AccentMint.copy(alpha = 0.25f)
                CatMascotPose.GUIDE -> Secondary.copy(alpha = 0.22f)
                else -> Primary.copy(alpha = 0.20f)
            }
            val haloColor2 = when (pose) {
                CatMascotPose.SUCCESS -> Color(0xFFD4F7EC).copy(alpha = 0.12f)
                CatMascotPose.GUIDE -> Color(0xFFE5EEFC).copy(alpha = 0.12f)
                else -> Color(0xFFEFEBFD).copy(alpha = 0.10f)
            }

            Box(
                modifier = Modifier
                    .size(size * 0.9f)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(haloColor1, haloColor2, Color.Transparent)
                        )
                    )
            )
        }

        Crossfade(
            targetState = drawableRes,
            animationSpec = tween(350),
            label = "MascotCrossfade"
        ) { resId ->
            Image(
                painter = painterResource(id = resId),
                contentDescription = "UIGrade AI Cat Mascot",
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}
