/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.data.repository

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.domain.model.AdminStats
import com.uigrade.ai.domain.model.AuditAction
import com.uigrade.ai.domain.model.AuditOutcome
import com.uigrade.ai.domain.model.FeedbackStats
import com.uigrade.ai.domain.model.GradingJobStats
import com.uigrade.ai.domain.model.LogLevel
import com.uigrade.ai.domain.model.Metric
import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.model.Rule
import com.uigrade.ai.domain.model.SubmissionStatus
import com.uigrade.ai.domain.model.SystemLog
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserAccountStatus
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.repository.AdminRepository
import java.time.LocalDateTime
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockAdminRepository @Inject constructor(
    private val dataStore: MockDataStore
) : AdminRepository {

    override suspend fun getStats(adminId: String): AdminStats = execute(
        adminId = adminId,
        action = AuditAction.SYSTEM_EVENT,
        targetType = "Dashboard",
        targetId = null,
        recordSuccess = false
    ) {
        val completed = dataStore.gradingResults.size
        val pending = dataStore.submissions.count {
            !it.isDraft && it.status in setOf(
                SubmissionStatus.PENDING,
                SubmissionStatus.PROCESSING,
                SubmissionStatus.SUBMITTED,
                SubmissionStatus.LATE
            )
        }
        AdminStats(
            totalStudents = dataStore.users.count { it.role == UserRole.STUDENT },
            totalLecturers = dataStore.users.count { it.role == UserRole.LECTURER },
            totalAdmins = dataStore.users.count { it.role == UserRole.ADMIN },
            gradingJobs = GradingJobStats(
                completed = completed,
                failed = dataStore.submissions.count { it.status == SubmissionStatus.FAILED },
                pending = pending
            ),
            feedbackStats = FeedbackStats(dataStore.feedbacks.size, 0),
            aiEnabled = dataStore.aiFeedbackEnabled,
            activeUsers = dataStore.users.count { it.accountStatus == UserAccountStatus.ACTIVE },
            lockedUsers = dataStore.users.count { it.accountStatus == UserAccountStatus.LOCKED },
            totalClassrooms = dataStore.classrooms.size,
            totalAssignments = dataStore.assignments.size,
            totalSubmissions = dataStore.submissions.count { !it.isDraft },
            pendingGrading = pending,
            activeRubrics = dataStore.rubrics.count { it.isActive },
            recentAlerts = dataStore.systemLogs.count { it.level != LogLevel.INFO }
        )
    }

    override suspend fun getUsers(adminId: String): List<User> = execute(
        adminId, AuditAction.SYSTEM_EVENT, "Người dùng", null, recordSuccess = false
    ) { dataStore.users.toList() }

    override suspend fun setAiFeedbackEnabled(adminId: String, enabled: Boolean) {
        execute(adminId, AuditAction.SYSTEM_EVENT, "Cấu hình AI", null) {
            dataStore.aiFeedbackEnabled = enabled
        }
    }

    override suspend fun createUser(adminId: String, user: User): User = execute(
        adminId, AuditAction.CREATE_USER, "Người dùng", user.email
    ) {
        validateUser(user, isNew = true)
        val created = user.copy(
            id = "user-${System.currentTimeMillis()}",
            name = user.name.trim(),
            email = user.email.trim().lowercase(),
            studentId = user.studentId?.trim()?.ifBlank { null },
            staffId = user.staffId?.trim()?.ifBlank { null },
            accountStatus = UserAccountStatus.PENDING,
            createdAt = LocalDateTime.now(),
            lastLoginAt = null,
            isSuperAdmin = false
        )
        dataStore.users.add(created)
        created
    }

    override suspend fun updateUser(adminId: String, user: User): User = execute(
        adminId, AuditAction.UPDATE_USER, "Người dùng", user.id
    ) { actor ->
        val index = dataStore.users.indexOfFirst { it.id == user.id }
        require(index >= 0) { "Không tìm thấy người dùng." }
        val existing = dataStore.users[index]
        require(actor.id != existing.id || user.role == UserRole.ADMIN) {
            "Bạn không thể tự thay đổi vai trò quản trị của mình."
        }
        if (existing.isSuperAdmin && user.role != UserRole.ADMIN) {
            require(activeSuperAdmins() > 1) { "Không thể thay đổi Super Admin cuối cùng." }
        }
        validateUser(user, isNew = false)
        val updated = user.copy(
            name = user.name.trim(),
            email = user.email.trim().lowercase(),
            studentId = user.studentId?.trim()?.ifBlank { null },
            staffId = user.staffId?.trim()?.ifBlank { null },
            accountStatus = existing.accountStatus,
            createdAt = existing.createdAt,
            lastLoginAt = existing.lastLoginAt,
            isSuperAdmin = existing.isSuperAdmin
        )
        dataStore.users[index] = updated
        updated
    }

    override suspend fun setAccountStatus(
        adminId: String,
        userId: String,
        status: UserAccountStatus
    ): User = execute(
        adminId,
        if (status == UserAccountStatus.ACTIVE) AuditAction.UNLOCK_USER else AuditAction.LOCK_USER,
        "Người dùng",
        userId
    ) { actor ->
        val index = dataStore.users.indexOfFirst { it.id == userId }
        require(index >= 0) { "Không tìm thấy người dùng." }
        val target = dataStore.users[index]
        require(actor.id != target.id || status == UserAccountStatus.ACTIVE) {
            "Admin không được tự khóa hoặc vô hiệu hóa chính mình."
        }
        if (target.isSuperAdmin && status != UserAccountStatus.ACTIVE) {
            require(activeSuperAdmins() > 1) { "Không thể khóa Super Admin cuối cùng." }
        }
        target.copy(accountStatus = status).also { dataStore.users[index] = it }
    }

    override suspend fun requestPasswordReset(adminId: String, userId: String) {
        execute(adminId, AuditAction.RESET_PASSWORD, "Người dùng", userId) {
            require(dataStore.users.any { user -> user.id == userId }) { "Không tìm thấy người dùng." }
        }
    }

    override suspend fun deleteUser(adminId: String, userId: String) {
        execute(adminId, AuditAction.DELETE_USER, "Người dùng", userId) { actor ->
            val target = dataStore.users.find { it.id == userId }
                ?: throw IllegalArgumentException("Không tìm thấy người dùng.")
            require(actor.id != target.id) { "Admin không được tự xóa tài khoản đang đăng nhập." }
            if (target.isSuperAdmin) {
                require(activeSuperAdmins() > 1) { "Không thể xóa Super Admin cuối cùng." }
            }
            val hasHistory = dataStore.submissions.any { it.studentId == userId } ||
                dataStore.memberships.any { it.studentId == userId } ||
                dataStore.classrooms.any { it.lecturerId == userId }
            require(!hasHistory) {
                "Tài khoản có dữ liệu học tập. Hãy vô hiệu hóa để bảo toàn lịch sử."
            }
            dataStore.users.remove(target)
        }
    }

    override suspend fun getRubrics(adminId: String): List<Rubric> = execute(
        adminId, AuditAction.SYSTEM_EVENT, "Rubric", null, recordSuccess = false
    ) { dataStore.rubrics.toList() }

    override suspend fun duplicateRubric(adminId: String, rubricId: String): Rubric = execute(
        adminId, AuditAction.COPY_RUBRIC, "Rubric", rubricId
    ) {
        val source = dataStore.rubrics.find { it.id == rubricId }
            ?: throw IllegalArgumentException("Không tìm thấy rubric.")
        validateRubric(source)
        val suffix = System.currentTimeMillis().toString().takeLast(6)
        val copy = source.copy(
            id = "rubric-copy-$suffix",
            title = "${source.title} (Bản sao)",
            version = "1.0",
            criteria = source.criteria.map { criterion ->
                criterion.copy(
                    id = "${criterion.id}-$suffix",
                    rules = criterion.rules.map { rule ->
                        rule.copy(id = "${rule.id}-$suffix", result = null, earnedScore = null)
                    }
                )
            },
            isActive = false,
            usedByAssignmentIds = emptyList()
        )
        dataStore.rubrics.add(copy)
        dataStore.adminRules.addAll(copy.criteria.flatMap { it.rules })
        copy
    }

    override suspend fun setRubricActive(adminId: String, rubricId: String, active: Boolean): Rubric = execute(
        adminId, AuditAction.UPDATE_RUBRIC, "Rubric", rubricId
    ) {
        val index = dataStore.rubrics.indexOfFirst { it.id == rubricId }
        require(index >= 0) { "Không tìm thấy rubric." }
        dataStore.rubrics[index].copy(isActive = active).also { dataStore.rubrics[index] = it }
    }

    override suspend fun deleteRubric(adminId: String, rubricId: String) {
        execute(adminId, AuditAction.DELETE_RUBRIC, "Rubric", rubricId) {
            val rubric = dataStore.rubrics.find { it.id == rubricId }
                ?: throw IllegalArgumentException("Không tìm thấy rubric.")
            require(rubric.usedByAssignmentIds.isEmpty()) {
                "Rubric đang được sử dụng và không thể xóa."
            }
            dataStore.rubrics.remove(rubric)
        }
    }

    override suspend fun getRules(adminId: String): List<Rule> = execute(
        adminId, AuditAction.SYSTEM_EVENT, "Rule", null, recordSuccess = false
    ) { dataStore.adminRules.toList() }

    override suspend fun updateRule(adminId: String, rule: Rule): Rule = execute(
        adminId, AuditAction.UPDATE_RULE, "Rule", rule.id
    ) {
        validateRule(rule)
        require(dataStore.adminRules.none { it.id != rule.id && it.description.equals(rule.description.trim(), true) && it.threshold == rule.threshold }) {
            "Quy tắc trùng hoàn toàn với quy tắc hiện có."
        }
        val index = dataStore.adminRules.indexOfFirst { it.id == rule.id }
        require(index >= 0) { "Không tìm thấy quy tắc." }
        rule.copy(description = rule.description.trim()).also { dataStore.adminRules[index] = it }
    }

    override suspend fun setRuleActive(adminId: String, ruleId: String, active: Boolean): Rule {
        val rule = dataStore.adminRules.find { it.id == ruleId }
            ?: throw IllegalArgumentException("Không tìm thấy quy tắc.")
        return updateRule(adminId, rule.copy(isActive = active))
    }

    override suspend fun getMetrics(adminId: String): List<Metric> = execute(
        adminId, AuditAction.SYSTEM_EVENT, "Metric", null, recordSuccess = false
    ) { dataStore.adminMetrics.toList() }

    override suspend fun updateMetric(adminId: String, metric: Metric): Metric = execute(
        adminId, AuditAction.UPDATE_METRIC, "Metric", metric.id
    ) {
        require(metric.name.trim().isNotEmpty()) { "Tên metric không được để trống." }
        require(metric.minValue == null || metric.maxValue == null || metric.minValue <= metric.maxValue) {
            "Giá trị nhỏ nhất không được lớn hơn giá trị lớn nhất."
        }
        val index = dataStore.adminMetrics.indexOfFirst { it.id == metric.id }
        require(index >= 0) { "Không tìm thấy metric." }
        metric.copy(name = metric.name.trim()).also { dataStore.adminMetrics[index] = it }
    }

    override suspend fun setMetricActive(adminId: String, metricId: String, active: Boolean): Metric {
        val metric = dataStore.adminMetrics.find { it.id == metricId }
            ?: throw IllegalArgumentException("Không tìm thấy metric.")
        return updateMetric(adminId, metric.copy(isActive = active))
    }

    override suspend fun getAuditLogs(adminId: String): List<SystemLog> = execute(
        adminId, AuditAction.SYSTEM_EVENT, "Audit log", null, recordSuccess = false
    ) { dataStore.systemLogs.sortedByDescending { it.timestamp } }

    private fun validateUser(user: User, isNew: Boolean) {
        require(user.name.trim().length >= 2) { "Họ tên phải có ít nhất 2 ký tự." }
        require(EMAIL_REGEX.matches(user.email.trim())) { "Email không đúng định dạng." }
        require(dataStore.users.none { existing ->
            existing.email.equals(user.email.trim(), true) && (isNew || existing.id != user.id)
        }) { "Email này đã được sử dụng." }
        if (user.role == UserRole.STUDENT) {
            require(!user.studentId.isNullOrBlank()) { "Vui lòng nhập mã sinh viên." }
            require(dataStore.users.none { existing ->
                existing.studentId.equals(user.studentId?.trim(), true) && (isNew || existing.id != user.id)
            }) { "Mã sinh viên đã tồn tại." }
        }
        if (user.role == UserRole.LECTURER && !user.staffId.isNullOrBlank()) {
            require(dataStore.users.none { existing ->
                existing.staffId.equals(user.staffId?.trim(), true) && (isNew || existing.id != user.id)
            }) { "Mã giảng viên đã tồn tại." }
        }
    }

    private fun validateRubric(rubric: Rubric) {
        require(rubric.title.trim().isNotEmpty()) { "Tên rubric không được để trống." }
        require(rubric.criteria.isNotEmpty()) { "Rubric phải có ít nhất một tiêu chí." }
        require(rubric.criteria.sumOf { it.weightPercent } == 100) { "Tổng trọng số tiêu chí phải bằng 100%." }
        require(rubric.criteria.all { it.maxScore > 0 }) { "Điểm tối đa phải lớn hơn 0." }
        val names = rubric.criteria.map { it.name.trim().lowercase() }
        require(names.size == names.distinct().size) { "Tên tiêu chí trong rubric không được trùng nhau." }
    }

    private fun validateRule(rule: Rule) {
        require(rule.description.trim().isNotEmpty()) { "Tên hoặc mô tả quy tắc không được để trống." }
        require(rule.threshold.trim().isNotEmpty()) { "Điều kiện quy tắc không được để trống." }
        require(rule.maxScore > 0) { "Điểm tối đa phải lớn hơn 0." }
        require(rule.weight >= 0 && rule.penalty >= 0) { "Trọng số và điểm trừ không được âm." }
    }

    private fun activeSuperAdmins(): Int = dataStore.users.count {
        it.role == UserRole.ADMIN && it.isSuperAdmin && it.accountStatus == UserAccountStatus.ACTIVE
    }

    private inline fun <T> execute(
        adminId: String,
        action: AuditAction,
        targetType: String,
        targetId: String?,
        recordSuccess: Boolean = true,
        block: (User) -> T
    ): T {
        val actor = dataStore.users.find { it.id == adminId }
        if (actor?.role != UserRole.ADMIN || actor.accountStatus != UserAccountStatus.ACTIVE) {
            appendLog(
                actor = actor,
                action = AuditAction.PERMISSION_DENIED,
                targetType = targetType,
                targetId = targetId,
                outcome = AuditOutcome.FAILURE,
                message = "Không đủ quyền thực hiện thao tác quản trị."
            )
            throw SecurityException("Bạn không có quyền thực hiện thao tác này.")
        }
        return try {
            block(actor).also {
                if (recordSuccess) appendLog(actor, action, targetType, targetId, AuditOutcome.SUCCESS, "Thao tác hoàn tất.")
            }
        } catch (error: Exception) {
            appendLog(actor, action, targetType, targetId, AuditOutcome.FAILURE, error.message ?: "Thao tác thất bại.")
            throw error
        }
    }

    private fun appendLog(
        actor: User?,
        action: AuditAction,
        targetType: String,
        targetId: String?,
        outcome: AuditOutcome,
        message: String
    ) {
        val sanitized = message.replace(SENSITIVE_PATTERN, "[ĐÃ ẨN]")
        dataStore.systemLogs.add(
            SystemLog(
                id = "audit-${System.nanoTime()}",
                level = if (outcome == AuditOutcome.SUCCESS) LogLevel.INFO else LogLevel.WARNING,
                tag = "Admin",
                message = sanitized,
                timestamp = LocalDateTime.now().toString(),
                userId = actor?.id,
                action = action,
                actorName = actor?.name ?: "Không xác định",
                targetType = targetType,
                targetId = targetId,
                outcome = outcome,
                description = sanitized
            )
        )
    }

    private companion object {
        val EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$".toRegex()
        val SENSITIVE_PATTERN = "(?i)(password|mật khẩu|access[_ -]?token|secret)(\\s*[:=]?\\s*)\\S+".toRegex()
    }
}
