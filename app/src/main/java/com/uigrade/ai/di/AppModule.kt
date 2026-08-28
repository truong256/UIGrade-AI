package com.uigrade.ai.di

import com.uigrade.ai.data.repository.*
import com.uigrade.ai.domain.repository.*
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Hilt module binding domain repository interfaces to mock implementations.
 * To replace with real API: swap the mock class for an API-backed implementation.
 * No changes required in domain or presentation layers.
 */
@Module
@InstallIn(SingletonComponent::class)
abstract class AppModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: MockAuthRepository): AuthRepository

    @Binds
    @Singleton
    abstract fun bindAssignmentRepository(impl: MockAssignmentRepository): AssignmentRepository

    @Binds
    @Singleton
    abstract fun bindSubmissionRepository(impl: MockSubmissionRepository): SubmissionRepository

    @Binds
    @Singleton
    abstract fun bindGradingRepository(impl: MockGradingRepository): GradingRepository

    @Binds
    @Singleton
    abstract fun bindRubricRepository(impl: MockRubricRepository): RubricRepository

    @Binds
    @Singleton
    abstract fun bindFeedbackRepository(impl: MockFeedbackRepository): FeedbackRepository

    @Binds
    @Singleton
    abstract fun bindUserRepository(impl: MockUserRepository): UserRepository

    @Binds
    @Singleton
    abstract fun bindStatsRepository(impl: MockStatsRepository): StatsRepository

    @Binds
    @Singleton
    abstract fun bindClassroomRepository(impl: MockClassroomRepository): ClassroomRepository

    @Binds
    @Singleton
    abstract fun bindNotificationRepository(impl: MockNotificationRepository): NotificationRepository
}
