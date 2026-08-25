package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockData
import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.repository.AssignmentRepository
import kotlinx.coroutines.delay
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockAssignmentRepository @Inject constructor() : AssignmentRepository {

    private val assignments = MockData.assignments.toMutableList()

    override suspend fun getAssignmentsForStudent(studentId: String): List<AssignmentWithStatus> {
        delay(600)
        return assignments.map { assignment ->
            val submission = MockData.submissions.find {
                it.assignmentId == assignment.id && it.studentId == studentId
            }
            val result = if (submission?.gradingResultId != null) {
                MockData.allGradingResults.find { it.id == submission.gradingResultId }
            } else null

            val status = when {
                submission == null -> AssignmentStatus.NOT_SUBMITTED
                submission.gradingResultId != null -> AssignmentStatus.GRADED
                else -> AssignmentStatus.SUBMITTED
            }

            AssignmentWithStatus(
                assignment = assignment,
                status = status,
                score = result?.totalScore,
                submissionId = submission?.id
            )
        }
    }

    override suspend fun getAssignmentsForLecturer(lecturerId: String): List<Assignment> {
        delay(500)
        return assignments.filter { it.lecturerId == lecturerId }
    }

    override suspend fun getAllAssignments(): List<Assignment> {
        delay(500)
        return assignments.toList()
    }

    override suspend fun getAssignmentById(id: String): Assignment? {
        delay(300)
        return assignments.find { it.id == id }
    }

    override suspend fun createAssignment(assignment: Assignment): Assignment {
        delay(700)
        assignments.add(assignment)
        return assignment
    }

    override suspend fun updateAssignment(assignment: Assignment): Assignment {
        delay(700)
        val index = assignments.indexOfFirst { it.id == assignment.id }
        if (index >= 0) assignments[index] = assignment
        return assignment
    }

    override suspend fun deleteAssignment(id: String): Boolean {
        delay(500)
        return assignments.removeIf { it.id == id }
    }
}
