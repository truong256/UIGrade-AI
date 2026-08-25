package com.uigrade.ai.domain.repository

import com.uigrade.ai.domain.model.Feedback
import com.uigrade.ai.domain.model.GradingResult

/**
 * Repository for AI-generated feedback.
 *
 * Note: This is separate from GradingRepository to enforce the architectural
 * boundary that AI feedback and grading scores are independent systems.
 */
interface FeedbackRepository {
    /**
     * Retrieve already-generated feedback for a grading result.
     */
    suspend fun getFeedbackForResult(gradingResultId: String): Feedback?

    /**
     * Request generation of new feedback based on an existing grading result.
     * The grading result provides the data; AI only produces text.
     */
    suspend fun generateFeedback(gradingResult: GradingResult): Feedback
}
