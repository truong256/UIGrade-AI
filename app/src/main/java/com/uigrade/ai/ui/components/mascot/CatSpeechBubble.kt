/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.ui.components.mascot

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Modern speech bubble for the Cat Mascot with subtle shadow, smooth entrance animation,
 * and theme-adaptive coloring.
 */
@Composable
fun CatSpeechBubble(
    message: String,
    modifier: Modifier = Modifier,
    isError: Boolean = false,
    isSuccess: Boolean = false
) {
    val containerColor = when {
        isError -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.95f)
        isSuccess -> MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.95f)
        else -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.92f)
    }

    val contentColor = when {
        isError -> MaterialTheme.colorScheme.onErrorContainer
        isSuccess -> MaterialTheme.colorScheme.onTertiaryContainer
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    val borderColor = when {
        isError -> MaterialTheme.colorScheme.error.copy(alpha = 0.5f)
        isSuccess -> MaterialTheme.colorScheme.tertiary.copy(alpha = 0.5f)
        else -> MaterialTheme.colorScheme.outline.copy(alpha = 0.35f)
    }

    AnimatedVisibility(
        visible = message.isNotBlank(),
        enter = fadeIn(tween(250)) + expandVertically(tween(250)),
        exit = fadeOut(tween(200)) + shrinkVertically(tween(200)),
        modifier = modifier
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .shadow(elevation = 2.dp, shape = RoundedCornerShape(16.dp))
                    .clip(RoundedCornerShape(16.dp))
                    .background(containerColor)
                    .border(width = 1.dp, color = borderColor, shape = RoundedCornerShape(16.dp))
                    .padding(horizontal = 16.dp, vertical = 10.dp)
            ) {
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.Medium,
                        color = contentColor,
                        lineHeight = 19.sp,
                        textAlign = TextAlign.Center
                    ),
                    modifier = Modifier.fillMaxWidth(0.9f)
                )
            }
        }
    }
}
