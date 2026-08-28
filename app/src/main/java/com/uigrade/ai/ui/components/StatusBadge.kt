package com.uigrade.ai.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.LogLevel
import com.uigrade.ai.domain.model.SubmissionStatus
import com.uigrade.ai.ui.theme.*

// ─── Assignment Status Badge ──────────────────────────────────────────────────
@Composable
fun AssignmentStatusBadge(status: AssignmentStatus, modifier: Modifier = Modifier) {
    val (label, color, icon) = when (status) {
        AssignmentStatus.UPCOMING      -> Triple("Sắp mở", Info, Icons.Default.Schedule)
        AssignmentStatus.NOT_SUBMITTED -> Triple("Chưa nộp", Neutral500, Icons.Default.RadioButtonUnchecked)
        AssignmentStatus.DRAFT         -> Triple("Đang soạn", Warning, Icons.Default.EditNote)
        AssignmentStatus.SUBMITTED     -> Triple("Đã nộp", Info, Icons.Default.CheckCircle)
        AssignmentStatus.LATE          -> Triple("Nộp muộn", Warning, Icons.Default.Schedule)
        AssignmentStatus.GRADING       -> Triple("Đang chấm", Warning, Icons.Default.HourglassBottom)
        AssignmentStatus.GRADED        -> Triple("Đã chấm", Success, Icons.Default.CheckCircle)
        AssignmentStatus.OVERDUE       -> Triple("Quá hạn", Error, Icons.Default.EventBusy)
        AssignmentStatus.CLOSED        -> Triple("Đã đóng", Neutral500, Icons.Default.Lock)
        AssignmentStatus.RESUBMISSION_REQUIRED -> Triple("Cần nộp lại", Error, Icons.Default.Replay)
    }
    StatusChip(label = label, color = color, icon = { Icon(icon, contentDescription = label, tint = color, modifier = Modifier.size(14.dp)) }, modifier = modifier)
}

// ─── Submission Status Badge ──────────────────────────────────────────────────
@Composable
fun SubmissionStatusBadge(status: SubmissionStatus, modifier: Modifier = Modifier) {
    val (label, color, icon) = when (status) {
        SubmissionStatus.PENDING    -> Triple("Chờ xử lý", Warning, Icons.Default.HourglassBottom)
        SubmissionStatus.PROCESSING -> Triple("Đang chấm", Info, Icons.Default.Sync)
        SubmissionStatus.COMPLETED  -> Triple("Hoàn thành", Success, Icons.Default.CheckCircle)
        SubmissionStatus.FAILED     -> Triple("Lỗi", Error, Icons.Default.Error)
        SubmissionStatus.SUBMITTED  -> Triple("Đã nộp", Info, Icons.Default.CheckCircle)
        SubmissionStatus.LATE       -> Triple("Nộp muộn", Warning, Icons.Default.Schedule)
        SubmissionStatus.GRADING    -> Triple("Đang chấm", Warning, Icons.Default.HourglassBottom)
        SubmissionStatus.GRADED     -> Triple("Đã chấm", Success, Icons.Default.Grading)
        SubmissionStatus.RELEASED   -> Triple("Đã công bố", Success, Icons.Default.Verified)
    }
    StatusChip(label = label, color = color, icon = { Icon(icon, contentDescription = label, tint = color, modifier = Modifier.size(14.dp)) }, modifier = modifier)
}


// ─── Log Level Badge ──────────────────────────────────────────────────────────
@Composable
fun LogLevelBadge(level: LogLevel, modifier: Modifier = Modifier) {
    val (label, color, icon) = when (level) {
        LogLevel.INFO    -> Triple("INFO", Info, Icons.Default.Info)
        LogLevel.WARNING -> Triple("WARN", Warning, Icons.Default.Warning)
        LogLevel.ERROR   -> Triple("ERROR", Error, Icons.Default.Error)
    }
    StatusChip(label = label, color = color, icon = { Icon(icon, contentDescription = label, tint = color, modifier = Modifier.size(14.dp)) }, modifier = modifier)
}

// ─── Score Color Helper ───────────────────────────────────────────────────────
fun scoreColor(score: Int, maxScore: Int): androidx.compose.ui.graphics.Color {
    val pct = if (maxScore > 0) score.toFloat() / maxScore else 0f
    return when {
        pct >= 0.9f -> ScoreExcellent
        pct >= 0.7f -> ScoreGood
        pct >= 0.5f -> ScoreFair
        else        -> ScorePoor
    }
}

// ─── Private chip primitive ───────────────────────────────────────────────────
@Composable
private fun StatusChip(
    label: String,
    color: androidx.compose.ui.graphics.Color,
    icon: @Composable () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        color = color.copy(alpha = 0.12f),
        shape = MaterialTheme.shapes.extraSmall,
        modifier = modifier
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            icon()
            Text(label, style = MaterialTheme.typography.labelSmall, color = color, fontWeight = FontWeight.SemiBold)
        }
    }
}
