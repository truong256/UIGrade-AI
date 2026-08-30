/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.ClassMembership
import com.uigrade.ai.domain.model.ClassAnnouncement
import com.uigrade.ai.domain.model.Classroom
import com.uigrade.ai.domain.model.ClassroomStatus
import com.uigrade.ai.domain.model.JoinClassResult
import com.uigrade.ai.domain.model.JoinRequest
import com.uigrade.ai.domain.model.JoinRequestStatus
import com.uigrade.ai.domain.model.LearningMaterial
import com.uigrade.ai.domain.model.LecturerNotification
import com.uigrade.ai.domain.model.LecturerNotificationType
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.StudentNotification
import com.uigrade.ai.domain.model.StudentNotificationType
import com.uigrade.ai.domain.repository.ClassroomRepository
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
        val index = classrooms.indexOfFirst { it.id == classroom.id }
        return if (index >= 0) {
            classrooms[index] = classroom
            Result.success(classroom)
        } else {
            Result.failure(IllegalArgumentException("Không tìm thấy lớp học"))
        }
    }

    override suspend fun getClassroomById(classroomId: String): Classroom? {
        return classrooms.find { it.id == classroomId }
    }

    override suspend fun getClassroomsForLecturer(lecturerId: String): List<Classroom> {
        return classrooms.filter { it.lecturerId == lecturerId }
    }

    override suspend fun getClassroomsForStudent(studentId: String): List<Classroom> {
        val enrolledIds = memberships.filter { it.studentId == studentId }.map { it.classroomId }.toSet()
        return classrooms.filter { it.id in enrolledIds }
    }

    override suspend fun findByJoinCode(joinCode: String): Classroom? {
        return classrooms.find { it.joinCode.equals(joinCode.trim(), ignoreCase = true) }
    }

    override suspend fun joinClassroom(joinCode: String, studentId: String): Result<ClassMembership> {
        val classroom = classrooms.find { it.joinCode.equals(joinCode.trim(), ignoreCase = true) }
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy lớp học"))

        if (classroom.status == ClassroomStatus.ARCHIVED)
            return Result.failure(IllegalArgumentException("Lớp học này đã được lưu trữ"))
        if (!classroom.joinEnabled)
            return Result.failure(IllegalArgumentException("Giảng viên đang tạm dừng nhận sinh viên mới"))

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

    override suspend fun requestJoinClassroom(joinCode: String, studentId: String): Result<JoinClassResult> {
        val code = joinCode.trim().uppercase()
        val classroom = classrooms.find { it.joinCode.equals(code, ignoreCase = true) }
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy lớp học với mã này."))
        if (classroom.status == ClassroomStatus.ARCHIVED) {
            return Result.failure(IllegalArgumentException("Mã lớp đã hết hiệu lực."))
        }
        if (!classroom.joinEnabled) {
            return Result.failure(IllegalArgumentException("Lớp học hiện không nhận thêm sinh viên."))
        }
        if (memberships.any { it.classroomId == classroom.id && it.studentId == studentId }) {
            return Result.failure(IllegalArgumentException("Bạn đã tham gia lớp học này."))
        }
        val pending = dataStore.joinRequests.find {
            it.classroomId == classroom.id && it.studentId == studentId && it.status == JoinRequestStatus.PENDING
        }
        if (pending != null) {
            return Result.failure(IllegalStateException("Yêu cầu tham gia của bạn đang chờ giảng viên duyệt."))
        }

        return if (classroom.requiresApproval) {
            val request = JoinRequest(
                id = UUID.randomUUID().toString(),
                classroomId = classroom.id,
                studentId = studentId,
                requestedAt = LocalDateTime.now()
            )
            dataStore.joinRequests.add(request)
            dataStore.notifications.add(
                LecturerNotification(
                    id = UUID.randomUUID().toString(),
                    lecturerId = classroom.lecturerId,
                    title = "Yêu cầu tham gia lớp",
                    message = "${users.find { it.id == studentId }?.name ?: "Sinh viên"} muốn tham gia ${classroom.name}.",
                    type = LecturerNotificationType.JOIN_REQUEST,
                    createdAt = LocalDateTime.now(),
                    classroomId = classroom.id
                )
            )
            Result.success(JoinClassResult.Pending(classroom, request))
        } else {
            val membership = ClassMembership(classroom.id, studentId, LocalDateTime.now())
            memberships.add(membership)
            Result.success(JoinClassResult.Joined(classroom, membership))
        }
    }

    override suspend fun regenerateJoinCode(classroomId: String): Result<String> {
        val index = classrooms.indexOfFirst { it.id == classroomId }
        if (index < 0) return Result.failure(IllegalArgumentException("Không tìm thấy lớp học"))
        val newCode = generateUniqueJoinCode()
        classrooms[index] = classrooms[index].copy(joinCode = newCode)
        return Result.success(newCode)
    }

    override suspend fun getStudentsInClassroom(classroomId: String): List<User> {
        val studentIds = memberships.filter { it.classroomId == classroomId }.map { it.studentId }.toSet()
        return users.filter { it.id in studentIds }
    }

    override suspend fun archiveClassroom(classroomId: String): Result<Unit> {
        val index = classrooms.indexOfFirst { it.id == classroomId }
        return if (index >= 0) {
            classrooms[index] = classrooms[index].copy(status = ClassroomStatus.ARCHIVED)
            Result.success(Unit)
        } else {
            Result.failure(IllegalArgumentException("Không tìm thấy lớp học"))
        }
    }

    override suspend fun restoreClassroom(classroomId: String): Result<Unit> {
        val index = classrooms.indexOfFirst { it.id == classroomId }
        return if (index >= 0) {
            classrooms[index] = classrooms[index].copy(status = ClassroomStatus.ACTIVE)
            Result.success(Unit)
        } else {
            Result.failure(IllegalArgumentException("Không tìm thấy lớp học"))
        }
    }

    override suspend fun deleteClassroom(classroomId: String): Result<Unit> {
        val classroom = classrooms.find { it.id == classroomId }
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy lớp học"))
        val hasRelatedData = dataStore.assignments.any { it.classroomId == classroomId } ||
            memberships.any { it.classroomId == classroomId } ||
            dataStore.joinRequests.any { it.classroomId == classroomId }
        if (hasRelatedData) {
            return Result.failure(
                IllegalStateException("Lớp đang có sinh viên hoặc bài tập. Hãy lưu trữ thay vì xóa.")
            )
        }
        classrooms.remove(classroom)
        return Result.success(Unit)
    }

    override suspend fun setJoinEnabled(classroomId: String, enabled: Boolean): Result<Classroom> {
        val index = classrooms.indexOfFirst { it.id == classroomId }
        if (index < 0) return Result.failure(IllegalArgumentException("Không tìm thấy lớp học"))
        val updated = classrooms[index].copy(joinEnabled = enabled)
        classrooms[index] = updated
        return Result.success(updated)
    }

    override suspend fun removeStudent(classroomId: String, studentId: String): Result<Unit> {
        val removed = memberships.removeAll {
            it.classroomId == classroomId && it.studentId == studentId
        }
        return if (removed) Result.success(Unit)
        else Result.failure(IllegalArgumentException("Sinh viên không còn trong lớp học này"))
    }

    override suspend fun getJoinRequests(classroomId: String): List<JoinRequest> {
        return dataStore.joinRequests.filter {
            it.classroomId == classroomId && it.status == JoinRequestStatus.PENDING
        }
    }

    override suspend fun getJoinRequestsForStudent(studentId: String): List<JoinRequest> {
        return dataStore.joinRequests
            .filter { it.studentId == studentId }
            .sortedByDescending { it.requestedAt }
    }

    override suspend fun cancelJoinRequest(requestId: String, studentId: String): Result<Unit> {
        val request = dataStore.joinRequests.find { it.id == requestId && it.studentId == studentId }
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy yêu cầu tham gia."))
        if (request.status != JoinRequestStatus.PENDING) {
            return Result.failure(IllegalStateException("Chỉ có thể hủy yêu cầu đang chờ duyệt."))
        }
        dataStore.joinRequests.remove(request)
        return Result.success(Unit)
    }

    override suspend fun respondToJoinRequest(requestId: String, approve: Boolean): Result<JoinRequest> {
        val index = dataStore.joinRequests.indexOfFirst { it.id == requestId }
        if (index < 0) return Result.failure(IllegalArgumentException("Không tìm thấy yêu cầu tham gia"))
        val request = dataStore.joinRequests[index]
        if (request.status != JoinRequestStatus.PENDING) {
            return Result.failure(IllegalStateException("Yêu cầu này đã được xử lý"))
        }
        val updated = request.copy(
            status = if (approve) JoinRequestStatus.APPROVED else JoinRequestStatus.REJECTED
        )
        dataStore.joinRequests[index] = updated
        if (approve && memberships.none {
                it.classroomId == request.classroomId && it.studentId == request.studentId
            }) {
            memberships.add(ClassMembership(request.classroomId, request.studentId, LocalDateTime.now()))
        }
        val classroom = classrooms.find { it.id == request.classroomId }
        val student = users.find { it.id == request.studentId }
        if (classroom != null) {
            dataStore.notifications.add(
                LecturerNotification(
                    id = UUID.randomUUID().toString(),
                    lecturerId = classroom.lecturerId,
                    title = if (approve) "Đã duyệt sinh viên" else "Đã từ chối yêu cầu",
                    message = "${student?.name ?: "Sinh viên"}: ${if (approve) "đã được thêm vào lớp" else "yêu cầu đã bị từ chối"}.",
                    type = LecturerNotificationType.CLASSROOM_ACTIVITY,
                    createdAt = LocalDateTime.now(),
                    isRead = true,
                    classroomId = classroom.id
                )
            )
            dataStore.studentNotifications.add(
                StudentNotification(
                    id = UUID.randomUUID().toString(),
                    studentId = request.studentId,
                    title = if (approve) "Yêu cầu đã được chấp nhận" else "Yêu cầu đã bị từ chối",
                    message = if (approve) {
                        "Bạn đã được thêm vào lớp ${classroom.name}."
                    } else {
                        "Yêu cầu tham gia lớp ${classroom.name} chưa được chấp nhận."
                    },
                    type = if (approve) StudentNotificationType.JOIN_APPROVED else StudentNotificationType.JOIN_REJECTED,
                    createdAt = LocalDateTime.now(),
                    classroomId = classroom.id,
                    joinRequestId = request.id
                )
            )
        }
        return Result.success(updated)
    }

    override suspend fun isStudentEnrolled(classroomId: String, studentId: String): Boolean {
        return memberships.any { it.classroomId == classroomId && it.studentId == studentId }
    }

    override suspend fun getMembershipsForStudent(studentId: String): List<ClassMembership> {
        return memberships.filter { it.studentId == studentId }.sortedByDescending { it.joinedAt }
    }

    override suspend fun leaveClassroom(classroomId: String, studentId: String): Result<Unit> {
        val classroom = classrooms.find { it.id == classroomId }
            ?: return Result.failure(IllegalArgumentException("Không tìm thấy lớp học."))
        if (!classroom.allowStudentLeave) {
            return Result.failure(IllegalStateException("Lớp học này không cho phép sinh viên tự rời lớp."))
        }
        val removed = memberships.removeAll { it.classroomId == classroomId && it.studentId == studentId }
        return if (removed) Result.success(Unit)
        else Result.failure(IllegalArgumentException("Bạn không còn là thành viên của lớp học này."))
    }

    override suspend fun getAnnouncements(classroomId: String): List<ClassAnnouncement> {
        return dataStore.announcements.filter { it.classroomId == classroomId }.sortedByDescending { it.createdAt }
    }

    override suspend fun getLearningMaterials(classroomId: String): List<LearningMaterial> {
        return dataStore.learningMaterials.filter { it.classroomId == classroomId }.sortedByDescending { it.createdAt }
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
