package com.uigrade.ai.domain.model

/**
 * Pass/Fail result of evaluating a metric against its rule.
 */
enum class MetricStatus {
    PASS,
    FAIL,
    WARNING
}

/**
 * A single measurable property extracted from a student's UI submission.
 *
 * Metrics are computed by the deterministic grading engine.
 * AI does NOT compute or modify metrics.
 *
 * @param id          Unique identifier (e.g. "font_size_body")
 * @param name        Human-readable name (e.g. "Body Text Size")
 * @param category    Which rubric category this belongs to (e.g. "Typography")
 * @param actualValue The measured value as a formatted string (e.g. "14sp")
 * @param expectedValue The threshold expression (e.g. ">=16sp")
 * @param unit        Unit of measurement (e.g. "sp", "dp", "ratio")
 * @param status      Whether the metric passes its associated rule
 */
data class Metric(
    val id: String,
    val name: String,
    val category: String,
    val actualValue: String,
    val expectedValue: String,
    val unit: String,
    val status: MetricStatus,
    val description: String = ""
)
