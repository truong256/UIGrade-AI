package com.uigrade.ai.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.uigrade.ai.domain.model.Feedback
import com.uigrade.ai.ui.theme.Primary
import com.uigrade.ai.ui.theme.Success
import com.uigrade.ai.ui.theme.Warning

@Composable
fun AIFeedbackCard(feedback: Feedback, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Primary.copy(alpha = 0.05f)
        ),
        shape = MaterialTheme.shapes.large,
        border = CardDefaults.outlinedCardBorder().copy(
            brush = androidx.compose.ui.graphics.SolidColor(Primary.copy(alpha = 0.2f))
        )
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {

            // Header with AI disclaimer
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.AutoAwesome, contentDescription = "AI Feedback", tint = Primary, modifier = Modifier.size(20.dp))
                Text("AI Feedback", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Primary)
            }

            // Disclaimer badge
            Surface(
                color = Warning.copy(alpha = 0.12f),
                shape = MaterialTheme.shapes.small
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(Icons.Default.Info, contentDescription = "Info", tint = Warning, modifier = Modifier.size(14.dp))
                    Text(
                        "AI generated feedback · Score was calculated by deterministic rules",
                        style = MaterialTheme.typography.labelSmall,
                        color = Warning
                    )
                }
            }

            HorizontalDivider(color = Primary.copy(alpha = 0.15f))

            // Summary
            Text(feedback.summary, style = MaterialTheme.typography.bodyMedium)

            // Strengths
            if (feedback.strengths.isNotEmpty()) {
                FeedbackSection(
                    title = "Điểm mạnh",
                    icon = { Icon(Icons.Default.ThumbUp, "Strengths", tint = Success, modifier = Modifier.size(16.dp)) },
                    items = feedback.strengths,
                    itemColor = MaterialTheme.colorScheme.onSurface
                )
            }

            // Problems
            if (feedback.problems.isNotEmpty()) {
                FeedbackSection(
                    title = "Vấn đề phát hiện",
                    icon = { Icon(Icons.Default.Warning, "Problems", tint = com.uigrade.ai.ui.theme.Error, modifier = Modifier.size(16.dp)) },
                    items = feedback.problems.map { it.description },
                    itemColor = MaterialTheme.colorScheme.onSurface
                )
            }

            // Recommendations
            if (feedback.recommendations.isNotEmpty()) {
                FeedbackSection(
                    title = "Đề xuất cải thiện",
                    icon = { Icon(Icons.Default.Lightbulb, "Recommendations", tint = Primary, modifier = Modifier.size(16.dp)) },
                    items = feedback.recommendations,
                    itemColor = MaterialTheme.colorScheme.onSurface
                )
            }

            // Footer
            Text(
                "Generated at ${feedback.generatedAt} · ${feedback.modelVersion}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun FeedbackSection(
    title: String,
    icon: @Composable () -> Unit,
    items: List<String>,
    itemColor: androidx.compose.ui.graphics.Color
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            icon()
            Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
        }
        items.forEach { item ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("•", style = MaterialTheme.typography.bodyMedium, color = itemColor.copy(alpha = 0.5f))
                Text(item, style = MaterialTheme.typography.bodyMedium, color = itemColor)
            }
        }
    }
}
