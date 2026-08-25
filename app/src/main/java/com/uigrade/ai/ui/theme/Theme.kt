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
    primary = Primary,
    onPrimary = Neutral50,
    primaryContainer = Color(0xFFEEF2FF),
    onPrimaryContainer = PrimaryVariant,
    secondary = Secondary,
    onSecondary = Neutral50,
    secondaryContainer = Color(0xFFF5F3FF),
    onSecondaryContainer = SecondaryVariant,
    tertiary = Info,
    onTertiary = Neutral50,
    background = BackgroundLight,
    onBackground = OnSurfaceLight,
    surface = SurfaceLight,
    onSurface = OnSurfaceLight,
    surfaceVariant = SurfaceVariantLight,
    onSurfaceVariant = OnSurfaceVariantLight,
    error = Error,
    onError = Neutral50,
    errorContainer = ErrorContainer,
    onErrorContainer = Color(0xFF7F1D1D),
    outline = Neutral300,
    outlineVariant = Neutral200
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF818CF8),
    onPrimary = Neutral900,
    primaryContainer = Color(0xFF1E3A5F),
    onPrimaryContainer = Color(0xFFC7D2FE),
    secondary = Color(0xFFA78BFA),
    onSecondary = Neutral900,
    secondaryContainer = Color(0xFF2E1065),
    onSecondaryContainer = Color(0xFFEDE9FE),
    tertiary = Color(0xFF67E8F9),
    onTertiary = Neutral900,
    background = BackgroundDark,
    onBackground = OnSurfaceDark,
    surface = SurfaceDark,
    onSurface = OnSurfaceDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = OnSurfaceVariantDark,
    error = Color(0xFFFCA5A5),
    onError = Neutral900,
    errorContainer = Color(0xFF7F1D1D),
    onErrorContainer = Color(0xFFFECACA),
    outline = Neutral600,
    outlineVariant = Neutral700
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
