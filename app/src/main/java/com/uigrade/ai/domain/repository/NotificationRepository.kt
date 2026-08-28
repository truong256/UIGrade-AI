package com.uigrade.ai.domain.repository

import com.uigrade.ai.domain.model.LecturerNotification

interface NotificationRepository {
    suspend fun getForLecturer(lecturerId: String): List<LecturerNotification>
    suspend fun markRead(notificationId: String): Result<LecturerNotification>
    suspend fun markAllRead(lecturerId: String): Result<Unit>
    suspend fun delete(notificationId: String): Result<Unit>
}
