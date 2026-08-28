package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.Feedback
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.repository.FeedbackRepository
import kotlinx.coroutines.delay
import java.time.LocalDateTime
import java.util.UUID
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
class MockFeedbackRepository @Inject constructor(
    private val dataStore: MockDataStore
) : FeedbackRepository {

    private val feedbacks get() = dataStore.feedbacks

    override suspend fun getFeedbackForResult(gradingResultId: String): Feedback? {
        delay(400)
        return feedbacks.find { it.gradingResultId == gradingResultId }
    }

    override suspend fun generateFeedback(gradingResult: GradingResult): Feedback {
        delay(1500) // Simulate AI generation time
        feedbacks.find { it.gradingResultId == gradingResult.id }?.let { return it }

        val strongCriteria = gradingResult.criteriaScores
            .filter { it.percentage >= 0.8f }
            .map { it.criterionName }
        val weakCriteria = gradingResult.criteriaScores
            .filter { it.percentage < 0.6f }
        val generated = Feedback(
            id = UUID.randomUUID().toString(),
            gradingResultId = gradingResult.id,
            summary = "Bản phân tích hỗ trợ được tạo từ kết quả rubric. Giảng viên cần kiểm tra trước khi sử dụng.",
            strengths = strongCriteria.ifEmpty { listOf("Bài làm đã đáp ứng một phần yêu cầu cơ bản") },
            problems = weakCriteria.map {
                com.uigrade.ai.domain.model.FeedbackProblem(
                    ruleId = "manual-${it.criterionId}",
                    metricId = it.criterionId,
                    description = "Tiêu chí ${it.criterionName} đang đạt ${it.earned}/${it.maxScore} điểm.",
                    impact = "Cần đối chiếu lại yêu cầu và minh chứng trong bài nộp."
                )
            },
            recommendations = weakCriteria.map {
                "Bổ sung và hoàn thiện phần ${it.criterionName.lowercase()}."
            }.ifEmpty { listOf("Tiếp tục duy trì chất lượng và kiểm tra accessibility trên nhiều kích thước màn hình.") },
            generatedAt = LocalDateTime.now().toString(),
            modelVersion = "local-assistant-v1"
        )
        feedbacks.add(generated)
        return generated
    }
}
