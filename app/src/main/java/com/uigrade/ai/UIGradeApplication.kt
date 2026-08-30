/*
 * SPDX-FileCopyrightText: 2026 UIGrade AI contributors
 * SPDX-License-Identifier: MIT
 */

package com.uigrade.ai

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * UIGrade AI Application entry point.
 * Hilt dependency injection is initialized here.
 */
@HiltAndroidApp
class UIGradeApplication : Application()
