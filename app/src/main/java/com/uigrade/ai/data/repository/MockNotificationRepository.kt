/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.LecturerNotification
import com.uigrade.ai.domain.model.StudentNotification
import com.uigrade.ai.domain.repository.NotificationRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockNotificationRepository @Inject constructor(
    private val dataStore: MockDataStore
) : NotificationRepository {

    override suspend fun getForLecturer(lecturerId: String): List<LecturerNotification> {
        return dataStore.notifications
            .filter { it.lecturerId == lecturerId }
            .sortedByDescending { it.createdAt }
    }

    override suspend fun markRead(notificationId: String): Result<LecturerNotification> {
        val index = dataStore.notifications.indexOfFirst { it.id == notificationId }
        if (index < 0) return Result.failure(IllegalArgumentException("Không tìm thấy thông báo"))
        val updated = dataStore.notifications[index].copy(isRead = true)
        dataStore.notifications[index] = updated
        return Result.success(updated)
    }

    override suspend fun markAllRead(lecturerId: String): Result<Unit> {
        dataStore.notifications.indices.forEach { index ->
            val notification = dataStore.notifications[index]
            if (notification.lecturerId == lecturerId && !notification.isRead) {
                dataStore.notifications[index] = notification.copy(isRead = true)
            }
        }
        return Result.success(Unit)
    }

    override suspend fun delete(notificationId: String): Result<Unit> {
        val removed = dataStore.notifications.removeAll { it.id == notificationId }
        return if (removed) Result.success(Unit)
        else Result.failure(IllegalArgumentException("Không tìm thấy thông báo"))
    }

    override suspend fun getForStudent(studentId: String): List<StudentNotification> {
        return dataStore.studentNotifications
            .filter { it.studentId == studentId }
            .sortedByDescending { it.createdAt }
    }

    override suspend fun markStudentRead(
        notificationId: String,
        studentId: String
    ): Result<StudentNotification> {
        val index = dataStore.studentNotifications.indexOfFirst {
            it.id == notificationId && it.studentId == studentId
        }
        if (index < 0) return Result.failure(IllegalArgumentException("Không tìm thấy thông báo."))
        val updated = dataStore.studentNotifications[index].copy(isRead = true)
        dataStore.studentNotifications[index] = updated
        return Result.success(updated)
    }

    override suspend fun markAllStudentRead(studentId: String): Result<Unit> {
        dataStore.studentNotifications.indices.forEach { index ->
            val notification = dataStore.studentNotifications[index]
            if (notification.studentId == studentId && !notification.isRead) {
                dataStore.studentNotifications[index] = notification.copy(isRead = true)
            }
        }
        return Result.success(Unit)
    }

    override suspend fun deleteStudent(notificationId: String, studentId: String): Result<Unit> {
        val removed = dataStore.studentNotifications.removeAll {
            it.id == notificationId && it.studentId == studentId
        }
        return if (removed) Result.success(Unit)
        else Result.failure(IllegalArgumentException("Không tìm thấy thông báo."))
    }
}
