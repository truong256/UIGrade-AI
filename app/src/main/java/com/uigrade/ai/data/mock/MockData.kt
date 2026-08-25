package com.uigrade.ai.data.mock

import com.uigrade.ai.domain.model.*
import java.time.LocalDateTime

/**
 * Mock dataset for MVP. Mirrors the Python Baseline JSON contract.
 * Replace data sources with real API calls without changing domain or UI layers.
 */
object MockData {

    // ─── Users ───────────────────────────────────────────────────────────────

    val students = listOf(
        User("s1", "Nguyễn Văn An", "student@uigrade.ai", UserRole.STUDENT, studentId = "SV001"),
        User("s2", "Trần Thị Bình", "binh.tran@uigrade.ai", UserRole.STUDENT, studentId = "SV002"),
        User("s3", "Lê Văn Cường", "cuong.le@uigrade.ai", UserRole.STUDENT, studentId = "SV003"),
        User("s4", "Phạm Thị Dung", "dung.pham@uigrade.ai", UserRole.STUDENT, studentId = "SV004"),
        User("s5", "Hoàng Văn Em", "em.hoang@uigrade.ai", UserRole.STUDENT, studentId = "SV005")
    )

    val lecturers = listOf(
        User("l1", "TS. Nguyễn Minh Khoa", "lecturer@uigrade.ai", UserRole.LECTURER),
        User("l2", "ThS. Trần Thị Lan", "lan.tran@uigrade.ai", UserRole.LECTURER)
    )

    val admins = listOf(
        User("a1", "Admin UIGrade", "admin@uigrade.ai", UserRole.ADMIN)
    )

    val allUsers: List<User> = students + lecturers + admins

    // ─── Demo credentials ────────────────────────────────────────────────────

    val credentials = mapOf(
        "student@uigrade.ai" to Pair("password123", "s1"),
        "binh.tran@uigrade.ai" to Pair("password123", "s2"),
        "cuong.le@uigrade.ai" to Pair("password123", "s3"),
        "dung.pham@uigrade.ai" to Pair("password123", "s4"),
        "em.hoang@uigrade.ai" to Pair("password123", "s5"),
        "lecturer@uigrade.ai" to Pair("password123", "l1"),
        "lan.tran@uigrade.ai" to Pair("password123", "l2"),
        "admin@uigrade.ai" to Pair("password123", "a1")
    )

    // ─── Rules ───────────────────────────────────────────────────────────────

    val typographyRules = listOf(
        Rule(
            id = "RULE_FONT_BODY_001",
            description = "Body text size must be at least 16sp",
            metricId = "font_size_body",
            threshold = ">=16sp",
            weight = 10,
            maxScore = 10,
            penalty = 4,
            passCondition = "actualValue >= 16",
            failCondition = "actualValue < 16",
            scoreFormula = "maxScore - penalty if fail"
        ),
        Rule(
            id = "RULE_HEADING_002",
            description = "Heading hierarchy must be consistent (H1 > H2 > Body)",
            metricId = "heading_hierarchy",
            threshold = "consistent",
            weight = 5,
            maxScore = 5,
            penalty = 5,
            passCondition = "heading sizes are strictly decreasing",
            failCondition = "any heading level is same size or smaller than child",
            scoreFormula = "maxScore if pass else 0"
        ),
        Rule(
            id = "RULE_LINE_SPACING_003",
            description = "Line spacing must be >= 1.4 times font size",
            metricId = "line_spacing_ratio",
            threshold = ">=1.4",
            weight = 5,
            maxScore = 5,
            penalty = 3,
            passCondition = "lineSpacing / fontSize >= 1.4",
            failCondition = "lineSpacing / fontSize < 1.4",
            scoreFormula = "maxScore - penalty if fail"
        )
    )

