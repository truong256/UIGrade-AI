package com.uigrade.ai.domain.repository

import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.AssignmentWithStatus

interface AssignmentRepository {
    suspend fun getAssignmentsForStudent(studentId: String): List<AssignmentWithStatus>
    suspend fun getAssignmentsForLecturer(lecturerId: String): List<Assignment>
    suspend fun getAllAssignments(): List<Assignment>
    suspend fun getAssignmentById(id: String): Assignment?
    suspend fun createAssignment(assignment: Assignment): Assignment
    suspend fun updateAssignment(assignment: Assignment): Assignment
    suspend fun deleteAssignment(id: String): Boolean
}
