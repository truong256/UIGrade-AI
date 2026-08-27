package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.ClassMembership
import com.uigrade.ai.domain.model.Classroom
import com.uigrade.ai.domain.model.ClassroomStatus
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.repository.ClassroomRepository
import kotlinx.coroutines.delay
import java.time.LocalDateTime
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockClassroomRepository @Inject constructor(
    private val dataStore: MockDataStore
) : ClassroomRepository {

    private val classrooms get() = dataStore.classrooms
    private val memberships get() = dataStore.memberships
    private val users get() = dataStore.users

    /** Characters used in join codes — excludes O/0 and I/1 to avoid ambiguity. */
    private val joinCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

    override suspend fun createClassroom(classroom: Classroom): Result<Classroom> {
        delay(700)
        return try {
            val code = generateUniqueJoinCode()
            val saved = classroom.copy(joinCode = code)
            classrooms.add(saved)
            Result.success(saved)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateClassroom(classroom: Classroom): Result<Classroom> {
        delay(600)
        val index = classrooms.indexOfFirst { it.id == classroom.id }
        return if (index >= 0) {
            classrooms[index] = classroom
            Result.success(classroom)
        } else {
            Result.failure(IllegalArgumentException("Không tìm thấy lớp học"))
        }
    }

    override suspend fun getClassroomById(classroomId: String): Classroom? {
        delay(300)
        return classrooms.find { it.id == classroomId }
    }

    override suspend fun getClassroomsForLecturer(lecturerId: String): List<Classroom> {
        delay(500)
        return classrooms.filter { it.lecturerId == lecturerId }
    }

    override suspend fun getClassroomsForStudent(studentId: String): List<Classroom> {
        delay(500)
        val enrolledIds = memberships.filter { it.studentId == studentId }.map { it.classroomId }.toSet()
        return classrooms.filter { it.id in enrolledIds }
    }

    override suspend fun findByJoinCode(joinCode: String): Classroom? {
        delay(400)
        return classrooms.find { it.joinCode.equals(joinCode.trim(), ignoreCase = true) }
    }

    override suspend fun joinClassroom(joinCode: String, studentId: String): Result<ClassMembership> {
        delay(700)
        val classroom = classrooms.find { it.joinCode.equals(joinCode.trim(), ignoreCase = true) }
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy lớp học"))

        if (classroom.status == ClassroomStatus.ARCHIVED)
            return Result.failure(IllegalArgumentException("Lớp học này đã được lưu trữ"))

        val alreadyJoined = memberships.any {
            it.classroomId == classroom.id && it.studentId == studentId
        }
        if (alreadyJoined)
            return Result.failure(IllegalArgumentException("Bạn đã tham gia lớp học này"))

        val membership = ClassMembership(
            classroomId = classroom.id,
            studentId = studentId,
            joinedAt = LocalDateTime.now()
        )
        memberships.add(membership)
        return Result.success(membership)
    }

    override suspend fun regenerateJoinCode(classroomId: String): Result<String> {
        delay(500)
        val index = classrooms.indexOfFirst { it.id == classroomId }
        if (index < 0) return Result.failure(IllegalArgumentException("Không tìm thấy lớp học"))
        val newCode = generateUniqueJoinCode()
        classrooms[index] = classrooms[index].copy(joinCode = newCode)
        return Result.success(newCode)
    }

    override suspend fun getStudentsInClassroom(classroomId: String): List<User> {
        delay(400)
        val studentIds = memberships.filter { it.classroomId == classroomId }.map { it.studentId }.toSet()
        return users.filter { it.id in studentIds }
    }

    override suspend fun archiveClassroom(classroomId: String): Result<Unit> {
        delay(500)
        val index = classrooms.indexOfFirst { it.id == classroomId }
        return if (index >= 0) {
            classrooms[index] = classrooms[index].copy(status = ClassroomStatus.ARCHIVED)
            Result.success(Unit)
        } else {
            Result.failure(IllegalArgumentException("Không tìm thấy lớp học"))
        }
    }

    override suspend fun isStudentEnrolled(classroomId: String, studentId: String): Boolean {
        delay(200)
        return memberships.any { it.classroomId == classroomId && it.studentId == studentId }
    }

    private fun generateUniqueJoinCode(): String {
        var code: String
        var attempts = 0
        do {
            code = (1..6).map { joinCodeChars.random() }.joinToString("")
            attempts++
            if (attempts > 100) throw IllegalStateException("Không thể tạo mã tham gia duy nhất")
        } while (classrooms.any { it.joinCode == code })
        return code
    }
}