    val colorRules = listOf(
        Rule(
            id = "RULE_CONTRAST_001",
            description = "Text contrast ratio must be at least 4.5:1 (WCAG AA)",
            metricId = "contrast_ratio",
            threshold = ">=4.5",
            weight = 12,
            maxScore = 12,
            penalty = 6,
            passCondition = "contrastRatio >= 4.5",
            failCondition = "contrastRatio < 4.5",
            scoreFormula = "maxScore - penalty if fail"
        ),
        Rule(
            id = "RULE_COLOR_BLIND_002",
            description = "UI must not rely solely on color to convey information",
            metricId = "color_only_indicator",
            threshold = "false",
            weight = 8,
            maxScore = 8,
            penalty = 8,
            passCondition = "no color-only indicators detected",
            failCondition = "color used as sole indicator",
            scoreFormula = "maxScore if pass else 0"
        )
    )

    val layoutRules = listOf(
        Rule(
            id = "RULE_ALIGNMENT_001",
            description = "UI elements must align to an 8dp grid",
            metricId = "alignment_violations",
            threshold = "<=1 violation",
            weight = 15,
            maxScore = 15,
            penalty = 5,
            passCondition = "violationCount <= 1",
            failCondition = "violationCount > 1",
            scoreFormula = "maxScore - (penalty * max(0, violationCount - 1))"
        ),
        Rule(
            id = "RULE_MARGIN_002",
            description = "Screen margins must be at least 16dp on each side",
            metricId = "screen_margin",
            threshold = ">=16dp",
            weight = 10,
            maxScore = 10,
            penalty = 5,
            passCondition = "margin >= 16",
            failCondition = "margin < 16",
            scoreFormula = "maxScore - penalty if fail"
        )
    )

    val spacingRules = listOf(
        Rule(
            id = "RULE_BUTTON_HEIGHT_001",
            description = "Touch targets must be at least 48dp tall (Material Design)",
            metricId = "button_height",
            threshold = ">=48dp",
            weight = 12,
            maxScore = 12,
            penalty = 4,
            passCondition = "buttonHeight >= 48",
            failCondition = "buttonHeight < 48",
            scoreFormula = "maxScore - penalty if fail"
        ),
        Rule(
            id = "RULE_ELEMENT_SPACING_002",
            description = "Spacing between related elements must be 8dp or 16dp",
            metricId = "element_spacing",
            threshold = "8dp or 16dp",
            weight = 8,
            maxScore = 8,
            penalty = 4,
            passCondition = "spacing in [8, 16]",
            failCondition = "spacing not in [8, 16]",
            scoreFormula = "maxScore - penalty if fail"
        )
    )

    val accessibilityRules = listOf(
        Rule(
            id = "RULE_CONTENT_DESC_001",
            description = "All non-text UI elements must have content descriptions",
            metricId = "content_description_missing",
            threshold = "0 missing",
            weight = 8,
            maxScore = 8,
            penalty = 4,
            passCondition = "missingCount == 0",
            failCondition = "missingCount > 0",
            scoreFormula = "maxScore - (penalty * missingCount) clamped to 0"
        ),
        Rule(
            id = "RULE_FOCUS_ORDER_002",
            description = "Keyboard/TalkBack focus order must be logical",
            metricId = "focus_order_violations",
            threshold = "0 violations",
            weight = 7,
            maxScore = 7,
            penalty = 7,
            passCondition = "violationCount == 0",
            failCondition = "violationCount > 0",
            scoreFormula = "maxScore if pass else 0"
        )
    )

    // ─── Rubrics ─────────────────────────────────────────────────────────────

    val rubric1 = Rubric(
        id = "rubric1",
        title = "UI Design Rubric – Week 3",
        description = "Evaluates fundamental UI design principles for Android apps",
        version = "1.0",
        criteria = listOf(
            RubricCriterion("c1", "Layout", "Grid alignment and margin consistency", 25, 25, layoutRules),
            RubricCriterion("c2", "Typography", "Text size, hierarchy and line spacing", 20, 20, typographyRules),
            RubricCriterion("c3", "Color", "Contrast ratio and color accessibility", 20, 20, colorRules),
            RubricCriterion("c4", "Spacing", "Touch target sizes and element spacing", 20, 20, spacingRules),
            RubricCriterion("c5", "Accessibility", "Content descriptions and focus order", 15, 15, accessibilityRules)
        )
    )

