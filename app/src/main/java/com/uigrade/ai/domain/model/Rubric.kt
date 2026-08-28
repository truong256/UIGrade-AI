package com.uigrade.ai.domain.model

/**
 * A grading criterion within a rubric (e.g. "Typography").
 * Each criterion has a weight and a list of rules.
 */
data class RubricCriterion(
    val id: String,
    val name: String,
    val description: String,
    val weightPercent: Int,         // e.g. 20 means 20% of total
    val maxScore: Int,              // e.g. 20 points
    val rules: List<Rule> = emptyList(),
    val levels: List<RubricLevel> = emptyList()
)

data class RubricLevel(
    val id: String,
    val title: String,
    val description: String,
    val score: Int
)

/**
 * A full grading rubric with multiple criteria.
 * Rubrics are created by lecturers and used by the grading engine.
 */
data class Rubric(
    val id: String,
    val title: String,
    val description: String,
    val version: String,
    val criteria: List<RubricCriterion>,
    val totalMaxScore: Int = criteria.sumOf { it.maxScore },
    val lecturerId: String = ""
)
