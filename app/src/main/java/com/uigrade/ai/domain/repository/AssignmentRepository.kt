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

    /**
     * Get all PUBLISHED assignments for a given classroom.
     * Used by students — only returns publishStatus == PUBLISHED.
     */
    suspend fun getPublishedAssignmentsForClassroom(classroomId: String): List<Assignment>

    /**
     * Get all assignments (any status) for a classroom — lecturer view.
     */
    suspend fun getAllAssignmentsForClassroom(classroomId: String): List<Assignment>

    /**
     * Get assignments for a student filtered to a specific classroom,
     * only returning PUBLISHED ones.
     */
    suspend fun getAssignmentsForStudentInClassroom(
        studentId: String,
        classroomId: String
    ): List<AssignmentWithStatus>
}
