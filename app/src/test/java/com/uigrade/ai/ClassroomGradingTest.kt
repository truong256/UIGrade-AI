/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.data.repository.*
import com.uigrade.ai.domain.model.*
import com.uigrade.ai.domain.usecase.*
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.time.LocalDateTime
import java.util.UUID

class ClassroomGradingTest {

    private lateinit var store: MockDataStore
    private lateinit var authRepo: MockAuthRepository
    private lateinit var classroomRepo: MockClassroomRepository
    private lateinit var assignmentRepo: MockAssignmentRepository
    private lateinit var submissionRepo: MockSubmissionRepository
    private lateinit var gradingRepo: MockGradingRepository

    @Before
    fun setup() {
        store = MockDataStore()
        authRepo = MockAuthRepository(store)
        classroomRepo = MockClassroomRepository(store)
        assignmentRepo = MockAssignmentRepository(store)
        submissionRepo = MockSubmissionRepository(store)
        gradingRepo = MockGradingRepository(store)
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // 1. CLASSROOM TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    @Test
    fun `create classroom auto-generates unique 6-char uppercase join code without ambiguous chars`() = runTest {
        authRepo.login("lecturer@uigrade.ai", "password123")
        val createUseCase = CreateClassroomUseCase(classroomRepo, authRepo)

        val result = createUseCase(
            name = "Android Nâng Cao",
            courseCode = "CS402",
            description = "Lớp học nâng cao về Jetpack Compose",
            semester = "HK2 2026-2027"
        )

        assertTrue(result.isSuccess)
        val created = result.getOrThrow()
        assertEquals(6, created.joinCode.length)
        assertTrue(created.joinCode.all { it.isUpperCase() || it.isDigit() })
        assertFalse(created.joinCode.contains('0'))
        assertFalse(created.joinCode.contains('O'))
        assertFalse(created.joinCode.contains('1'))
        assertFalse(created.joinCode.contains('I'))
        assertEquals("l1", created.lecturerId)
        assertEquals(ClassroomStatus.ACTIVE, created.status)
    }

    @Test
    fun `lecturer only sees their own classrooms`() = runTest {
        val lecturer1Classes = classroomRepo.getClassroomsForLecturer("l1")
        val lecturer2Classes = classroomRepo.getClassroomsForLecturer("l2")

        assertTrue(lecturer1Classes.all { it.lecturerId == "l1" })
        assertTrue(lecturer2Classes.all { it.lecturerId == "l2" })
        assertTrue(lecturer1Classes.isNotEmpty())
        assertTrue(lecturer2Classes.isNotEmpty())
    }

    @Test
    fun `regenerating join code updates code and retains enrolled students`() = runTest {
        authRepo.login("lecturer@uigrade.ai", "password123")
        val oldCode = store.classrooms.first { it.id == "cls1" }.joinCode
        val studentsBefore = classroomRepo.getStudentsInClassroom("cls1")
        assertTrue(studentsBefore.isNotEmpty())

        val regenUseCase = RegenerateJoinCodeUseCase(classroomRepo, authRepo)
        val result = regenUseCase("cls1")

        assertTrue(result.isSuccess)
        val newCode = result.getOrThrow()
        assertNotEquals(oldCode, newCode)

        // Old code cannot be found
        val findOld = classroomRepo.findByJoinCode(oldCode)
        assertNull(findOld)

        // New code can be found
        val findNew = classroomRepo.findByJoinCode(newCode)
        assertNotNull(findNew)
        assertEquals("cls1", findNew?.id)

        // Existing students are still enrolled
        val studentsAfter = classroomRepo.getStudentsInClassroom("cls1")
        assertEquals(studentsBefore.size, studentsAfter.size)
    }

    @Test
    fun `archive classroom stops new joins`() = runTest {
        authRepo.login("lecturer@uigrade.ai", "password123")
        val archiveUseCase = ArchiveClassroomUseCase(classroomRepo, authRepo)
        val joinUseCase = JoinClassroomUseCase(classroomRepo, authRepo)

        // Archive cls1
        val archiveResult = archiveUseCase("cls1")
        assertTrue(archiveResult.isSuccess)

        val archivedClass = classroomRepo.getClassroomById("cls1")
        assertEquals(ClassroomStatus.ARCHIVED, archivedClass?.status)

        // Try to join with a new student s5
        authRepo.login("em.hoang@uigrade.ai", "password123")
        val joinResult = joinUseCase("A7K9PX")
        assertTrue(joinResult.isFailure)
        assertTrue(joinResult.exceptionOrNull()?.message?.contains("lưu trữ") == true)
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // 2. JOIN CLASSROOM TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    @Test
    fun `student joins classroom with valid join code (case-insensitive)`() = runTest {
        // s5 joins cls1 with lowercase code "a7k9px"
        authRepo.login("em.hoang@uigrade.ai", "password123")
        val joinUseCase = JoinClassroomUseCase(classroomRepo, authRepo)

        val result = joinUseCase("a7k9px")
        assertTrue(result.isSuccess)
        assertEquals("cls1", result.getOrThrow().classroomId)
        assertEquals("s5", result.getOrThrow().studentId)

        val enrolled = classroomRepo.getClassroomsForStudent("s5")
        assertTrue(enrolled.any { it.id == "cls1" })
    }

    @Test
    fun `join rejects invalid or non-existent code`() = runTest {
        authRepo.login("em.hoang@uigrade.ai", "password123")
        val joinUseCase = JoinClassroomUseCase(classroomRepo, authRepo)

        val result = joinUseCase("INVALID")
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("Không tìm thấy") == true)
    }

    @Test
    fun `join rejects duplicate join if student already enrolled`() = runTest {
        // s1 is already in cls1 in mock data
        authRepo.login("student@uigrade.ai", "password123")
        val joinUseCase = JoinClassroomUseCase(classroomRepo, authRepo)

        val result = joinUseCase("A7K9PX")
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("đã tham gia") == true)
    }