    val rubric2 = Rubric(
        id = "rubric2",
        title = "Navigation & Interaction Rubric – Week 5",
        description = "Evaluates navigation patterns and interactive element design",
        version = "1.0",
        criteria = listOf(
            RubricCriterion("c6", "Navigation Structure", "Screen flow and back stack behavior", 30, 30, layoutRules),
            RubricCriterion("c7", "Interactive Elements", "Button states and feedback", 25, 25, spacingRules),
            RubricCriterion("c8", "Typography", "Text size and readability", 20, 20, typographyRules),
            RubricCriterion("c9", "Accessibility", "Focus and content descriptions", 25, 25, accessibilityRules)
        )
    )

    val rubric3 = Rubric(
        id = "rubric3",
        title = "Final Project Rubric",
        description = "Comprehensive evaluation for the final Android UI project",
        version = "1.0",
        criteria = listOf(
            RubricCriterion("c10", "Layout", "Overall layout quality", 20, 20, layoutRules),
            RubricCriterion("c11", "Typography", "Typography system", 20, 20, typographyRules),
            RubricCriterion("c12", "Color & Branding", "Color consistency and brand", 20, 20, colorRules),
            RubricCriterion("c13", "Spacing & Touch", "Touch targets and spacing", 20, 20, spacingRules),
            RubricCriterion("c14", "Accessibility", "Full accessibility compliance", 20, 20, accessibilityRules)
        )
    )

    val allRubrics = listOf(rubric1, rubric2, rubric3)

    // ─── Assignments ─────────────────────────────────────────────────────────

    val assignments = listOf(
        Assignment(
            id = "a1",
            title = "UI Assignment 01 – Basic Layouts",
            description = "Design a simple profile screen with proper Material Design layout, typography and color usage. Your app must include a profile header, an info section, and action buttons.",
            deadline = LocalDateTime.of(2026, 8, 30, 23, 59),
            rubricId = "rubric1",
            lecturerId = "l1",
            courseId = "CS401",
            courseName = "Android UI Development",
            createdAt = LocalDateTime.of(2026, 8, 1, 8, 0)
        ),
        Assignment(
            id = "a2",
            title = "UI Assignment 02 – Navigation",
            description = "Implement a multi-screen app using Jetpack Navigation Component. Demonstrate proper back stack management, argument passing, and deep links.",
            deadline = LocalDateTime.of(2026, 9, 5, 23, 59),
            rubricId = "rubric2",
            lecturerId = "l1",
            courseId = "CS401",
            courseName = "Android UI Development",
            createdAt = LocalDateTime.of(2026, 8, 10, 8, 0)
        ),
        Assignment(
            id = "a3",
            title = "Final Project – Complete Android App",
            description = "Build a complete Android application with at least 5 screens, proper Material 3 design system, full accessibility support, and dark mode.",
            deadline = LocalDateTime.of(2026, 9, 20, 23, 59),
            rubricId = "rubric3",
            lecturerId = "l2",
            courseId = "CS401",
            courseName = "Android UI Development",
            createdAt = LocalDateTime.of(2026, 8, 15, 8, 0)
        )
    )

    // ─── Submissions ─────────────────────────────────────────────────────────

