/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai

import com.uigrade.ai.data.mock.MockData
import com.uigrade.ai.domain.model.MetricStatus
import com.uigrade.ai.domain.model.UserRole
import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests verifying the deterministic grading engine principles.
 * These tests ensure AI never determines scores.
 */
class GradingEngineTest {

    @Test
    fun `grading result total score equals sum of criterion scores`() {
        val result = MockData.gradingResult1
        val sumOfCriteria = result.criteriaScores.sumOf { it.earned }
        assertEquals(
            "Total score must equal sum of criterion scores — not set by AI",
            sumOfCriteria,
            result.totalScore
        )
    }

    @Test
    fun `criterion score does not exceed max score`() {
        MockData.allGradingResults.forEach { result ->
            result.criteriaScores.forEach { cs ->
                assertTrue(
                    "Criterion ${cs.criterionName} earned ${cs.earned} exceeds max ${cs.maxScore}",
                    cs.earned <= cs.maxScore
                )
                assertTrue("Earned score cannot be negative", cs.earned >= 0)
            }
        }
    }

    @Test
    fun `failing metric results in reduced rule score`() {
        val result = MockData.gradingResult1
        val typographyCriterion = result.criteriaScores.find { it.criterionName == "Typography" }
        assertNotNull("Typography criterion must exist", typographyCriterion)

        val fontSizeMetric = typographyCriterion!!.metrics.find { it.id == "font_size_body" }
        assertNotNull("font_size_body metric must exist", fontSizeMetric)
        assertEquals("font_size_body should be FAIL (14sp < 16sp)", MetricStatus.FAIL, fontSizeMetric!!.status)

        val fontSizeRule = typographyCriterion.rules.find { it.metricId == "font_size_body" }
        assertNotNull("Rule for font_size_body must exist", fontSizeRule)
        assertTrue(
            "Failed rule earned score must be less than max score",
            (fontSizeRule!!.earnedScore ?: fontSizeRule.maxScore) < fontSizeRule.maxScore
        )
    }

    @Test
    fun `passing metric results in full rule score`() {
        val result = MockData.gradingResult2 // All metrics pass
        result.criteriaScores.forEach { cs ->
            cs.rules.forEach { rule ->
                if (rule.result == MetricStatus.PASS) {
                    assertEquals(
                        "Rule ${rule.id} passed but earned less than max",
                        rule.maxScore,
                        rule.earnedScore ?: -1
                    )
                }
            }
        }
    }

    @Test
    fun `feedback does not contain score fields that override grading`() {
        val feedback = MockData.feedback1
        // Feedback only has text fields — no numeric score properties
        assertNotNull(feedback.summary)
        assertFalse("Summary should not be empty", feedback.summary.isBlank())
        assertNotNull(feedback.strengths)
        assertNotNull(feedback.problems)
        assertNotNull(feedback.recommendations)
        // There is no 'score' field on Feedback — enforced by the type system
    }

    @Test
    fun `mock data contains correct number of users by role`() {
        val students = MockData.allUsers.filter { it.role == UserRole.STUDENT }
        val lecturers = MockData.allUsers.filter { it.role == UserRole.LECTURER }
        val admins = MockData.allUsers.filter { it.role == UserRole.ADMIN }
        assertEquals("Should have 5 students", 5, students.size)
        assertEquals("Should have 2 lecturers", 2, lecturers.size)
        assertEquals("Should have 1 admin", 1, admins.size)
    }

    @Test
    fun `all demo credentials map to existing users`() {
        MockData.credentialHashes.forEach { (email, pair) ->
            val userId = pair.second
            val user = MockData.allUsers.find { it.id == userId }
            assertNotNull("User for email $email with id $userId must exist", user)
            assertEquals("User email must match credential key", email, user!!.email)
            assertEquals("SHA-256 hashes must be 64 hexadecimal characters", 64, pair.first.length)
            assertNotEquals("Demo passwords must not be stored as plaintext", "password123", pair.first)
        }
    }

    @Test
    fun `grading results reference valid submissions`() {
        MockData.allGradingResults.forEach { result ->
            val submission = MockData.submissions.find { it.id == result.submissionId }
            assertNotNull("GradingResult ${result.id} references non-existent submission ${result.submissionId}", submission)
        }
    }

    @Test
    fun `assignments reference valid lecturers and rubrics`() {
        MockData.assignments.forEach { assignment ->
            assertTrue(
                "Assignment ${assignment.id} references an unknown lecturer",
                MockData.lecturers.any { it.id == assignment.lecturerId }
            )
            assertTrue(
                "Assignment ${assignment.id} references an unknown rubric",
                MockData.allRubrics.any { it.id == assignment.rubricId }
            )
        }
    }

    @Test
    fun `submissions and feedback preserve referential integrity`() {
        MockData.submissions.forEach { submission ->
            assertTrue(MockData.assignments.any { it.id == submission.assignmentId })
            assertTrue(MockData.students.any { it.id == submission.studentId })
        }
        MockData.allFeedbacks.forEach { feedback ->
            assertTrue(MockData.allGradingResults.any { it.id == feedback.gradingResultId })
        }
    }
}
