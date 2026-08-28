package com.uigrade.ai.data.mock

import com.uigrade.ai.domain.model.Assignment
import com.uigrade.ai.domain.model.ClassMembership
import com.uigrade.ai.domain.model.Classroom
import com.uigrade.ai.domain.model.Feedback
import com.uigrade.ai.domain.model.GradingResult
import com.uigrade.ai.domain.model.JoinRequest
import com.uigrade.ai.domain.model.LecturerNotification
import com.uigrade.ai.domain.model.Rubric
import com.uigrade.ai.domain.model.Submission
import com.uigrade.ai.domain.model.User
import javax.inject.Inject
import javax.inject.Singleton

/**
 * In-memory source of truth shared by every mock repository for the lifetime of the app.
 * Keeping the collections here prevents a submission made on one screen from being
 * invisible to dashboards and grading-result screens backed by another repository.
 */
@Singleton
class MockDataStore @Inject constructor() {
    val users: MutableList<User> = MockData.allUsers.toMutableList()
    val assignments: MutableList<Assignment> = MockData.assignments.toMutableList()
    val rubrics: MutableList<Rubric> = MockData.allRubrics.toMutableList()
    val submissions: MutableList<Submission> = MockData.submissions.toMutableList()
    val gradingResults: MutableList<GradingResult> = MockData.allGradingResults.toMutableList()
    val feedbacks: MutableList<Feedback> = MockData.allFeedbacks.toMutableList()

    // Classroom data
    val classrooms: MutableList<Classroom> = MockData.classrooms.toMutableList()
    val memberships: MutableList<ClassMembership> = MockData.memberships.toMutableList()
    val joinRequests: MutableList<JoinRequest> = MockData.joinRequests.toMutableList()
    val notifications: MutableList<LecturerNotification> = MockData.lecturerNotifications.toMutableList()

    var aiFeedbackEnabled: Boolean = true
}
