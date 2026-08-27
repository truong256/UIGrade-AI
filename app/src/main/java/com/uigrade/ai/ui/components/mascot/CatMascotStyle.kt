package com.uigrade.ai.ui.components.mascot

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Customizable styling attributes for the Cat Mascot.
 * Allows easy modification of size, fur color, ear tint, eye color, and theme accessories.
 */
data class CatMascotStyle(
    val size: Dp = 140.dp,
    val furColor: Color = Color(0xFFFFF7ED), // Soft warm cream
    val innerEarColor: Color = Color(0xFFFBCFE8), // Gentle pastel pink
    val eyeColor: Color = Color(0xFF1E293B), // Deep slate
    val accessoryColor: Color = Color(0xFF2563EB), // Theme blue ribbon/collar
    val showSpeechBubble: Boolean = true
) {
    companion object {
        /** Default warm cream mascot with blue educational bowtie/collar */
        val Default = CatMascotStyle()

        /** Blue tint variant matching educational blue theme */
        val Blue = CatMascotStyle(
            furColor = Color(0xFFF0F6FF),
            innerEarColor = Color(0xFFDCE9FF),
            accessoryColor = Color(0xFF1D4ED8)
        )

        /** Mint variant for feedback or submission views */
        val Mint = CatMascotStyle(
            furColor = Color(0xFFF0FDF4),
            innerEarColor = Color(0xFFDCFCE7),
            accessoryColor = Color(0xFF10B981)
        )
    }
}
