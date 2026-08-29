package com.uigrade.ai

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.data.repository.MockAdminRepository
import com.uigrade.ai.data.repository.MockAuthRepository
import com.uigrade.ai.domain.model.AuditAction
import com.uigrade.ai.domain.model.AuditOutcome
import com.uigrade.ai.domain.model.LogLevel
import com.uigrade.ai.domain.model.SystemLog
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserAccountStatus
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.presentation.admin.LogsUiState
import com.uigrade.ai.presentation.admin.SystemLogsViewModel
import com.uigrade.ai.presentation.admin.UserManagementViewModel
import com.uigrade.ai.presentation.admin.UserSortOption
import java.time.LocalDateTime
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class AdminFeatureTest {
    private lateinit var store: MockDataStore
    private lateinit var repository: MockAdminRepository

    @Before
    fun setUp() {
        store = MockDataStore()
        repository = MockAdminRepository(store)
    }

    @Test
    fun `dashboard derives complete system statistics`() = runTest {
        val stats = repository.getStats("a1")

        assertEquals(store.users.size, stats.totalUsers)
        assertEquals(store.classrooms.size, stats.totalClassrooms)
        assertEquals(store.assignments.size, stats.totalAssignments)
        assertEquals(store.submissions.count { !it.isDraft }, stats.totalSubmissions)
        assertEquals(store.rubrics.count { it.isActive }, stats.activeRubrics)
        assertEquals(store.users.count { it.accountStatus == UserAccountStatus.LOCKED }, stats.lockedUsers)
    }

    @Test
    fun `repository rejects non admin and records permission failure`() = runTest {
        val result = runCatching { repository.getUsers("s1") }

        assertTrue(result.exceptionOrNull() is SecurityException)
        val logs = repository.getAuditLogs("a1")
        assertTrue(logs.any { it.action == AuditAction.PERMISSION_DENIED && it.outcome == AuditOutcome.FAILURE })
    }

    @Test
    fun `admin cannot lock or delete own account and last super admin is protected`() = runTest {
        assertTrue(runCatching { repository.setAccountStatus("a1", "a1", UserAccountStatus.LOCKED) }.isFailure)
        assertTrue(runCatching { repository.deleteUser("a1", "a1") }.isFailure)
        assertEquals(UserAccountStatus.ACTIVE, store.users.single { it.id == "a1" }.accountStatus)
        assertTrue(store.users.single { it.id == "a1" }.isSuperAdmin)
    }

    @Test
    fun `lock and unlock persist and locked account cannot log in`() = runTest {
        val auth = MockAuthRepository(store)

        repository.setAccountStatus("a1", "s1", UserAccountStatus.LOCKED)
        assertNull(auth.login("student@uigrade.ai", "password123"))
        repository.setAccountStatus("a1", "s1", UserAccountStatus.ACTIVE)
        assertNotNull(auth.login("student@uigrade.ai", "password123"))
    }

    @Test
    fun `create validates duplicate email and student id while keeping pending status`() = runTest {
        val created = repository.createUser(
            "a1",
            User("", "Sinh viên mới", "new.student@example.com", UserRole.STUDENT, studentId = "SV999")
        )

        assertEquals(UserAccountStatus.PENDING, created.accountStatus)
        assertEquals(created, store.users.single { it.email == "new.student@example.com" })
        assertTrue(
            runCatching {
                repository.createUser(
                    "a1",
                    User("", "Trùng email", "new.student@example.com", UserRole.STUDENT, studentId = "SV998")
                )
            }.isFailure
        )
        assertTrue(
            runCatching {
                repository.createUser(
                    "a1",
                    User("", "Trùng mã", "different@example.com", UserRole.STUDENT, studentId = "SV999")
                )
            }.isFailure
        )
    }

    @Test
    fun `delete preserves accounts that own learning history`() = runTest {
        val result = runCatching { repository.deleteUser("a1", "s1") }

        assertTrue(result.isFailure)
        assertNotNull(store.users.find { it.id == "s1" })
        assertTrue(result.exceptionOrNull()?.message?.contains("vô hiệu hóa") == true)
    }

    @Test
    fun `rubric copy persists toggle works and used rubric cannot be deleted`() = runTest {
        val source = repository.getRubrics("a1").first { it.usedByAssignmentIds.isNotEmpty() }
        val copy = repository.duplicateRubric("a1", source.id)

        assertFalse(copy.isActive)
        assertTrue(copy.usedByAssignmentIds.isEmpty())
        assertNotNull(repository.getRubrics("a1").find { it.id == copy.id })
        assertTrue(repository.setRubricActive("a1", copy.id, true).isActive)
        assertTrue(runCatching { repository.deleteRubric("a1", source.id) }.isFailure)
        repository.deleteRubric("a1", copy.id)
        assertNull(repository.getRubrics("a1").find { it.id == copy.id })
    }

    @Test
    fun `rule and metric validation reject invalid numeric ranges`() = runTest {
        val rule = repository.getRules("a1").first()
        val metric = repository.getMetrics("a1").first()

        assertTrue(runCatching { repository.updateRule("a1", rule.copy(maxScore = 0)) }.isFailure)
        assertTrue(
            runCatching { repository.updateMetric("a1", metric.copy(minValue = 10.0, maxValue = 1.0)) }.isFailure
        )
        assertFalse(repository.setRuleActive("a1", rule.id, false).isActive)
        assertFalse(repository.setMetricActive("a1", metric.id, false).isActive)
    }

    @Test
    fun `user filters search status role and sort deterministically`() {
        val users = listOf(
            User("1", "Bình", "b@example.com", UserRole.STUDENT, studentId = "SV002", createdAt = LocalDateTime.of(2026, 2, 1, 0, 0)),
            User("2", "An", "a@example.com", UserRole.STUDENT, studentId = "SV001", accountStatus = UserAccountStatus.LOCKED, createdAt = LocalDateTime.of(2026, 1, 1, 0, 0)),
            User("3", "Cường", "c@example.com", UserRole.LECTURER, staffId = "GV001")
        )

        val byCode = UserManagementViewModel.filterUsers(users, "SV001", null, null, UserSortOption.NAME_ASC)
        val lockedStudents = UserManagementViewModel.filterUsers(
            users, "", UserRole.STUDENT, UserAccountStatus.LOCKED, UserSortOption.NEWEST
        )

        assertEquals(listOf("2"), byCode.map { it.id })
        assertEquals(listOf("2"), lockedStudents.map { it.id })
        assertEquals(listOf("2", "1", "3"), UserManagementViewModel.filterUsers(users, "", null, null, UserSortOption.NAME_ASC).map { it.id })
    }

    @Test
    fun `audit filter paginates without duplicates and respects outcome`() {
        val logs = (1..14).map { index ->
            SystemLog(
                id = "log-$index",
                level = LogLevel.INFO,
                tag = "Admin",
                message = "Cập nhật $index",
                timestamp = "2026-08-29T10:${index.toString().padStart(2, '0')}:00",
                action = AuditAction.UPDATE_USER,
                actorName = if (index % 2 == 0) "Admin A" else "Admin B",
                outcome = if (index % 2 == 0) AuditOutcome.SUCCESS else AuditOutcome.FAILURE
            )
        }
        val filtered = SystemLogsViewModel.applyLogFilters(
            LogsUiState(allLogs = logs, searchQuery = "Admin A", selectedOutcome = AuditOutcome.SUCCESS),
            resetPage = true
        )

        assertEquals(7, filtered.filteredLogs.size)
        assertEquals(7, filtered.visibleLogs.distinctBy { it.id }.size)
        assertFalse(filtered.hasMoreData)
    }
}
