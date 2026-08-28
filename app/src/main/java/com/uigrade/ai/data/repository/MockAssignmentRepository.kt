package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.AssignmentPublishStatus
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.repository.AssignmentRepository
import com.uigrade.ai.domain.usecase.StudentAssignmentPolicy
import kotlinx.coroutines.delay
import java.time.LocalDateTime
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockAssignmentRepository @Inject constructor(
    private val dataStore: MockDataStore
) : AssignmentRepository {

    private val assignments get() = dataStore.assignments

    private fun assignmentWithStatus(assignment: Assignment, studentId: String): AssignmentWithStatus {
        val history = dataStore.submissions
            .filter { it.assignmentId == assignment.id && it.studentId == studentId }
        val latestSubmission = history
            .maxWithOrNull(compareBy<com.uigrade.ai.domain.model.Submission> { it.attemptNumber }.thenBy { it.savedAt })
        val releasedResult = history.asSequence()
            .mapNotNull { submission ->
                dataStore.gradingResults.find {
                    it.submissionId == submission.id && it.studentId == studentId && it.isReleased && !it.isDraft
                }
            }
            .maxByOrNull { it.gradedAt }
        val attemptsUsed = history.count { !it.isDraft }
        val status = StudentAssignmentPolicy.resolve(
            assignment = assignment,
            submissions = history,
            releasedGrade = releasedResult,
            now = LocalDateTime.now()
        )
        return AssignmentWithStatus(
            assignment = assignment,
            status = status,
            score = releasedResult?.totalScore,
            submissionId = latestSubmission?.id,
            latestSubmission = latestSubmission,
            attemptsUsed = attemptsUsed,
            attemptsRemaining = (assignment.maxAttempts - attemptsUsed).coerceAtLeast(0),
            disabledReason = StudentAssignmentPolicy.disabledReason(assignment, status, attemptsUsed)
        )
    }

    override suspend fun getAssignmentsForStudent(studentId: String): List<AssignmentWithStatus> {
        delay(600)
        val enrolledIds = dataStore.memberships
            .filter { it.studentId == studentId }
            .map { it.classroomId }
            .toSet()
        return assignments
            .filter {
                it.classroomId in enrolledIds &&
                    it.publishStatus != AssignmentPublishStatus.DRAFT &&
                    !it.isArchived
            }
            .map { assignmentWithStatus(it, studentId) }
            .sortedBy { it.assignment.deadline }
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
        require(assignments.none { it.id == assignment.id }) { "Mã bài tập đã tồn tại" }
        assignments.add(assignment)
        return assignment
    }

    override suspend fun updateAssignment(assignment: Assignment): Assignment {
        delay(700)
        val index = assignments.indexOfFirst { it.id == assignment.id }
        if (index < 0) throw IllegalArgumentException("Không tìm thấy bài tập")
        assignments[index] = assignment
        return assignment
    }

    override suspend fun deleteAssignment(id: String): Boolean {
        delay(500)
        return assignments.removeIf { it.id == id }
    }

    override suspend fun getPublishedAssignmentsForClassroom(classroomId: String): List<Assignment> {
        delay(400)
        return assignments.filter {
            it.classroomId == classroomId &&
                it.publishStatus == AssignmentPublishStatus.PUBLISHED &&
                !it.isArchived
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
            .filter {
                it.classroomId == classroomId &&
                    it.publishStatus != AssignmentPublishStatus.DRAFT &&
                    !it.isArchived
            }
            .takeIf {
                dataStore.memberships.any { membership ->
                    membership.classroomId == classroomId && membership.studentId == studentId
                }
            }
            .orEmpty()
            .map { assignmentWithStatus(it, studentId) }
            .sortedBy { it.assignment.deadline }
    }
}
