package com.uigrade.ai.domain.model

import java.time.LocalDateTime

/**
 * Score earned for a single rubric criterion.
 */
data class CriterionScore(
    val criterionId: String,
    val criterionName: String,
    val earned: Int,
    val maxScore: Int,
    val metrics: List<Metric> = emptyList(),
    val rules: List<Rule> = emptyList()
) {
    val percentage: Float get() = if (maxScore > 0) earned.toFloat() / maxScore else 0f
}

/**
 * The complete grading result for a submission.
 *
 * IMPORTANT: totalScore is the SUM of criterion scores, computed deterministically.
 * AI does NOT produce or modify totalScore.
 *
 * This model mirrors the Python Baseline JSON contract exactly.
 */
data class GradingResult(
    val id: String,
    val submissionId: String,
    val assignmentId: String,
    val studentId: String,
    val totalScore: Int,            // Deterministic sum — NOT set by AI
    val maxScore: Int,
    val criteriaScores: List<CriterionScore>,
    val gradedAt: LocalDateTime,
    val engineVersion: String,      // Grading engine version for audit trail
    val feedbackId: String? = null  // Reference to AI-generated feedback (separate)
) {
    val percentage: Float get() = if (maxScore > 0) totalScore.toFloat() / maxScore else 0f
}