    @Test
    fun `only student role can join classroom`() = runTest {
        // Lecturer tries to join
        authRepo.login("lecturer@uigrade.ai", "password123")
        val joinUseCase = JoinClassroomUseCase(classroomRepo, authRepo)

        val result = joinUseCase("A7K9PX")
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("Chỉ sinh viên") == true)
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // 3. ASSIGNMENT TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    @Test
    fun `draft assignment is not visible to students until published`() = runTest {
        authRepo.login("lecturer@uigrade.ai", "password123")
        val createUseCase = CreateAssignmentUseCase(assignmentRepo, authRepo)

        // Create draft assignment in cls1
        val createResult = createUseCase(
            title = "Draft Assignment 03",
            description = "Bản nháp bài tập mới",
            classroomId = "cls1",
            deadline = LocalDateTime.now().plusDays(7),
            startAt = LocalDateTime.now(),
            rubricId = "rubric1",
            courseId = "CS401",
            courseName = "Android UI Development",
            totalMaxScore = 100,
            allowLateSubmission = true,
            allowResubmission = false,
            maxAttempts = 1,
            allowedFileTypes = listOf("apk", "zip"),
            publish = false
        )
        assertTrue(createResult.isSuccess)
        val draft = createResult.getOrThrow()
        assertEquals(AssignmentPublishStatus.DRAFT, draft.publishStatus)

        // Student s1 queries assignments for cls1
        val publishedForClass = assignmentRepo.getPublishedAssignmentsForClassroom("cls1")
        assertFalse(publishedForClass.any { it.id == draft.id })

        val studentAssignments = assignmentRepo.getAssignmentsForStudentInClassroom("s1", "cls1")
        assertFalse(studentAssignments.any { it.assignment.id == draft.id })

        // Lecturer publishes the draft
        val publishUseCase = PublishAssignmentUseCase(assignmentRepo, authRepo)
        val pubResult = publishUseCase(draft.id)
        assertTrue(pubResult.isSuccess)

        // Now student can see it
        val publishedAfter = assignmentRepo.getPublishedAssignmentsForClassroom("cls1")
        assertTrue(publishedAfter.any { it.id == draft.id })
    }

    @Test
    fun `student outside classroom cannot see its assignments`() = runTest {
        val isMember = classroomRepo.isStudentEnrolled("cls2", "s4")
        assertFalse(isMember)
    }