    val submissions = listOf(
        Submission("sub1", "a1", "s1", "Nguyễn Văn An", null,
            LocalDateTime.of(2026, 8, 28, 14, 30), SubmissionStatus.COMPLETED, "gr1"),
        Submission("sub2", "a1", "s2", "Trần Thị Bình", null,
            LocalDateTime.of(2026, 8, 29, 9, 15), SubmissionStatus.COMPLETED, "gr2"),
        Submission("sub3", "a1", "s3", "Lê Văn Cường", null,
            LocalDateTime.of(2026, 8, 27, 16, 45), SubmissionStatus.COMPLETED, "gr3"),
        Submission("sub4", "a2", "s1", "Nguyễn Văn An", null,
            LocalDateTime.of(2026, 9, 4, 11, 0), SubmissionStatus.PROCESSING, null),
        Submission("sub5", "a1", "s4", "Phạm Thị Dung", null,
            LocalDateTime.of(2026, 8, 30, 8, 0), SubmissionStatus.COMPLETED, "gr4")
    )

    // ─── Metrics (per submission) ─────────────────────────────────────────────

    private fun metricsForSub1() = listOf(
        // Typography – body text 14sp (FAIL – should be >=16sp)
        Metric("font_size_body", "Body Text Size", "Typography", "14sp", ">=16sp", "sp", MetricStatus.FAIL,
            "Body text font size measured across all TextViews"),
        Metric("heading_hierarchy", "Heading Hierarchy", "Typography", "Consistent", "consistent", "", MetricStatus.PASS,
            "Heading sizes decrease from H1 to H3"),
        Metric("line_spacing_ratio", "Line Spacing Ratio", "Typography", "1.5", ">=1.4", "ratio", MetricStatus.PASS,
            "Line height ratio relative to font size"),
        // Color – contrast 3.1 (FAIL – should be >=4.5)
        Metric("contrast_ratio", "Text Contrast Ratio", "Color", "3.1", ">=4.5", "ratio", MetricStatus.FAIL,
            "WCAG contrast ratio between text and background"),
        Metric("color_only_indicator", "Color-Only Indicators", "Color", "false", "false", "", MetricStatus.PASS,
            "No UI state conveyed by color alone"),
        // Layout – 2 alignment violations (FAIL – should be <=1)
        Metric("alignment_violations", "Alignment Violations", "Layout", "2", "<=1", "count", MetricStatus.FAIL,
            "Number of elements not aligned to 8dp grid"),
        Metric("screen_margin", "Screen Margins", "Layout", "16dp", ">=16dp", "dp", MetricStatus.PASS,
            "Minimum horizontal margin from screen edge"),
        // Spacing – button 42dp (FAIL – should be >=48dp)
        Metric("button_height", "Touch Target Height", "Spacing", "42dp", ">=48dp", "dp", MetricStatus.FAIL,
            "Minimum button height for touchability"),
        Metric("element_spacing", "Element Spacing", "Spacing", "8dp", "8dp or 16dp", "dp", MetricStatus.PASS,
            "Spacing between adjacent UI elements"),
        // Accessibility
        Metric("content_description_missing", "Missing Content Descriptions", "Accessibility", "1", "0", "count", MetricStatus.FAIL,
            "Image elements missing contentDescription"),
        Metric("focus_order_violations", "Focus Order Violations", "Accessibility", "0", "0", "count", MetricStatus.PASS,
            "TalkBack focus traversal order violations")
    )

    private fun rulesWithResults(rules: List<Rule>, metricsMap: Map<String, Metric>): List<Rule> =
        rules.map { rule ->
            val metric = metricsMap[rule.metricId]
            val passed = metric?.status == MetricStatus.PASS
            rule.copy(
                result = if (passed) MetricStatus.PASS else MetricStatus.FAIL,
                earnedScore = if (passed) rule.maxScore else (rule.maxScore - rule.penalty).coerceAtLeast(0)
            )
        }

    // ─── Grading Results ─────────────────────────────────────────────────────

