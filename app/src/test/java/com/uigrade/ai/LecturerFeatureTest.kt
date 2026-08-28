package com.uigrade.ai

import com.uigrade.ai.data.mock.MockDataStore
import com.uigrade.ai.data.repository.MockAuthRepository
import com.uigrade.ai.data.repository.MockClassroomRepository
import com.uigrade.ai.data.repository.MockNotificationRepository
import com.uigrade.ai.data.repository.MockUserRepository
import com.uigrade.ai.domain.model.JoinRequestStatus
import com.uigrade.ai.domain.usecase.ChangePasswordUseCase
import com.uigrade.ai.domain.usecase.GetJoinRequestsUseCase
import com.uigrade.ai.domain.usecase.MarkAllLecturerNotificationsReadUseCase
import com.uigrade.ai.domain.usecase.RemoveStudentFromClassroomUseCase
import com.uigrade.ai.domain.usecase.RespondToJoinRequestUseCase
import com.uigrade.ai.domain.usecase.SetClassroomJoinEnabledUseCase
import com.uigrade.ai.domain.usecase.UpdateLecturerProfileUseCase
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class LecturerFeatureTest {
    private lateinit var store: MockDataStore
    private lateinit var auth: MockAuthRepository
    private lateinit var classrooms: MockClassroomRepository

    @Before
    fun setUp() {
        store = MockDataStore()
        auth = MockAuthRepository(store)
        classrooms = MockClassroomRepository(store)
    }

    @Test
    fun `lecturer can disable enrollment and students can no longer join`() = runTest {
        assertNotNull(auth.login("lecturer@uigrade.ai", "password123"))
        val toggle = SetClassroomJoinEnabledUseCase(classrooms, auth)

        assertTrue(toggle("cls1", false).isSuccess)
        assertFalse(classrooms.getClassroomById("cls1")!!.joinEnabled)

        assertNotNull(auth.login("em.hoang@uigrade.ai", "password123"))
        val result = classrooms.joinClassroom("A7K9PX", "s5")
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("tạm dừng") == true)
    }

    @Test
    fun `removing a membership preserves the student account`() = runTest {
        assertNotNull(auth.login("lecturer@uigrade.ai", "password123"))
        val remove = RemoveStudentFromClassroomUseCase(classrooms, auth)

        assertTrue(remove("cls1", "s1").isSuccess)
        assertFalse(classrooms.isStudentEnrolled("cls1", "s1"))
        assertNotNull(store.users.find { it.id == "s1" })
    }

    @Test
    fun `lecturer can approve a pending join request exactly once`() = runTest {
        assertNotNull(auth.login("lecturer@uigrade.ai", "password123"))
        val getRequests = GetJoinRequestsUseCase(classrooms, auth)
        val respond = RespondToJoinRequestUseCase(classrooms, auth)
        val request = getRequests("cls1").getOrThrow().first()

        val approved = respond("cls1", request.id, true).getOrThrow()

        assertEquals(JoinRequestStatus.APPROVED, approved.status)
        assertTrue(classrooms.isStudentEnrolled("cls1", request.studentId))
        assertTrue(respond("cls1", request.id, true).isFailure)
    }

    @Test
    fun `profile and password updates persist for the current lecturer`() = runTest {
        assertNotNull(auth.login("lecturer@uigrade.ai", "password123"))
        val updateProfile = UpdateLecturerProfileUseCase(MockUserRepository(store), auth)
        val changePassword = ChangePasswordUseCase(auth)

        val updated = updateProfile(
            name = "TS. Nguyễn Minh Khoa",
            phone = "+84901234567",
            department = "Công nghệ phần mềm",
            organization = "UIGrade University",
            bio = "Phụ trách học phần Android",
            avatarUrl = null
        ).getOrThrow()

        assertEquals("Công nghệ phần mềm", updated.department)
        assertEquals(updated, auth.getCurrentUser())
        assertTrue(changePassword("password123", "new-password-456", "new-password-456").isSuccess)
        auth.logout()
        assertNull(auth.login("lecturer@uigrade.ai", "password123"))
        assertNotNull(auth.login("lecturer@uigrade.ai", "new-password-456"))
    }

    @Test
    fun `mark all notifications read updates the lecturer inbox`() = runTest {
        assertNotNull(auth.login("lecturer@uigrade.ai", "password123"))
        val repository = MockNotificationRepository(store)
        val markAll = MarkAllLecturerNotificationsReadUseCase(repository, auth)

        assertTrue(repository.getForLecturer("l1").any { !it.isRead })
        assertTrue(markAll().isSuccess)
        assertTrue(repository.getForLecturer("l1").all { it.isRead })
    }
}
