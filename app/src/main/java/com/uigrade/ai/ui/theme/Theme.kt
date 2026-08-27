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
    onPrimary = Color.White,
    primaryContainer = PrimaryContainerLight,
    onPrimaryContainer = Primary,
    secondary = Secondary,
    onSecondary = Color.White,
    secondaryContainer = SecondaryContainerLight,
    onSecondaryContainer = Secondary,
    tertiary = AccentMint,
    onTertiary = Color.White,
    tertiaryContainer = AccentMintContainer,
    onTertiaryContainer = Color(0xFF1E5242),
    background = BackgroundLight,
    onBackground = OnSurfaceLight,
    surface = SurfaceLight,
    onSurface = OnSurfaceLight,
    surfaceVariant = SurfaceVariantLight,
    onSurfaceVariant = OnSurfaceVariantLight,
    error = Error,
    onError = Color.White,
    errorContainer = ErrorContainer,
    onErrorContainer = Color(0xFF7F1D1D),
    outline = Neutral300,
    outlineVariant = Neutral200
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryDark,
    onPrimary = Neutral900,
    primaryContainer = PrimaryContainerDark,
    onPrimaryContainer = Color(0xFFDED7FC),
    secondary = SecondaryDark,
    onSecondary = Neutral900,
    secondaryContainer = SecondaryContainerDark,
    onSecondaryContainer = Color(0xFFD7E5FC),
    tertiary = AccentMint,
    onTertiary = Neutral900,
    tertiaryContainer = Color(0xFF1A3D33),
    onTertiaryContainer = AccentMintContainer,
    background = BackgroundDark,
    onBackground = OnSurfaceDark,
    surface = SurfaceDark,
    onSurface = OnSurfaceDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = OnSurfaceVariantDark,
    error = Color(0xFFFCA5A5),
    onError = Neutral900,
    errorContainer = Color(0xFF6B1D1D),
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