    private fun buildGradingResult(
        id: String, submissionId: String, assignmentId: String, studentId: String,
        metrics: List<Metric>, rubric: Rubric, feedbackId: String
    ): GradingResult {
        val metricsMap = metrics.associateBy { it.id }
        val criteriaScores = rubric.criteria.map { criterion ->
            val rulesWithResult = rulesWithResults(criterion.rules, metricsMap)
            val earned = rulesWithResult.sumOf { it.earnedScore ?: it.maxScore }
                .coerceAtMost(criterion.maxScore)
            CriterionScore(
                criterionId = criterion.id,
                criterionName = criterion.name,
                earned = earned,
                maxScore = criterion.maxScore,
                metrics = metrics.filter { it.category == criterion.name },
                rules = rulesWithResult
            )
        }
        return GradingResult(
            id = id,
            submissionId = submissionId,
            assignmentId = assignmentId,
            studentId = studentId,
            totalScore = criteriaScores.sumOf { it.earned },
            maxScore = rubric.totalMaxScore,
            criteriaScores = criteriaScores,
            gradedAt = LocalDateTime.of(2026, 8, 28, 15, 0),
            engineVersion = "mock-engine-v1.0",
            feedbackId = feedbackId
        )
    }

    val gradingResult1 = buildGradingResult(
        "gr1", "sub1", "a1", "s1", metricsForSub1(), rubric1, "fb1"
    )

    // Student 2 – better submission (mostly passing)
    val gradingResult2 = buildGradingResult(
        "gr2", "sub2", "a1", "s2",
        listOf(
            Metric("font_size_body", "Body Text Size", "Typography", "16sp", ">=16sp", "sp", MetricStatus.PASS),
            Metric("heading_hierarchy", "Heading Hierarchy", "Typography", "Consistent", "consistent", "", MetricStatus.PASS),
            Metric("line_spacing_ratio", "Line Spacing Ratio", "Typography", "1.6", ">=1.4", "ratio", MetricStatus.PASS),
            Metric("contrast_ratio", "Text Contrast Ratio", "Color", "5.2", ">=4.5", "ratio", MetricStatus.PASS),
            Metric("color_only_indicator", "Color-Only Indicators", "Color", "false", "false", "", MetricStatus.PASS),
            Metric("alignment_violations", "Alignment Violations", "Layout", "1", "<=1", "count", MetricStatus.PASS),
            Metric("screen_margin", "Screen Margins", "Layout", "16dp", ">=16dp", "dp", MetricStatus.PASS),
            Metric("button_height", "Touch Target Height", "Spacing", "48dp", ">=48dp", "dp", MetricStatus.PASS),
            Metric("element_spacing", "Element Spacing", "Spacing", "16dp", "8dp or 16dp", "dp", MetricStatus.PASS),
            Metric("content_description_missing", "Missing Content Descriptions", "Accessibility", "0", "0", "count", MetricStatus.PASS),
            Metric("focus_order_violations", "Focus Order Violations", "Accessibility", "0", "0", "count", MetricStatus.PASS)
        ),
        rubric1, "fb2"
    )

    // Student 3 – average submission
    val gradingResult3 = buildGradingResult(
        "gr3", "sub3", "a1", "s3",
        listOf(
            Metric("font_size_body", "Body Text Size", "Typography", "15sp", ">=16sp", "sp", MetricStatus.FAIL),
            Metric("heading_hierarchy", "Heading Hierarchy", "Typography", "Inconsistent", "consistent", "", MetricStatus.FAIL),
            Metric("line_spacing_ratio", "Line Spacing Ratio", "Typography", "1.3", ">=1.4", "ratio", MetricStatus.FAIL),
            Metric("contrast_ratio", "Text Contrast Ratio", "Color", "4.8", ">=4.5", "ratio", MetricStatus.PASS),
            Metric("color_only_indicator", "Color-Only Indicators", "Color", "false", "false", "", MetricStatus.PASS),
            Metric("alignment_violations", "Alignment Violations", "Layout", "3", "<=1", "count", MetricStatus.FAIL),
            Metric("screen_margin", "Screen Margins", "Layout", "12dp", ">=16dp", "dp", MetricStatus.FAIL),
            Metric("button_height", "Touch Target Height", "Spacing", "48dp", ">=48dp", "dp", MetricStatus.PASS),
            Metric("element_spacing", "Element Spacing", "Spacing", "8dp", "8dp or 16dp", "dp", MetricStatus.PASS),
            Metric("content_description_missing", "Missing Content Descriptions", "Accessibility", "2", "0", "count", MetricStatus.FAIL),
            Metric("focus_order_violations", "Focus Order Violations", "Accessibility", "1", "0", "count", MetricStatus.FAIL)
        ),
        rubric1, "fb3"
    )

