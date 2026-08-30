/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai

import com.uigrade.ai.data.mock.MockData
import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.data.repository.MockAssignmentRepository
import com.uigrade.ai.data.repository.MockAuthRepository
import com.uigrade.ai.data.repository.MockGradingRepository
import com.uigrade.ai.data.repository.MockRubricRepository
import com.uigrade.ai.data.repository.MockStatsRepository
import com.uigrade.ai.data.repository.MockSubmissionRepository
import com.uigrade.ai.data.repository.MockUserRepository
import com.uigrade.ai.domain.model.SubmissionStatus
import com.uigrade.ai.domain.model.UserRole
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class MockRepositoryTest {

    @Test
    fun `authentication accepts demo credentials and logout clears session`() = runTest {
        val repository = MockAuthRepository(MockDataStore())

        val user = repository.login("student@uigrade.ai", "password123")

        assertEquals(UserRole.STUDENT, user?.role)
        assertEquals(user, repository.getCurrentUser())
        repository.logout()
        assertNull(repository.getCurrentUser())
        assertNull(repository.login("student@uigrade.ai", "wrong-password"))
    }

    @Test
    fun `student assignment status comes from shared submission state`() = runTest {
        val store = MockDataStore()
        val assignments = MockAssignmentRepository(store)
        val submissions = MockSubmissionRepository(store)
        val target = store.assignments.first { assignment ->
            store.submissions.none { it.assignmentId == assignment.id && it.studentId == "s5" }
        }

        submissions.submitAssignment(target.id, "s5", "content://demo/submission.apk")
        val refreshed = assignments.getAssignmentsForStudent("s5").first {
            it.assignment.id == target.id
        }

        assertEquals(com.uigrade.ai.domain.model.AssignmentStatus.GRADED, refreshed.status)
        assertNotNull(refreshed.submissionId)
        assertNotNull(refreshed.score)
    }

    @Test
    fun `submission creates a consistent deterministic result`() = runTest {
        val store = MockDataStore()
        val submissions = MockSubmissionRepository(store)
        val grading = MockGradingRepository(store)

        val submission = submissions.submitAssignment("a2", "s2", "content://demo/app.zip")
        val result = grading.getGradingResultForSubmission(submission.id)

        assertEquals(SubmissionStatus.COMPLETED, submission.status)
        assertEquals(submission.gradingResultId, result?.id)
        assertEquals(submission.assignmentId, result?.assignmentId)
        assertEquals(submission.studentId, result?.studentId)
        assertEquals(result?.criteriaScores?.sumOf { it.earned }, result?.totalScore)
        assertTrue(store.feedbacks.any { it.gradingResultId == result?.id })
    }

    @Test
    fun `rubric update is visible to later reads`() = runTest {
        val repository = MockRubricRepository(MockDataStore())
        val original = repository.getRubricById("rubric1")!!

        repository.updateRubric(original.copy(title = "Updated rubric"))

        assertEquals("Updated rubric", repository.getRubricById("rubric1")?.title)
    }

    @Test
    fun `user role update and deletion modify repository state`() = runTest {
        val repository = MockUserRepository(MockDataStore())
        val student = repository.getUserById("s5")!!

        repository.updateUser(student.copy(name = "Updated student"))
        assertEquals("Updated student", repository.getUserById("s5")?.name)
        assertTrue(repository.deleteUser("s5"))
        assertNull(repository.getUserById("s5"))
    }

    @Test
    fun `dashboard stats are derived from shared mock data`() = runTest {
        val store = MockDataStore()
        val repository = MockStatsRepository(store)

        val admin = repository.getAdminStats()
        val lecturer = repository.getLecturerStats("l1")

        assertEquals(MockData.students.size, admin.totalStudents)
        assertEquals(store.gradingResults.size, admin.gradingJobs.completed)
        assertEquals(store.assignments.count { it.lecturerId == "l1" }, lecturer.totalAssignments)
    }
}
