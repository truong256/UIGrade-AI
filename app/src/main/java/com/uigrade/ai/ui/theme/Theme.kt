/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = BluePrimaryLight,
    onPrimary = BlueOnPrimaryLight,
    primaryContainer = BluePrimaryContainerLight,
    onPrimaryContainer = BlueOnPrimaryContainerLight,
    secondary = BlueSecondaryLight,
    onSecondary = BlueOnSecondaryLight,
    secondaryContainer = Color(0xFFE0ECFD),
    onSecondaryContainer = Color(0xFF0D2852),
    tertiary = AccentMint,
    onTertiary = Color.White,
    tertiaryContainer = AccentMintContainer,
    onTertiaryContainer = Color(0xFF064E3B),
    background = BlueBackgroundLight,
    onBackground = BlueOnBackgroundLight,
    surface = BlueSurfaceLight,
    onSurface = BlueOnSurfaceLight,
    surfaceVariant = BlueSurfaceVariantLight,
    onSurfaceVariant = BlueOnSurfaceVariantLight,
    outline = BlueOutlineLight,
    outlineVariant = Color(0xFFD4E0F0),
    error = BlueErrorLight,
    onError = Color.White,
    errorContainer = ErrorContainer,
    onErrorContainer = Color(0xFF410002)
)

private val DarkColorScheme = darkColorScheme(
    primary = BluePrimaryDark,
    onPrimary = BlueOnPrimaryDark,
    primaryContainer = BluePrimaryContainerDark,
    onPrimaryContainer = BlueOnPrimaryContainerDark,
    secondary = BlueSecondaryDark,
    onSecondary = BlueOnSecondaryDark,
    secondaryContainer = Color(0xFF1D355C),
    onSecondaryContainer = Color(0xFFD8E7FF),
    tertiary = AccentMint,
    onTertiary = Color(0xFF003828),
    tertiaryContainer = Color(0xFF00513B),
    onTertiaryContainer = AccentMintContainer,
    background = BlueBackgroundDark,
    onBackground = BlueOnBackgroundDark,
    surface = BlueSurfaceDark,
    onSurface = BlueOnSurfaceDark,
    surfaceVariant = BlueSurfaceVariantDark,
    onSurfaceVariant = BlueOnSurfaceVariantDark,
    outline = BlueOutlineDark,
    outlineVariant = Color(0xFF3F4D63),
    error = BlueErrorDark,
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6)
)

@Composable
fun UIGradeAITheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = UIGradeTypography,
        shapes = UIGradeShapes,
        content = content
    )
}
