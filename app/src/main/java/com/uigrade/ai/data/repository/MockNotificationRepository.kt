package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.LecturerNotification
import com.uigrade.ai.domain.model.StudentNotification
import com.uigrade.ai.domain.repository.NotificationRepository
import kotlinx.coroutines.delay
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockNotificationRepository @Inject constructor(
    private val dataStore: MockDataStore
) : NotificationRepository {

    override suspend fun getForLecturer(lecturerId: String): List<LecturerNotification> {
        delay(350)
        return dataStore.notifications
            .filter { it.lecturerId == lecturerId }
            .sortedByDescending { it.createdAt }
    }

    override suspend fun markRead(notificationId: String): Result<LecturerNotification> {
        delay(250)
        val index = dataStore.notifications.indexOfFirst { it.id == notificationId }
        if (index < 0) return Result.failure(IllegalArgumentException("Không tìm thấy thông báo"))
        val updated = dataStore.notifications[index].copy(isRead = true)
        dataStore.notifications[index] = updated
        return Result.success(updated)
    }

    override suspend fun markAllRead(lecturerId: String): Result<Unit> {
        delay(300)
        dataStore.notifications.indices.forEach { index ->
            val notification = dataStore.notifications[index]
            if (notification.lecturerId == lecturerId && !notification.isRead) {
                dataStore.notifications[index] = notification.copy(isRead = true)
            }
        }
        return Result.success(Unit)
    }

    override suspend fun delete(notificationId: String): Result<Unit> {
        delay(250)
        val removed = dataStore.notifications.removeAll { it.id == notificationId }
        return if (removed) Result.success(Unit)
        else Result.failure(IllegalArgumentException("Không tìm thấy thông báo"))
    }

    override suspend fun getForStudent(studentId: String): List<StudentNotification> {
        delay(350)
        return dataStore.studentNotifications
            .filter { it.studentId == studentId }
            .sortedByDescending { it.createdAt }
    }

    override suspend fun markStudentRead(
        notificationId: String,
        studentId: String
    ): Result<StudentNotification> {
        delay(250)
        val index = dataStore.studentNotifications.indexOfFirst {
            it.id == notificationId && it.studentId == studentId
        }
        if (index < 0) return Result.failure(IllegalArgumentException("Không tìm thấy thông báo."))
        val updated = dataStore.studentNotifications[index].copy(isRead = true)
        dataStore.studentNotifications[index] = updated
        return Result.success(updated)
    }

    override suspend fun markAllStudentRead(studentId: String): Result<Unit> {
        delay(300)
        dataStore.studentNotifications.indices.forEach { index ->
            val notification = dataStore.studentNotifications[index]
            if (notification.studentId == studentId && !notification.isRead) {
                dataStore.studentNotifications[index] = notification.copy(isRead = true)
            }
        }
        return Result.success(Unit)
    }

    override suspend fun deleteStudent(notificationId: String, studentId: String): Result<Unit> {
        delay(250)
        val removed = dataStore.studentNotifications.removeAll {
            it.id == notificationId && it.studentId == studentId
        }
        return if (removed) Result.success(Unit)
        else Result.failure(IllegalArgumentException("Không tìm thấy thông báo."))
    }
}