    val gradingResult4 = buildGradingResult(
        "gr4", "sub5", "a1", "s4",
        listOf(
            Metric("font_size_body", "Body Text Size", "Typography", "18sp", ">=16sp", "sp", MetricStatus.PASS),
            Metric("heading_hierarchy", "Heading Hierarchy", "Typography", "Consistent", "consistent", "", MetricStatus.PASS),
            Metric("line_spacing_ratio", "Line Spacing Ratio", "Typography", "1.5", ">=1.4", "ratio", MetricStatus.PASS),
            Metric("contrast_ratio", "Text Contrast Ratio", "Color", "4.5", ">=4.5", "ratio", MetricStatus.PASS),
            Metric("color_only_indicator", "Color-Only Indicators", "Color", "false", "false", "", MetricStatus.PASS),
            Metric("alignment_violations", "Alignment Violations", "Layout", "0", "<=1", "count", MetricStatus.PASS),
            Metric("screen_margin", "Screen Margins", "Layout", "20dp", ">=16dp", "dp", MetricStatus.PASS),
            Metric("button_height", "Touch Target Height", "Spacing", "44dp", ">=48dp", "dp", MetricStatus.FAIL),
            Metric("element_spacing", "Element Spacing", "Spacing", "16dp", "8dp or 16dp", "dp", MetricStatus.PASS),
            Metric("content_description_missing", "Missing Content Descriptions", "Accessibility", "0", "0", "count", MetricStatus.PASS),
            Metric("focus_order_violations", "Focus Order Violations", "Accessibility", "0", "0", "count", MetricStatus.PASS)
        ),
        rubric1, "fb4"
    )

    val allGradingResults = listOf(gradingResult1, gradingResult2, gradingResult3, gradingResult4)

    // ─── AI Feedback ─────────────────────────────────────────────────────────

