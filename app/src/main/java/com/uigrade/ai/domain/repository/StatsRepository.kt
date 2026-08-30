/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai.domain.repository

import com.uigrade.ai.domain.model.AdminStats
import com.uigrade.ai.domain.model.LecturerStats
import com.uigrade.ai.domain.model.SystemLog

interface StatsRepository {
    suspend fun getAdminStats(): AdminStats
    suspend fun getLecturerStats(lecturerId: String): LecturerStats
    suspend fun getSystemLogs(): List<SystemLog>
    suspend fun setAiFeedbackEnabled(enabled: Boolean)
}