    @Test
    fun `closing assignment prevents new submissions`() = runTest {
        authRepo.login("lecturer@uigrade.ai", "password123")
        val closeUseCase = CloseAssignmentUseCase(assignmentRepo, authRepo)

        // Close a1
        val result = closeUseCase("a1")
        assertTrue(result.isSuccess)
        assertEquals(AssignmentPublishStatus.CLOSED, result.getOrThrow().publishStatus)

        // Try submitting to closed assignment
        val submitResult = runCatching {
            submissionRepo.submitAssignmentForClassroom(
                assignmentId = "a1",
                classroomId = "cls1",
                studentId = "s2",
                fileUri = "content://demo/app.apk",
                fileName = "app.apk"
            )
        }
        assertTrue(submitResult.isFailure)
        assertTrue(submitResult.exceptionOrNull() is IllegalArgumentException)
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // 4. SUBMISSION TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    @Test
    fun `student enrolled in classroom can submit file with valid extension`() = runTest {
        // s2 is enrolled in cls1 and has not submitted for a2 yet
        val submission = submissionRepo.submitAssignmentForClassroom(
            assignmentId = "a2",
            classroomId = "cls1",
            studentId = "s2",
            fileUri = "content://test/solution.apk",
            fileName = "solution.apk"
        )

        assertNotNull(submission)
        assertEquals("a2", submission.assignmentId)
        assertEquals("s2", submission.studentId)
        assertEquals("cls1", submission.classroomId)
        assertEquals("solution.apk", submission.fileName)
        assertEquals(SubmissionStatus.SUBMITTED, submission.status)
    }

    @Test
    fun `submission rejects unsupported file extensions`() = runTest {
        // s2 tries to submit .pdf to a2 (allowed: apk, aab, zip)
        val submitResult = runCatching {
            submissionRepo.submitAssignmentForClassroom(
                assignmentId = "a2",
                classroomId = "cls1",
                studentId = "s2",
                fileUri = "content://test/document.pdf",
                fileName = "document.pdf"
            )
        }
        assertTrue(submitResult.isFailure)
        assertTrue(submitResult.exceptionOrNull()?.message?.contains("Loại tệp không được hỗ trợ") == true)
    }

    @Test
    fun `student not enrolled in classroom cannot submit`() = runTest {
        // s5 is not enrolled in cls1
        val submitResult = runCatching {
            submissionRepo.submitAssignmentForClassroom(
                assignmentId = "a2",
                classroomId = "cls1",
                studentId = "s5",
                fileUri = "content://test/app.apk",
                fileName = "app.apk"
            )
        }
        assertTrue(submitResult.isFailure)
        assertTrue(submitResult.exceptionOrNull()?.message?.contains("chưa tham gia lớp") == true)
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // 5. GRADING & RELEASE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    @Test
    fun `lecturer saves draft - student cannot see score until released`() = runTest {
        authRepo.login("lecturer@uigrade.ai", "password123")
        val saveDraftUseCase = SaveGradingDraftUseCase(gradingRepo, authRepo)
        val finalizeUseCase = FinalizeGradingUseCase(gradingRepo)
        val releaseUseCase = ReleaseGradingUseCase(gradingRepo, authRepo)

        val criteria = listOf(
            CriterionScore("c1", "Layout", 25, 25, lecturerComment = "Tốt"),
            CriterionScore("c2", "Typography", 18, 20, lecturerComment = "Chữ hơi nhỏ"),
            CriterionScore("c3", "Color", 20, 20),
            CriterionScore("c4", "Spacing", 18, 20),
            CriterionScore("c5", "Accessibility", 14, 15)
        )

        // 1. Save Draft (submission sub4)
        val draftResult = saveDraftUseCase(
            submissionId = "sub4",
            assignmentId = "a2",
            studentId = "s1",
            criteriaScores = criteria,
            lecturerComment = "Bài làm rất tốt, cần chú ý typography.",
            maxScore = 100,
            existingResultId = null
        )
        assertTrue(draftResult.isSuccess)
        val savedDraft = draftResult.getOrThrow()
        assertEquals(95, savedDraft.totalScore)
        assertTrue(savedDraft.isDraft)
        assertFalse(savedDraft.isReleased)

        // Student s1 checks results — must be null (hidden because isDraft=true)
        val studentView = gradingRepo.getGradingResultForSubmission("sub4")
        assertNull(studentView)

        // 2. Finalize
        val finalizedResult = finalizeUseCase(savedDraft.id)
        assertTrue(finalizedResult.isSuccess)
        val finalized = finalizedResult.getOrThrow()
        assertFalse(finalized.isDraft)
        assertFalse(finalized.isReleased)

        // Student still cannot see because isReleased=false
        val studentResults = gradingRepo.getGradingResultsForStudent("s1")
        assertFalse(studentResults.any { it.submissionId == "sub4" })

        // 3. Release
        val releasedResult = releaseUseCase(savedDraft.id)
        assertTrue(releasedResult.isSuccess)
        val released = releasedResult.getOrThrow()
        assertTrue(released.isReleased)

        // Now student can see score and comments
        val studentSeen = gradingRepo.getGradingResultForSubmission("sub4")
        assertNotNull(studentSeen)
        assertEquals(95, studentSeen?.totalScore)
        assertEquals("Bài làm rất tốt, cần chú ý typography.", studentSeen?.lecturerComment)
    }

    @Test
    fun `grading validates criterion score cannot exceed maxScore`() = runTest {
        authRepo.login("lecturer@uigrade.ai", "password123")
        val saveDraftUseCase = SaveGradingDraftUseCase(gradingRepo, authRepo)

        val invalidCriteria = listOf(
            CriterionScore("c1", "Layout", 30, 25) // 30 > max 25
        )

        val result = saveDraftUseCase(
            submissionId = "sub4",
            assignmentId = "a2",
            studentId = "s1",
            criteriaScores = invalidCriteria,
            lecturerComment = "",
            maxScore = 100,
            existingResultId = null
        )
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("vượt mức tối đa") == true)
    }

    @Test
    fun `grading validates criterion score cannot be negative`() = runTest {
        authRepo.login("lecturer@uigrade.ai", "password123")
        val saveDraftUseCase = SaveGradingDraftUseCase(gradingRepo, authRepo)

        val negativeCriteria = listOf(
            CriterionScore("c1", "Layout", -5, 25)
        )

        val result = saveDraftUseCase(
            submissionId = "sub4",
            assignmentId = "a2",
            studentId = "s1",
            criteriaScores = negativeCriteria,
            lecturerComment = "",
            maxScore = 100,
            existingResultId = null
        )
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("không được âm") == true)
    }
}
