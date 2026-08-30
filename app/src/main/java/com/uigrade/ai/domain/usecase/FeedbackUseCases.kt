/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.Feedback
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.repository.FeedbackRepository
import javax.inject.Inject

class GetFeedbackForResultUseCase @Inject constructor(
    private val repository: FeedbackRepository
) {
    suspend operator fun invoke(gradingResultId: String): Feedback? =
        repository.getFeedbackForResult(gradingResultId)
}

class GenerateFeedbackUseCase @Inject constructor(
    private val repository: FeedbackRepository
) {
    suspend operator fun invoke(gradingResult: GradingResult): Result<Feedback> =
        runCatching { repository.generateFeedback(gradingResult) }
}