    val feedback1 = Feedback(
        id = "fb1",
        gradingResultId = "gr1",
        summary = "Bài nộp thể hiện hiểu biết cơ bản về thiết kế Android nhưng còn một số vấn đề cần cải thiện về typography, độ tương phản màu sắc và kích thước nút bấm.",
        strengths = listOf(
            "Phân cấp heading nhất quán và rõ ràng",
            "Line spacing đạt yêu cầu (1.5)",
            "Không sử dụng màu làm phương tiện duy nhất để hiển thị trạng thái",
            "Margin màn hình đạt chuẩn 16dp"
        ),
        problems = listOf(
            FeedbackProblem(
                ruleId = "RULE_FONT_BODY_001",
                metricId = "font_size_body",
                description = "Kích thước văn bản body đang là 14sp, thấp hơn mức 16sp quy định trong rubric. Điều này có thể gây khó đọc trên các màn hình nhỏ.",
                impact = "Giảm khả năng đọc, đặc biệt với người dùng thị lực kém"
            ),
            FeedbackProblem(
                ruleId = "RULE_CONTRAST_001",
                metricId = "contrast_ratio",
                description = "Tỉ lệ tương phản hiện tại là 3.1, thấp hơn chuẩn WCAG AA (4.5:1). Văn bản khó đọc trong điều kiện ánh sáng thay đổi.",
                impact = "Vi phạm tiêu chuẩn WCAG AA accessibility"
            ),
            FeedbackProblem(
                ruleId = "RULE_ALIGNMENT_001",
                metricId = "alignment_violations",
                description = "Có 2 vi phạm căn chỉnh lưới 8dp. Các phần tử UI không được căn chỉnh nhất quán làm giao diện trông thiếu chuyên nghiệp.",
                impact = "Giảm tính nhất quán thị giác"
            ),
            FeedbackProblem(
                ruleId = "RULE_BUTTON_HEIGHT_001",
                metricId = "button_height",
                description = "Chiều cao nút bấm hiện tại là 42dp, thấp hơn 48dp theo Material Design. Vùng chạm nhỏ gây khó thao tác.",
                impact = "Khả năng tương tác kém, đặc biệt trên thiết bị màn hình nhỏ"
            ),
            FeedbackProblem(
                ruleId = "RULE_CONTENT_DESC_001",
                metricId = "content_description_missing",
                description = "1 phần tử hình ảnh thiếu contentDescription. TalkBack sẽ không thể đọc được phần tử này cho người dùng khiếm thị.",
                impact = "Vi phạm yêu cầu accessibility cơ bản"
            )
        ),
        recommendations = listOf(
            "Tăng kích thước font body lên ít nhất 16sp. Kiểm tra lại trên các thiết bị nhỏ (< 5 inch).",
            "Điều chỉnh màu chữ hoặc màu nền để đạt tỉ lệ tương phản >= 4.5:1. Dùng công cụ Material Color Tool để kiểm tra.",
            "Rà soát vị trí các phần tử theo lưới 8dp. Sử dụng Layout Inspector trong Android Studio để xác định vi phạm.",
            "Tăng chiều cao nút bấm lên 48dp. Sử dụng `Modifier.height(48.dp)` hoặc `ButtonDefaults.MinHeight`.",
            "Thêm `contentDescription` cho tất cả ImageView/Image composable không phải decorative."
        ),
        generatedAt = "2026-08-28T15:05:00",
        modelVersion = "mock-feedback-v1.0"
    )

    val feedback2 = Feedback(
        id = "fb2",
        gradingResultId = "gr2",
        summary = "Bài nộp đạt chất lượng tốt, đáp ứng hầu hết các tiêu chí trong rubric. Tất cả các metric đều trong ngưỡng chấp nhận.",
        strengths = listOf(
            "Font size body đúng chuẩn (16sp)",
            "Tỉ lệ tương phản xuất sắc (5.2:1, vượt chuẩn WCAG AA)",
            "Căn chỉnh lưới tốt (chỉ 1 vi phạm nhỏ)",
            "Kích thước nút bấm đúng chuẩn (48dp)",
            "Đầy đủ content description cho tất cả phần tử"
        ),
        problems = emptyList(),
        recommendations = listOf(
            "Tiếp tục duy trì chất lượng thiết kế hiện tại.",
            "Có thể thử nghiệm tỉ lệ tương phản cao hơn (>7:1) cho văn bản nhỏ để đạt WCAG AAA."
        ),
        generatedAt = "2026-08-29T10:20:00",
        modelVersion = "mock-feedback-v1.0"
    )

