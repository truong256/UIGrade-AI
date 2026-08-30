/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.data.repository.MockAssignmentRepository
import com.uigrade.ai.data.repository.MockClassroomRepository
import com.uigrade.ai.data.repository.MockGradingRepository
import com.uigrade.ai.data.repository.MockSubmissionRepository
import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.AssignmentPublishStatus
import com.uigrade.ai.domain.model.AssignmentStatus
import com.uigrade.ai.domain.model.ClassMembership
import com.uigrade.ai.domain.model.JoinClassResult
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.model.SubmissionAttachment
import com.uigrade.ai.domain.model.SubmissionStatus
import com.uigrade.ai.domain.model.User
import com.uigrade.ai.domain.model.UserRole
import com.uigrade.ai.domain.usecase.StudentAssignmentPolicy
import java.time.LocalDateTime
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class StudentFeatureTest {
    private lateinit var store: MockDataStore
    private lateinit var classrooms: MockClassroomRepository
    private lateinit var assignments: MockAssignmentRepository
    private lateinit var submissions: MockSubmissionRepository
    private lateinit var grading: MockGradingRepository

    @Before
    fun setUp() {
        store = MockDataStore()
        classrooms = MockClassroomRepository(store)
        assignments = MockAssignmentRepository(store)
        submissions = MockSubmissionRepository(store)
        grading = MockGradingRepository(store)
    }

    @Test
    fun `assignment policy calculates time and submission states consistently`() {
        val now = LocalDateTime.of(2026, 8, 28, 12, 0)
        val open = assignment(deadline = now.plusDays(1))
        val upcoming = open.copy(startAt = now.plusHours(1))
        val overdue = open.copy(deadline = now.minusMinutes(1))
        val submitted = submission(open.id, isLate = false)
        val late = submitted.copy(id = "late", isLate = true, status = SubmissionStatus.LATE)
        val draft = submitted.copy(id = "draft", isDraft = true, savedAt = now.plusMinutes(1))
        val resubmit = submitted.copy(id = "retry", resubmissionRequested = true)

        assertEquals(AssignmentStatus.UPCOMING, StudentAssignmentPolicy.resolve(upcoming, emptyList(), null, now))
        assertEquals(AssignmentStatus.NOT_SUBMITTED, StudentAssignmentPolicy.resolve(open, emptyList(), null, now))
        assertEquals(AssignmentStatus.OVERDUE, StudentAssignmentPolicy.resolve(overdue, emptyList(), null, now))
        assertEquals(AssignmentStatus.SUBMITTED, StudentAssignmentPolicy.resolve(open, listOf(submitted), null, now))
        assertEquals(AssignmentStatus.LATE, StudentAssignmentPolicy.resolve(open, listOf(late), null, now))
        assertEquals(AssignmentStatus.DRAFT, StudentAssignmentPolicy.resolve(open, listOf(submitted, draft), null, now))
        assertEquals(AssignmentStatus.RESUBMISSION_REQUIRED, StudentAssignmentPolicy.resolve(open, listOf(resubmit), null, now))
    }

    @Test
    fun `join repository supports direct pending duplicate and cancellation states`() = runTest {
        val studentId = "student-test"
        val pending = classrooms.requestJoinClassroom("b3m8qz", studentId).getOrThrow()
        assertTrue(pending is JoinClassResult.Pending)
        assertFalse(classrooms.isStudentEnrolled("cls2", studentId))
        assertTrue(classrooms.requestJoinClassroom("B3M8QZ", studentId).isFailure)

        val request = classrooms.getJoinRequestsForStudent(studentId).single()
        assertTrue(classrooms.cancelJoinRequest(request.id, studentId).isSuccess)
        assertTrue(classrooms.getJoinRequestsForStudent(studentId).isEmpty())

        val joined = classrooms.requestJoinClassroom("a7k9px", studentId).getOrThrow()
        assertTrue(joined is JoinClassResult.Joined)
        assertTrue(classrooms.isStudentEnrolled("cls1", studentId))
    }

    @Test
    fun `student assignment queries are filtered by membership`() = runTest {
        val studentId = "student-test"
        store.memberships.add(ClassMembership("cls1", studentId, LocalDateTime.now()))

        val visible = assignments.getAssignmentsForStudent(studentId)
        assertTrue(visible.isNotEmpty())
        assertTrue(visible.all { it.assignment.classroomId == "cls1" })
        assertTrue(assignments.getAssignmentsForStudentInClassroom(studentId, "cls2").isEmpty())
    }

    @Test
    fun `draft is persisted submitted once and creates synchronized notification`() = runTest {
        val studentId = addStudentToClass("cls2")
        val attachment = SubmissionAttachment(
            id = "file-1",
            uri = "content://documents/project.zip",
            displayName = "project.zip",
            mimeType = "application/zip",
            sizeBytes = 1024
        )

        val draft = submissions.saveDraft(
            "a3", "cls2", studentId, "Nội dung dự án", "https://example.com/project", listOf(attachment)
        )
        assertTrue(draft.isDraft)
        assertEquals(draft.id, submissions.getSubmissionsForStudentAssignment(studentId, "a3").single().id)

        val sent = submissions.submitDraft(draft.id, studentId)
        assertFalse(sent.isDraft)
        assertEquals(SubmissionStatus.SUBMITTED, sent.status)
        assertTrue(store.studentNotifications.any { it.submissionId == sent.id })
        assertTrue(runCatching { submissions.submitDraft(draft.id, studentId) }.isFailure)
    }

    @Test
    fun `failed submit keeps draft and attachment validation is friendly`() = runTest {
        val studentId = addStudentToClass("cls2")
        val oversized = SubmissionAttachment(
            id = "large",
            uri = "content://documents/large.zip",
            displayName = "large.zip",
            sizeBytes = 26L * 1024 * 1024
        )
        val draft = submissions.saveDraft("a3", "cls2", studentId, "Bản nháp an toàn", "", listOf(oversized))

        val failure = runCatching { submissions.submitDraft(draft.id, studentId) }
        assertTrue(failure.exceptionOrNull()?.message?.contains("25 MB") == true)
        assertTrue(submissions.getSubmissionById(draft.id)?.isDraft == true)
        assertEquals("Bản nháp an toàn", submissions.getSubmissionById(draft.id)?.content)
    }

    @Test
    fun `only released non-draft grades are visible to students`() = runTest {
        assertNotNull(grading.getGradingResultForSubmission("sub1"))
        val index = store.gradingResults.indexOfFirst { it.submissionId == "sub1" }
        store.gradingResults[index] = store.gradingResults[index].copy(isReleased = false, isDraft = true)

        assertNull(grading.getGradingResultForSubmission("sub1"))
        assertTrue(grading.getGradingResultsForStudent("s1").none { it.submissionId == "sub1" })
    }

    @Test
    fun `attempt limit gives a deterministic disabled reason`() {
        val assignment = assignment(LocalDateTime.of(2026, 8, 30, 12, 0)).copy(
            allowResubmission = true,
            maxAttempts = 2
        )
        assertNull(StudentAssignmentPolicy.disabledReason(assignment, AssignmentStatus.SUBMITTED, 1))
        assertEquals(
            "Bạn đã sử dụng hết số lần nộp.",
            StudentAssignmentPolicy.disabledReason(assignment, AssignmentStatus.SUBMITTED, 2)
        )
    }

    private fun addStudentToClass(classroomId: String): String {
        val studentId = "student-test"
        store.users.add(User(studentId, "Sinh viên kiểm thử", "", UserRole.STUDENT, studentId = "SV-TEST"))
        store.memberships.add(ClassMembership(classroomId, studentId, LocalDateTime.now()))
        return studentId
    }

    private fun assignment(deadline: LocalDateTime) = Assignment(
        id = "test-assignment",
        title = "Bài kiểm thử",
        description = "",
        deadline = deadline,
        rubricId = "rubric1",
        lecturerId = "lecturer-test",
        courseId = "COURSE-TEST",
        courseName = "Android",
        createdAt = deadline.minusDays(2),
        classroomId = "class-test",
        publishStatus = AssignmentPublishStatus.PUBLISHED
    )

    private fun submission(assignmentId: String, isLate: Boolean) = Submission(
        id = "submission",
        assignmentId = assignmentId,
        studentId = "student-test",
        studentName = "Sinh viên kiểm thử",
        fileUri = null,
        submittedAt = LocalDateTime.of(2026, 8, 28, 10, 0),
        status = if (isLate) SubmissionStatus.LATE else SubmissionStatus.SUBMITTED,
        isLate = isLate
    )
}
