package com.uigrade.ai.domain.repository

import com.uigrade.ai.domain.model.AdminStats
import com.uigrade.ai.domain.model.Metric
import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.model.Rule
import com.uigrade.ai.domain.model.SystemLog
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserAccountStatus

/**
 * Administrative boundary. Every method receives the authenticated actor id so
 * authorization is verified again by the data source instead of trusting UI state.
 */
interface AdminRepository {
    suspend fun getStats(adminId: String): AdminStats
    suspend fun setAiFeedbackEnabled(adminId: String, enabled: Boolean)
    suspend fun getUsers(adminId: String): List<User>
    suspend fun createUser(adminId: String, user: User): User
    suspend fun updateUser(adminId: String, user: User): User
    suspend fun setAccountStatus(adminId: String, userId: String, status: UserAccountStatus): User
    suspend fun requestPasswordReset(adminId: String, userId: String)
    suspend fun deleteUser(adminId: String, userId: String)

    suspend fun getRubrics(adminId: String): List<Rubric>
    suspend fun duplicateRubric(adminId: String, rubricId: String): Rubric
    suspend fun setRubricActive(adminId: String, rubricId: String, active: Boolean): Rubric
    suspend fun deleteRubric(adminId: String, rubricId: String)

    suspend fun getRules(adminId: String): List<Rule>
    suspend fun updateRule(adminId: String, rule: Rule): Rule
    suspend fun setRuleActive(adminId: String, ruleId: String, active: Boolean): Rule

    suspend fun getMetrics(adminId: String): List<Metric>
    suspend fun updateMetric(adminId: String, metric: Metric): Metric
    suspend fun setMetricActive(adminId: String, metricId: String, active: Boolean): Metric

    suspend fun getAuditLogs(adminId: String): List<SystemLog>
}
