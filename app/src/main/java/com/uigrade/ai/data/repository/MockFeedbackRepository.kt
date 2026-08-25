package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockData
import com.uigrade.ai.domain.model.Feedback
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.repository.FeedbackRepository
import kotlinx.coroutines.delay
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Mock implementation of FeedbackRepository.
 *
 * In production, this would call an AI service passing the completed GradingResult.
 * The AI service is ONLY allowed to return text fields (summary, strengths, problems,
 * recommendations). It cannot modify or produce score values.
 */
@Singleton
class MockFeedbackRepository @Inject constructor() : FeedbackRepository {

    private val feedbacks = MockData.allFeedbacks.toMutableList()

    override suspend fun getFeedbackForResult(gradingResultId: String): Feedback? {
        delay(400)
        return feedbacks.find { it.gradingResultId == gradingResultId }
    }

    override suspend fun generateFeedback(gradingResult: GradingResult): Feedback {
        delay(1500) // Simulate AI generation time
        // In MVP, return existing feedback if available; otherwise return a generic one.
        return feedbacks.find { it.gradingResultId == gradingResult.id }
            ?: feedbacks.first()
    }
}
