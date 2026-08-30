/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.domain.model

/**
 * AI-generated textual feedback for a grading result.
 *
 * IMPORTANT CONSTRAINTS:
 * - AI receives the fully computed GradingResult (with deterministic scores).
 * - AI can ONLY produce text fields: summary, strengths, problems, recommendations.
 * - AI CANNOT produce, modify, or suggest changes to: score, weight, threshold,
 *   rule definition, or metric values.
 * - The UI must always display: "AI generated feedback. Score was calculated by
 *   deterministic rules."
 *
 * @param id            Unique feedback ID
 * @param gradingResultId  The grading result this feedback is based on
 * @param summary       Overall textual summary of the submission
 * @param strengths     List of things the student did well
 * @param problems      List of identified issues with references to failing metrics/rules
 * @param recommendations  Actionable suggestions for improvement
 * @param generatedAt   Timestamp of generation
 * @param modelVersion  Which AI model version generated this (for audit)
 */
data class Feedback(
    val id: String,
    val gradingResultId: String,
    val summary: String,
    val strengths: List<String>,
    val problems: List<FeedbackProblem>,
    val recommendations: List<String>,
    val generatedAt: String,
    val modelVersion: String
)

/**
 * A specific problem identified in the AI feedback,
 * linked to the rule and metric that caused it.
 */
data class FeedbackProblem(
    val ruleId: String,
    val metricId: String,
    val description: String,
    val impact: String
)
