package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.AssignmentWithStatus
import com.uigrade.ai.domain.repository.AssignmentRepository
import javax.inject.Inject

class GetAssignmentsForStudentUseCase @Inject constructor(
    private val repository: AssignmentRepository
) {
    suspend operator fun invoke(studentId: String): List<AssignmentWithStatus> =
        repository.getAssignmentsForStudent(studentId)
}

class GetAssignmentsForLecturerUseCase @Inject constructor(
    private val repository: AssignmentRepository
) {
    suspend operator fun invoke(lecturerId: String): List<Assignment> =
        repository.getAssignmentsForLecturer(lecturerId)
}

class GetAssignmentByIdUseCase @Inject constructor(
    private val repository: AssignmentRepository
) {
    suspend operator fun invoke(id: String): Assignment? =
        repository.getAssignmentById(id)
}

class GetAllAssignmentsUseCase @Inject constructor(
    private val repository: AssignmentRepository
) {
    suspend operator fun invoke(): List<Assignment> =
        repository.getAllAssignments()
}
