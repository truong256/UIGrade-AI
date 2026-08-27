package com.uigrade.ai.domain.repository

import com.uigrade.ai.domain.model.ClassMembership
import com.uigrade.ai.domain.model.Classroom
import com.uigrade.ai.domain.model.User

interface ClassroomRepository {

    /** Create a new classroom; auto-generates a unique join code. */
    suspend fun createClassroom(classroom: Classroom): Result<Classroom>

    /** Update an existing classroom. */
    suspend fun updateClassroom(classroom: Classroom): Result<Classroom>

    /** Get a single classroom by ID. */
    suspend fun getClassroomById(classroomId: String): Classroom?

    /** Get all classrooms managed by a specific lecturer. */
    suspend fun getClassroomsForLecturer(lecturerId: String): List<Classroom>

    /** Get all classrooms a specific student has joined. */
    suspend fun getClassroomsForStudent(studentId: String): List<Classroom>

    /** Find a classroom by its join code (case-insensitive). */
    suspend fun findByJoinCode(joinCode: String): Classroom?

    /**
     * Enrol a student in a classroom using the join code.
     * Validates: code exists, classroom is active, student not already enrolled.
     */
    suspend fun joinClassroom(joinCode: String, studentId: String): Result<ClassMembership>

    /**
     * Invalidate the current join code and generate a new one.
     * Existing members keep their membership.
     */
    suspend fun regenerateJoinCode(classroomId: String): Result<String>

    /** Return all users (students) enrolled in a classroom. */
    suspend fun getStudentsInClassroom(classroomId: String): List<User>

    /** Archive a classroom; students can no longer join. */
    suspend fun archiveClassroom(classroomId: String): Result<Unit>

    /** Check whether a student is enrolled in a classroom. */
    suspend fun isStudentEnrolled(classroomId: String, studentId: String): Boolean
}
