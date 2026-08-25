package com.uigrade.ai.ui.components

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.uigrade.ai.domain.model.MetricStatus
import com.uigrade.ai.domain.model.Rule
import com.uigrade.ai.ui.theme.Error
import com.uigrade.ai.ui.theme.Success

@Composable
fun RuleCard(rule: Rule, modifier: Modifier = Modifier) {
    var expanded by remember { mutableStateOf(false) }
    val isPassed = rule.result == MetricStatus.PASS
    val statusColor = if (isPassed) Success else Error
    val statusIcon = if (isPassed) Icons.Default.CheckCircle else Icons.Default.Error
    val statusLabel = if (isPassed) "PASS ✓" else "FAIL ✗"

    Card(
        modifier = modifier
            .fillMaxWidth()
            .animateContentSize()
            .clickable { expanded = !expanded },
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
        ),
        shape = MaterialTheme.shapes.medium
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = rule.id,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = rule.description,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Medium
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (rule.result != null) {
                        Icon(statusIcon, contentDescription = statusLabel, tint = statusColor, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text(statusLabel, style = MaterialTheme.typography.labelSmall, color = statusColor, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.width(8.dp))
                    }
                    Icon(
                        if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = if (expanded) "Thu gọn" else "Mở rộng",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (expanded) {
                Spacer(Modifier.height(12.dp))
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                Spacer(Modifier.height(12.dp))

                val rows = buildList {
                    add("Threshold" to rule.threshold)
                    add("Pass condition" to rule.passCondition)
                    add("Fail condition" to rule.failCondition)
                    add("Weight" to "${rule.weight}")
                    add("Max score" to "${rule.maxScore}")
                    add("Penalty" to "${rule.penalty}")
                    add("Formula" to rule.scoreFormula)
                    if (rule.earnedScore != null) add("Earned score" to "${rule.earnedScore}")
                }
                rows.forEach { (label, value) ->
                    RuleDetailRow(label, value)
                }
            }
        }
    }
}

@Composable
private fun RuleDetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
        Text(value, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1.5f))
    }
}
