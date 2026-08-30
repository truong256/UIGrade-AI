/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.domain.repository

import com.uigrade.ai.domain.model.LecturerNotification
import com.uigrade.ai.domain.model.StudentNotification

interface NotificationRepository {
    suspend fun getForLecturer(lecturerId: String): List<LecturerNotification>
    suspend fun markRead(notificationId: String): Result<LecturerNotification>
    suspend fun markAllRead(lecturerId: String): Result<Unit>
    suspend fun delete(notificationId: String): Result<Unit>

    suspend fun getForStudent(studentId: String): List<StudentNotification>
    suspend fun markStudentRead(notificationId: String, studentId: String): Result<StudentNotification>
    suspend fun markAllStudentRead(studentId: String): Result<Unit>
    suspend fun deleteStudent(notificationId: String, studentId: String): Result<Unit>
}
