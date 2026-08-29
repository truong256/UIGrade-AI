package com.uigrade.ai.domain.usecase

import com.uigrade.ai.domain.model.Metric
import com.uigrade.ai.domain.model.Rule
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserAccountStatus
import com.uigrade.ai.domain.repository.AdminRepository
import com.uigrade.ai.domain.repository.AuthRepository
import javax.inject.Inject

/** Use-case facade for Admin operations. Every call resolves the current session again. */
class AdminOperationsUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val adminRepository: AdminRepository
) {
    suspend fun stats() = adminRepository.getStats(requireActorId())
    suspend fun setAiFeedbackEnabled(enabled: Boolean) =
        adminRepository.setAiFeedbackEnabled(requireActorId(), enabled)

    suspend fun users() = adminRepository.getUsers(requireActorId())
    suspend fun createUser(user: User) = adminRepository.createUser(requireActorId(), user)
    suspend fun updateUser(user: User) = adminRepository.updateUser(requireActorId(), user)
    suspend fun setAccountStatus(userId: String, status: UserAccountStatus) =
        adminRepository.setAccountStatus(requireActorId(), userId, status)
    suspend fun requestPasswordReset(userId: String) =
        adminRepository.requestPasswordReset(requireActorId(), userId)
    suspend fun deleteUser(userId: String) = adminRepository.deleteUser(requireActorId(), userId)

    suspend fun rubrics() = adminRepository.getRubrics(requireActorId())
    suspend fun duplicateRubric(id: String) = adminRepository.duplicateRubric(requireActorId(), id)
    suspend fun setRubricActive(id: String, active: Boolean) =
        adminRepository.setRubricActive(requireActorId(), id, active)
    suspend fun deleteRubric(id: String) = adminRepository.deleteRubric(requireActorId(), id)

    suspend fun rules() = adminRepository.getRules(requireActorId())
    suspend fun updateRule(rule: Rule) = adminRepository.updateRule(requireActorId(), rule)
    suspend fun setRuleActive(id: String, active: Boolean) =
        adminRepository.setRuleActive(requireActorId(), id, active)

    suspend fun metrics() = adminRepository.getMetrics(requireActorId())
    suspend fun updateMetric(metric: Metric) = adminRepository.updateMetric(requireActorId(), metric)
    suspend fun setMetricActive(id: String, active: Boolean) =
        adminRepository.setMetricActive(requireActorId(), id, active)

    suspend fun auditLogs() = adminRepository.getAuditLogs(requireActorId())

    private suspend fun requireActorId(): String = authRepository.getCurrentUser()?.id
        ?: throw SecurityException("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
}