    val feedback3 = Feedback(
        id = "fb3",
        gradingResultId = "gr3",
        summary = "Bài nộp cần cải thiện ở nhiều tiêu chí. Các vấn đề typography, layout và accessibility cần được xử lý trước khi nộp lại.",
        strengths = listOf(
            "Tỉ lệ tương phản màu đạt chuẩn (4.8:1)",
            "Kích thước nút bấm đúng chuẩn (48dp)",
            "Spacing giữa các phần tử hợp lý"
        ),
        problems = listOf(
            FeedbackProblem("RULE_FONT_BODY_001", "font_size_body",
                "Font size body 15sp vẫn thấp hơn ngưỡng 16sp.", "Khó đọc"),
            FeedbackProblem("RULE_HEADING_002", "heading_hierarchy",
                "Phân cấp heading không nhất quán, H2 có kích thước bằng H3.", "Lộn xộn về visual hierarchy"),
            FeedbackProblem("RULE_ALIGNMENT_001", "alignment_violations",
                "3 vi phạm căn chỉnh lưới – nhiều hơn mức cho phép.", "Giao diện thiếu nhất quán"),
            FeedbackProblem("RULE_CONTENT_DESC_001", "content_description_missing",
                "2 phần tử thiếu content description.", "Không accessible")
        ),
        recommendations = listOf(
            "Sửa font size body lên 16sp.",
            "Đảm bảo kích thước H1 > H2 > H3 với khoảng cách ít nhất 2sp.",
            "Dùng Layout Inspector để phát hiện và sửa tất cả vi phạm lưới.",
            "Thêm contentDescription cho tất cả Image không phải decorative.",
            "Kiểm tra margin màn hình – hiện đang là 12dp, cần ít nhất 16dp."
        ),
        generatedAt = "2026-08-28T16:30:00",
        modelVersion = "mock-feedback-v1.0"
    )

    val feedback4 = Feedback(
        id = "fb4",
        gradingResultId = "gr4",
        summary = "Bài nộp có chất lượng khá tốt, chỉ còn một vấn đề nhỏ về kích thước vùng chạm nút bấm.",
        strengths = listOf(
            "Layout căn chỉnh hoàn hảo (0 vi phạm)",
            "Font size, hierarchy và line spacing đều đạt",
            "Tỉ lệ tương phản đúng chuẩn WCAG AA",
            "Accessibility đầy đủ"
        ),
        problems = listOf(
            FeedbackProblem("RULE_BUTTON_HEIGHT_001", "button_height",
                "Chiều cao nút 44dp thấp hơn ngưỡng 48dp theo Material Design.", "Vùng chạm hơi nhỏ")
        ),
        recommendations = listOf(
            "Tăng chiều cao nút lên 48dp để đạt chuẩn Material Design touch target."
        ),
        generatedAt = "2026-08-30T09:00:00",
        modelVersion = "mock-feedback-v1.0"
    )

    val allFeedbacks = listOf(feedback1, feedback2, feedback3, feedback4)

    // ─── System logs ──────────────────────────────────────────────────────────

    val systemLogs = listOf(
        SystemLog("log1", LogLevel.INFO, "GradingEngine", "Grading completed for submission sub1. Score: ${gradingResult1.totalScore}", "2026-08-28T15:00:00", "s1"),
        SystemLog("log2", LogLevel.INFO, "FeedbackGenerator", "Feedback generated for gr1", "2026-08-28T15:05:00", "s1"),
        SystemLog("log3", LogLevel.INFO, "GradingEngine", "Grading completed for submission sub2. Score: ${gradingResult2.totalScore}", "2026-08-29T10:15:00", "s2"),
        SystemLog("log4", LogLevel.INFO, "GradingEngine", "Grading completed for submission sub3. Score: ${gradingResult3.totalScore}", "2026-08-28T16:25:00", "s3"),
        SystemLog("log5", LogLevel.WARNING, "FeedbackGenerator", "Feedback generation took >5s for gr3", "2026-08-28T16:30:00", null),
        SystemLog("log6", LogLevel.INFO, "Auth", "User s4 logged in", "2026-08-30T07:55:00", "s4"),
        SystemLog("log7", LogLevel.INFO, "GradingEngine", "Grading job started for submission sub4", "2026-09-04T11:05:00", "s1"),
        SystemLog("log8", LogLevel.INFO, "GradingEngine", "Grading completed for submission sub5. Score: ${gradingResult4.totalScore}", "2026-08-30T08:10:00", "s4"),
        SystemLog("log9", LogLevel.ERROR, "API", "Connection timeout for external metric extractor (retry 1/3)", "2026-08-29T14:00:00", null),
        SystemLog("log10", LogLevel.INFO, "API", "Connection restored after retry", "2026-08-29T14:01:00", null)
    )
}
