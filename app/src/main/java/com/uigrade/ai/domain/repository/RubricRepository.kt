package com.uigrade.ai.domain.repository

import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.model.RubricCriterion

interface RubricRepository {
    suspend fun getRubricById(id: String): Rubric?
    suspend fun getAllRubrics(): List<Rubric>
    suspend fun createRubric(rubric: Rubric): Rubric
    suspend fun updateRubric(rubric: Rubric): Rubric
    suspend fun deleteRubric(id: String): Boolean
}
