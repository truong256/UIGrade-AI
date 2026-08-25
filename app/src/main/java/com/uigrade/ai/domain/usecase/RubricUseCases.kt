package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.repository.RubricRepository
import javax.inject.Inject

class GetRubricByIdUseCase @Inject constructor(
    private val repository: RubricRepository
) {
    suspend operator fun invoke(id: String): Rubric? =
        repository.getRubricById(id)
}

class GetAllRubricsUseCase @Inject constructor(
    private val repository: RubricRepository
) {
    suspend operator fun invoke(): List<Rubric> =
        repository.getAllRubrics()
}
