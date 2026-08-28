package com.uigrade.ai.domain.model

import java.time.LocalDateTime

/**
 * Status of a classroom.
 */
enum class ClassroomStatus {
    ACTIVE,
    ARCHIVED
}

/**
 * A classroom created by a lecturer.
 * joinCode is a unique 6-char alphanumeric code (uppercase, no ambiguous chars).
 */
data class Classroom(
    val id: String,
    val name: String,
    val courseCode: String,
    val description: String,
    val lecturerId: String,
    val lecturerName: String,
    val joinCode: String,
    val semester: String,
    val status: ClassroomStatus,
    val createdAt: LocalDateTime,
    val courseName: String = "",
    val academicYear: String = "",
    val schedule: String = "",
    val room: String = "",
    val joinEnabled: Boolean = true
)

/**
 * Records that a student has joined a classroom.
 */
data class ClassMembership(
    val classroomId: String,
    val studentId: String,
    val joinedAt: LocalDateTime
)

enum class JoinRequestStatus {
    PENDING,
    APPROVED,
    REJECTED
}

data class JoinRequest(
    val id: String,
    val classroomId: String,
    val studentId: String,
    val requestedAt: LocalDateTime,
    val status: JoinRequestStatus = JoinRequestStatus.PENDING
)
