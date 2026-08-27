package com.uigrade.ai.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.uigrade.ai.ui.theme.Primary
import com.uigrade.ai.ui.theme.SecondaryLight

/**
 * Modern interactive button with physics-based press scaling (1.0 -> 0.97),
 * soft educational gradient (lavender to pastel blue), and Material 3 ripple.
 */
@Composable
fun UIGradeButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    leadingIcon: (@Composable () -> Unit)? = null,
    trailingIcon: (@Composable () -> Unit)? = null,
    isSecondary: Boolean = false
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isPressed && enabled && !isLoading) 0.97f else 1.0f,
        animationSpec = spring(dampingRatio = 0.65f, stiffness = 400f),
        label = "ButtonPressScale"
    )

    val shape = RoundedCornerShape(16.dp)

    val gradientBrush = if (isSecondary) {
        Brush.horizontalGradient(
            colors = listOf(
                MaterialTheme.colorScheme.surfaceVariant,
                MaterialTheme.colorScheme.surfaceVariant
            )
        )
    } else {
        Brush.horizontalGradient(
            colors = listOf(
                Primary,
                SecondaryLight
            )
        )
    }

    val textColor = if (isSecondary) {
        MaterialTheme.colorScheme.onSurface
    } else {
        Color.White
    }

    val shadowElevation = if (isSecondary || !enabled) 0.dp else if (isPressed) 2.dp else 6.dp

    Box(
        modifier = modifier
            .scale(scale)
            .height(54.dp)
            .shadow(
                elevation = shadowElevation,
                shape = shape,
                ambientColor = Primary.copy(alpha = 0.35f),
                spotColor = Primary.copy(alpha = 0.45f)
            )
            .clip(shape)
            .background(
                if (enabled) gradientBrush else Brush.linearGradient(
                    listOf(
                        MaterialTheme.colorScheme.outlineVariant,
                        MaterialTheme.colorScheme.outlineVariant
                    )
                )
            )
            .clickable(
                interactionSource = interactionSource,
                indication = ripple(color = if (isSecondary) Primary else Color.White.copy(alpha = 0.3f)),
                enabled = enabled && !isLoading,
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 24.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(22.dp),
                    color = textColor,
                    strokeWidth = 2.5.dp
                )
            } else {
                if (leadingIcon != null) {
                    leadingIcon()
                    Spacer(Modifier.width(10.dp))
                }

                Text(
                    text = text,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp,
                        color = if (enabled) textColor else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                    )
                )

                if (trailingIcon != null) {
                    Spacer(Modifier.width(10.dp))
                    trailingIcon()
                }
            }
        }
    }
}
