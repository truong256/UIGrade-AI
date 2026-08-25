package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockData
import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.repository.RubricRepository
import kotlinx.coroutines.delay
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockRubricRepository @Inject constructor() : RubricRepository {

    private val rubrics = MockData.allRubrics.toMutableList()

    override suspend fun getRubricById(id: String): Rubric? {
        delay(300)
        return rubrics.find { it.id == id }
    }

    override suspend fun getAllRubrics(): List<Rubric> {
        delay(400)
        return rubrics.toList()
    }

    override suspend fun createRubric(rubric: Rubric): Rubric {
        delay(600)
        rubrics.add(rubric)
        return rubric
    }

    override suspend fun updateRubric(rubric: Rubric): Rubric {
        delay(600)
        val index = rubrics.indexOfFirst { it.id == rubric.id }
        if (index >= 0) rubrics[index] = rubric
        return rubric
    }

    override suspend fun deleteRubric(id: String): Boolean {
        delay(400)
        return rubrics.removeIf { it.id == id }
    }
}
