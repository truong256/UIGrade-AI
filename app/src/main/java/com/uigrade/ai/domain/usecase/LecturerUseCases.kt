/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.LecturerNotification
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.repository.AuthRepository
import com.uigrade.ai.domain.repository.NotificationRepository
import com.uigrade.ai.domain.repository.UserRepository
import javax.inject.Inject

class GetLecturerNotificationsUseCase @Inject constructor(
    private val repository: NotificationRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(): Result<List<LecturerNotification>> {
        val lecturer = requireLecturer(authRepository).getOrElse { return Result.failure(it) }
        return runCatching { repository.getForLecturer(lecturer.id) }
    }
}

class MarkLecturerNotificationReadUseCase @Inject constructor(
    private val repository: NotificationRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(notificationId: String): Result<LecturerNotification> {
        val lecturer = requireLecturer(authRepository).getOrElse { return Result.failure(it) }
        if (repository.getForLecturer(lecturer.id).none { it.id == notificationId }) {
            return Result.failure(IllegalArgumentException("Không tìm thấy thông báo"))
        }
        return repository.markRead(notificationId)
    }
}

class MarkAllLecturerNotificationsReadUseCase @Inject constructor(
    private val repository: NotificationRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(): Result<Unit> {
        val lecturer = requireLecturer(authRepository).getOrElse { return Result.failure(it) }
        return repository.markAllRead(lecturer.id)
    }
}

class DeleteLecturerNotificationUseCase @Inject constructor(
    private val repository: NotificationRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(notificationId: String): Result<Unit> {
        val lecturer = requireLecturer(authRepository).getOrElse { return Result.failure(it) }
        if (repository.getForLecturer(lecturer.id).none { it.id == notificationId }) {
            return Result.failure(IllegalArgumentException("Không tìm thấy thông báo"))
        }
        return repository.delete(notificationId)
    }
}

class UpdateLecturerProfileUseCase @Inject constructor(
    private val userRepository: UserRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(
        name: String,
        phone: String,
        department: String,
        organization: String,
        bio: String,
        avatarUrl: String?
    ): Result<User> {
        val lecturer = requireLecturer(authRepository).getOrElse { return Result.failure(it) }
        if (name.trim().isBlank()) {
            return Result.failure(IllegalArgumentException("Vui lòng nhập họ và tên."))
        }
        if (phone.isNotBlank() && !phone.matches("^[0-9+ ]{8,15}$".toRegex())) {
            return Result.failure(IllegalArgumentException("Số điện thoại không hợp lệ."))
        }
        return runCatching {
            userRepository.updateUser(
                lecturer.copy(
                    name = name.trim(),
                    phone = phone.trim(),
                    department = department.trim(),
                    organization = organization.trim(),
                    bio = bio.trim(),
                    avatarUrl = avatarUrl
                )
            )
        }
    }
}

class ChangePasswordUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(
        currentPassword: String,
        newPassword: String,
        confirmPassword: String
    ): Result<Unit> {
        if (currentPassword.isBlank()) {
            return Result.failure(IllegalArgumentException("Vui lòng nhập mật khẩu hiện tại."))
        }
        if (newPassword.length < 8) {
            return Result.failure(IllegalArgumentException("Mật khẩu mới phải có ít nhất 8 ký tự."))
        }
        if (newPassword != confirmPassword) {
            return Result.failure(IllegalArgumentException("Mật khẩu xác nhận không khớp."))
        }
        if (newPassword == currentPassword) {
            return Result.failure(IllegalArgumentException("Mật khẩu mới phải khác mật khẩu hiện tại."))
        }
        return authRepository.changePassword(currentPassword, newPassword)
    }
}

private suspend fun requireLecturer(authRepository: AuthRepository): Result<User> {
    val user = authRepository.getCurrentUser()
        ?: return Result.failure(IllegalArgumentException("Bạn chưa đăng nhập"))
    if (user.role != UserRole.LECTURER) {
        return Result.failure(IllegalArgumentException("Bạn không có quyền truy cập chức năng giảng viên"))
    }
    return Result.success(user)
}
