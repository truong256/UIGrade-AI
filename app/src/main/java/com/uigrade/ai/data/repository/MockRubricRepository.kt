/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.repository.RubricRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockRubricRepository @Inject constructor(
    private val dataStore: MockDataStore
) : RubricRepository {

    private val rubrics get() = dataStore.rubrics

    override suspend fun getRubricById(id: String): Rubric? {
        return rubrics.find { it.id == id }
    }

    override suspend fun getAllRubrics(): List<Rubric> {
        return rubrics.toList()
    }

    override suspend fun createRubric(rubric: Rubric): Rubric {
        require(rubrics.none { it.id == rubric.id }) { "Mã rubric đã tồn tại" }
        rubrics.add(rubric)
        return rubric
    }

    override suspend fun updateRubric(rubric: Rubric): Rubric {
        val index = rubrics.indexOfFirst { it.id == rubric.id }
        if (index < 0) throw IllegalArgumentException("Không tìm thấy rubric")
        rubrics[index] = rubric
        return rubric
    }

    override suspend fun deleteRubric(id: String): Boolean {
        return rubrics.removeIf { it.id == id }
    }
}
