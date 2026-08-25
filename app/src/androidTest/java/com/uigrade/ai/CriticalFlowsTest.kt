package com.uigrade.ai

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import org.junit.After
import org.junit.Rule
import org.junit.Test

/**
 * Smoke coverage for the seven critical role flows. These tests exercise the real
 * MainActivity, Hilt graph, navigation graph and mock repositories together.
 */
class CriticalFlowsTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @After
    fun logoutWhenPossible() {
        repeat(5) {
            val logoutNodes = composeRule.onAllNodesWithContentDescription("Logout")
                .fetchSemanticsNodes()
            if (logoutNodes.isNotEmpty()) {
                composeRule.onAllNodesWithContentDescription("Logout")[0].performClick()
                waitForText("Đăng nhập")
                return
            }
            composeRule.activityRule.scenario.onActivity { it.onBackPressedDispatcher.onBackPressed() }
            composeRule.waitForIdle()
        }
    }

    @Test
    fun studentLoginOpensStudentDashboard() {
        login("student@uigrade.ai")
        waitForText("Xin chào, Nguyễn Văn An")
    }

    @Test
    fun studentDashboardNavigatesToAssignmentList() {
        login("student@uigrade.ai")
        waitForText("Xem tất cả")
        composeRule.onNodeWithText("Xem tất cả").performClick()
        waitForText("Bài tập")
    }

    @Test
    fun assignmentListNavigatesToSelectedDetail() {
        login("student@uigrade.ai")
        waitForText("Xem tất cả")
        composeRule.onNodeWithText("Xem tất cả").performClick()
        waitForText("UI Assignment 01")
        composeRule.onAllNodesWithText("UI Assignment 01", substring = true)[0].performClick()
        waitForText("Chi tiết bài tập")
        composeRule.onNodeWithText("Chi tiết bài tập").assertIsDisplayed()
    }

    @Test
    fun submitScreenRequiresASelectedFile() {
        login("student@uigrade.ai")
        waitForText("Xem tất cả")
        composeRule.onNodeWithText("Xem tất cả").performClick()
        waitForText("Final Project")
        composeRule.onAllNodesWithText("Final Project", substring = true)[0].performClick()
        waitForText("Nộp bài tập")
        composeRule.onNodeWithText("Nộp bài tập").performClick()
        waitForText("Xác nhận nộp bài")
        composeRule.onNodeWithText("Xác nhận nộp bài").assertIsNotEnabled()
    }

    @Test
    fun gradedAssignmentOpensDeterministicResult() {
        login("student@uigrade.ai")
        waitForText("UI Assignment 01")
        composeRule.onAllNodesWithText("UI Assignment 01", substring = true)[0].performClick()
        waitForText("Xem kết quả")
        composeRule.onNodeWithText("Xem kết quả").performClick()
        waitForText("Kết quả chấm điểm")
        composeRule.onNodeWithText("Kết quả chấm điểm").assertIsDisplayed()
    }

    @Test
    fun lecturerCanOpenAssignmentManagement() {
        login("lecturer@uigrade.ai")
        waitForText("Lecturer Dashboard")
        composeRule.onAllNodesWithText("Bài tập")[0].performClick()
        waitForText("Quản lý bài tập")
    }

    @Test
    fun adminCanOpenUserManagement() {
        login("admin@uigrade.ai")
        waitForText("Admin Dashboard")
        composeRule.onNodeWithText("Quản lý người dùng").performClick()
        waitForText("8 người dùng")
    }

    private fun login(email: String) {
        waitForText("Đăng nhập")
        val fields = composeRule.onAllNodes(hasSetTextAction())
        fields[0].performTextInput(email)
        fields[1].performTextInput("password123")
        composeRule.onAllNodesWithText("Đăng nhập")[0].performClick()
    }

    private fun waitForText(text: String) {
        composeRule.waitUntil(timeoutMillis = 8_000) {
            composeRule.onAllNodesWithText(text, substring = true)
                .fetchSemanticsNodes()
                .isNotEmpty()
        }
    }
}
