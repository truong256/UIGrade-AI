package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.AssignmentPublishStatus
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.repository.AssignmentRepository
import kotlinx.coroutines.delay
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockAssignmentRepository @Inject constructor(
    private val dataStore: MockDataStore
) : AssignmentRepository {

    private val assignments get() = dataStore.assignments

    private fun submissionStatusFor(assignmentId: String, studentId: String): Pair<AssignmentStatus, String?> {
        val submission = dataStore.submissions.find {
            it.assignmentId == assignmentId && it.studentId == studentId
        }
        val result = if (submission?.gradingResultId != null) {
            dataStore.gradingResults.find { it.id == submission.gradingResultId }
        } else null

        val status = when {
            submission == null -> AssignmentStatus.NOT_SUBMITTED
            result != null -> AssignmentStatus.GRADED
            else -> AssignmentStatus.SUBMITTED
        }
        return status to submission?.id
    }

    override suspend fun getAssignmentsForStudent(studentId: String): List<AssignmentWithStatus> {
        delay(600)
        // Return only PUBLISHED assignments
        return assignments.filter { it.publishStatus == AssignmentPublishStatus.PUBLISHED }.map { assignment ->
            val (status, submissionId) = submissionStatusFor(assignment.id, studentId)
            val result = dataStore.submissions.find {
                it.assignmentId == assignment.id && it.studentId == studentId
            }?.gradingResultId?.let { grId -> dataStore.gradingResults.find { it.id == grId } }
            AssignmentWithStatus(
                assignment = assignment,
                status = status,
                score = result?.totalScore,
                submissionId = submissionId
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

    override suspend fun getPublishedAssignmentsForClassroom(classroomId: String): List<Assignment> {
        delay(400)
        return assignments.filter {
            it.classroomId == classroomId && it.publishStatus == AssignmentPublishStatus.PUBLISHED
        }
    }

    override suspend fun getAllAssignmentsForClassroom(classroomId: String): List<Assignment> {
        delay(400)
        return assignments.filter { it.classroomId == classroomId }
    }

    override suspend fun getAssignmentsForStudentInClassroom(
        studentId: String,
        classroomId: String
    ): List<AssignmentWithStatus> {
        delay(500)
        return assignments
            .filter { it.classroomId == classroomId && it.publishStatus == AssignmentPublishStatus.PUBLISHED }
            .map { assignment ->
                val (status, submissionId) = submissionStatusFor(assignment.id, studentId)
                val result = dataStore.submissions.find {
                    it.assignmentId == assignment.id && it.studentId == studentId
                }?.gradingResultId?.let { grId -> dataStore.gradingResults.find { it.id == grId } }
                AssignmentWithStatus(
                    assignment = assignment,
                    status = status,
                    score = result?.totalScore,
                    submissionId = submissionId
                )
            }
    }
}
