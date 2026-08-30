/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.ui.components.mascot

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.TipsAndUpdates
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.uigrade.ai.ui.theme.*

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun GuideBubble(
    text: String,
    modifier: Modifier = Modifier,
    isError: Boolean = false,
    isSuccess: Boolean = false,
    catName: String = "Mèo UIGrade"
) {
    val containerColor = when {
        isError -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.9f)
        isSuccess -> SuccessContainer.copy(alpha = 0.9f)
        else -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.85f)
    }

    val contentColor = when {
        isError -> MaterialTheme.colorScheme.onErrorContainer
        isSuccess -> Color(0xFF135A3D)
        else -> MaterialTheme.colorScheme.onSurface
    }

    val borderColor = when {
        isError -> Error.copy(alpha = 0.4f)
        isSuccess -> Success.copy(alpha = 0.4f)
        else -> Primary.copy(alpha = 0.25f)
    }

    val icon = when {
        isError -> Icons.Rounded.ErrorOutline
        isSuccess -> Icons.Rounded.CheckCircle
        else -> Icons.Rounded.AutoAwesome
    }

    Box(
        modifier = modifier
            .shadow(elevation = 3.dp, shape = RoundedCornerShape(18.dp), ambientColor = borderColor)
            .clip(RoundedCornerShape(18.dp))
            .background(containerColor)
            .border(1.dp, borderColor, RoundedCornerShape(18.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(borderColor.copy(alpha = 0.18f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = if (isError) Error else if (isSuccess) Success else Primary,
                    modifier = Modifier.size(16.dp)
                )
            }

            Column(modifier = Modifier.weight(1f, fill = false)) {
                Text(
                    text = catName,
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = if (isError) Error else if (isSuccess) Success else Primary,
                        fontSize = 11.sp
                    )
                )
                AnimatedContent(
                    targetState = text,
                    transitionSpec = {
                        (fadeIn() + slideInVertically { it / 2 })
                            .togetherWith(fadeOut() + slideOutVertically { -it / 2 })
                    },
                    label = "GuideBubbleText"
                ) { targetText ->
                    Text(
                        text = targetText,
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = contentColor,
                            fontWeight = FontWeight.Medium,
                            lineHeight = 18.sp
                        )
                    )
                }
            }
        }
    }
}
