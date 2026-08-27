package com.uigrade.ai.ui.theme

import androidx.compose.ui.graphics.Color

// ─── Modern Calming Blue Palette (Light Theme) ───────────────────────────────
val BluePrimaryLight = Color(0xFF2563EB)
val BlueOnPrimaryLight = Color(0xFFFFFFFF)
val BluePrimaryContainerLight = Color(0xFFDCE9FF)
val BlueOnPrimaryContainerLight = Color(0xFF102A56)
val BlueSecondaryLight = Color(0xFF4F75B9)
val BlueOnSecondaryLight = Color(0xFFFFFFFF)
val BlueBackgroundLight = Color(0xFFF6F9FF)
val BlueOnBackgroundLight = Color(0xFF172033)
val BlueSurfaceLight = Color(0xFFFFFFFF)
val BlueOnSurfaceLight = Color(0xFF172033)
val BlueSurfaceVariantLight = Color(0xFFEAF1FB)
val BlueOnSurfaceVariantLight = Color(0xFF4A5568)
val BlueOutlineLight = Color(0xFFA9B8CD)
val BlueErrorLight = Color(0xFFBA1A1A)

// ─── Modern Calming Blue Palette (Dark Theme) ────────────────────────────────
val BluePrimaryDark = Color(0xFFA9C7FF)
val BlueOnPrimaryDark = Color(0xFF003062)
val BluePrimaryContainerDark = Color(0xFF164A8A)
val BlueOnPrimaryContainerDark = Color(0xFFD8E7FF)
val BlueSecondaryDark = Color(0xFF8EB2F5)
val BlueOnSecondaryDark = Color(0xFF002E69)
val BlueBackgroundDark = Color(0xFF0E1523)
val BlueOnBackgroundDark = Color(0xFFE3EAF5)
val BlueSurfaceDark = Color(0xFF151E2D)
val BlueOnSurfaceDark = Color(0xFFE3EAF5)
val BlueSurfaceVariantDark = Color(0xFF253247)
val BlueOnSurfaceVariantDark = Color(0xFFA0B3CC)
val BlueOutlineDark = Color(0xFF8998AE)
val BlueErrorDark = Color(0xFFFFB4AB)

// ─── Backwards Compatibility & Semantic Color Aliases ────────────────────────
val Primary = BluePrimaryLight
val PrimaryLight = Color(0xFF60A5FA)
val PrimaryDark = BluePrimaryDark
val PrimaryContainerLight = BluePrimaryContainerLight
val PrimaryContainerDark = BluePrimaryContainerDark

val Secondary = BlueSecondaryLight
val SecondaryLight = Color(0xFF7BA0E6)
val SecondaryDark = BlueSecondaryDark
val SecondaryContainerLight = Color(0xFFE6F0FD)
val SecondaryContainerDark = Color(0xFF1A2B47)

val AccentMint = Color(0xFF10B981)
val AccentMintContainer = Color(0xFFD1FAE5)
val AccentPeach = Color(0xFFF97316)

val Success = Color(0xFF16A34A)
val SuccessContainer = Color(0xFFDCFCE7)
val Warning = Color(0xFFD97706)
val WarningContainer = Color(0xFFFEF3C7)
val Error = BlueErrorLight
val ErrorContainer = Color(0xFFFFDAD6)
val Info = Color(0xFF0284C7)

val SurfaceLight = BlueSurfaceLight
val SurfaceVariantLight = BlueSurfaceVariantLight
val BackgroundLight = BlueBackgroundLight
val OnSurfaceLight = BlueOnSurfaceLight
val OnSurfaceVariantLight = BlueOnSurfaceVariantLight

val SurfaceDark = BlueSurfaceDark
val SurfaceVariantDark = BlueSurfaceVariantDark
val BackgroundDark = BlueBackgroundDark
val OnSurfaceDark = BlueOnSurfaceDark
val OnSurfaceVariantDark = BlueOnSurfaceVariantDark

val Neutral50  = Color(0xFFF8FAFC)
val Neutral100 = Color(0xFFF1F5F9)
val Neutral200 = Color(0xFFE2E8F0)
val Neutral300 = Color(0xFFCBD5E1)
val Neutral400 = Color(0xFF94A3B8)
val Neutral500 = Color(0xFF64748B)
val Neutral600 = Color(0xFF475569)
val Neutral700 = Color(0xFF334155)
val Neutral800 = Color(0xFF1E293B)
val Neutral900 = Color(0xFF0F172A)

// ─── Score Gradient Colors ───────────────────────────────────────────────────
val ScoreExcellent = Color(0xFF16A34A)
val ScoreGood      = Color(0xFF2563EB)
val ScoreFair      = Color(0xFFD97706)
val ScorePoor      = Color(0xFFDC2626)

// ─── Blue Auth / Registration Theme Palette ─────────────────────────────────
val AuthBluePrimary = BluePrimaryLight
val AuthBluePrimaryDark = Color(0xFF1D4ED8)
val AuthBluePrimaryLight = BluePrimaryContainerLight
val AuthBlueBackgroundLight = BlueBackgroundLight
val AuthBlueSurface = BlueSurfaceLight
val AuthBlueTextPrimary = BlueOnSurfaceLight
val AuthBlueTextSecondary = Color(0xFF64748B)
val AuthBlueBorder = BlueOutlineLight
val AuthBlueBorderFocused = BluePrimaryLight
val AuthBlueError = BlueErrorLight
val AuthBlueSuccess = Success

val AuthBluePrimaryDarkTheme = BluePrimaryDark
val AuthBlueBackgroundDarkTheme = BlueBackgroundDark
val AuthBlueSurfaceDarkTheme = BlueSurfaceDark
val AuthBlueTextPrimaryDarkTheme = BlueOnSurfaceDark
val AuthBlueTextSecondaryDarkTheme = BlueOnSurfaceVariantDark
val AuthBlueBorderDarkTheme = BlueOutlineDark
