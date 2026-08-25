package com.uigrade.ai.domain.model

/**
 * A deterministic rule applied to a metric to determine pass/fail.
 *
 * Rules are defined in the rubric and applied by the grading engine.
 * AI does NOT define, modify, or apply rules.
 *
 * Score calculation is deterministic: penalty is subtracted from maxScore on fail.
 *
 * @param id             Unique rule identifier (e.g. "RULE_FONT_SIZE_001")
 * @param description    Human-readable description of the rule
 * @param metricId       The metric this rule evaluates
 * @param threshold      The threshold expression (e.g. ">=16sp")
 * @param weight         Point weight of this rule
 * @param maxScore       Maximum score achievable if this rule passes
 * @param penalty        Points deducted if this rule fails
 * @param passCondition  Description of the condition to pass (e.g. "value >= 16")
 * @param failCondition  Description of the condition that triggers failure
 * @param scoreFormula   How the score is calculated (e.g. "maxScore - penalty * violationCount")
 * @param result         Whether this rule passed or failed in the current grading
 * @param earnedScore    The actual score earned for this rule (null if not yet graded)
 */
data class Rule(
    val id: String,
    val description: String,
    val metricId: String,
    val threshold: String,
    val weight: Int,
    val maxScore: Int,
    val penalty: Int,
    val passCondition: String,
    val failCondition: String,
    val scoreFormula: String,
    val result: MetricStatus? = null,
    val earnedScore: Int? = null
)
