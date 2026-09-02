import fs from "fs";
import { promises as fsp } from "fs";
import os from "os";
import path from "path";
import AdmZip from "adm-zip";
import type { RubricCriterion, RunnerCheck, RunnerReportInput } from "@/lib/grading-contract";
import { runAndroidProjectRuntime } from "@/services/android-runtime-runner.service";
type SubmissionLike = {
    sourceArchive?: {
        url?: string | null;
        storedName?: string | null;
        originalName?: string | null;
        mimeType?: string | null;
        size?: number | null;
    } | null;
    repositoryUrl?: string | null;
    assignmentSnapshot?: {
        rubric?: RubricCriterion[];
        attachments?: Array<{
            kind?: string;
            url?: string;
            originalName?: string;
            mimeType?: string;
        }>;
        runnerConfig?: {
            requiredFiles?: string[];
            entryFiles?: string[];
            buildCommand?: string;
            runCommand?: string;
            deviceProfiles?: string[];
            screenshotTargets?: string[];
        } | null;
    } | null;
};

type ScanContext = {
    rootDir: string;
    filePaths: string[];
    textByPath: Map<string, string>;
};

function normalizePath(value: string) {
    return value.replace(/\\/g, "/");
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function round2(value: number) {
    return Math.round(value * 100) / 100;
}

function safeLower(value: unknown) {
    return String(value || "").toLowerCase();
}

function buildArchiveAbsolutePath(
    sourceArchive: SubmissionLike["sourceArchive"]
): string | null {
    const url = String(sourceArchive?.url || "").trim();
    if (!url) return null;

    if (!url.startsWith("/")) {
        return path.join(process.cwd(), "public", url);
    }

    return path.join(process.cwd(), "public", url.replace(/^\//, ""));
}

async function walk(dir: string): Promise<string[]> {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    const results: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...(await walk(fullPath)));
        } else {
            results.push(fullPath);
        }
    }

    return results;
}

async function loadScanContext(rootDir: string): Promise<ScanContext> {
    const filePaths = await walk(rootDir);
    const textByPath = new Map<string, string>();

    for (const filePath of filePaths) {
        const lower = safeLower(filePath);
        const shouldRead =
            lower.endsWith(".kt") ||
            lower.endsWith(".kts") ||
            lower.endsWith(".xml") ||
            lower.endsWith(".gradle") ||
            lower.endsWith(".md") ||
            lower.endsWith(".txt") ||
            lower.endsWith(".properties");

        if (!shouldRead) continue;

        try {
            const content = await fsp.readFile(filePath, "utf8");
            textByPath.set(normalizePath(filePath), content);
        } catch {
            // bỏ qua file không đọc được
        }
    }

    return {
        rootDir,
        filePaths: filePaths.map(normalizePath),
        textByPath,
    };
}

function hasAnyFile(ctx: ScanContext, matchers: Array<(p: string) => boolean>) {
    return ctx.filePaths.some((filePath) => matchers.some((matcher) => matcher(filePath)));
}

function findFilesByName(ctx: ScanContext, fileNames: string[]) {
    const normalizedNames = fileNames.map((item) => safeLower(item));
    return ctx.filePaths.filter((filePath) => {
        const lower = safeLower(filePath);
        return normalizedNames.some((name) => lower.endsWith(`/${name}`) || lower.endsWith(name));
    });
}

function findEvidence(ctx: ScanContext, patterns: RegExp[]) {
    const hits: string[] = [];

    for (const [filePath, text] of ctx.textByPath.entries()) {
        if (patterns.some((pattern) => pattern.test(text))) {
            hits.push(filePath);
        }
    }

    return hits;
}

function findCriterionCode(rubric: RubricCriterion[], keywords: string[]) {
    const found = rubric.find((criterion) => {
        const haystack = `${criterion.code} ${criterion.title} ${criterion.description || ""} ${criterion.notes || ""}`.toLowerCase();
        return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
    });

    return found?.code || null;
}

function makeCheck(input: {
    code: string;
    label: string;
    criterionCode?: string | null;
    passed?: boolean;
    status?: RunnerCheck["status"];
    score?: number | null;
    maxScore?: number | null;
    message: string;
    evidence?: string[];
}): RunnerCheck {
    const finalStatus =
        input.status ??
        (input.passed === undefined ? "not_run" : input.passed ? "passed" : "failed");

    return {
        code: input.code,
        label: input.label,
        criterionCode: input.criterionCode ?? null,
        status: finalStatus,
        score: input.score ?? null,
        maxScore: input.maxScore ?? null,
        message: input.message,
        evidence: input.evidence ?? [],
    };
}

function detectAndroidProject(ctx: ScanContext) {
    return {
        hasManifest: hasAnyFile(ctx, [(p) => p.endsWith("/androidmanifest.xml")]),
        hasAppGradle: hasAnyFile(ctx, [
            (p) => p.endsWith("/app/build.gradle.kts"),
            (p) => p.endsWith("/app/build.gradle"),
        ]),
        hasSettingsGradle: hasAnyFile(ctx, [
            (p) => p.endsWith("/settings.gradle.kts"),
            (p) => p.endsWith("/settings.gradle"),
        ]),
    };
}

type RunnerConfigLike = {
    requiredFiles?: string[];
    entryFiles?: string[];
    buildCommand?: string;
    runCommand?: string;
    deviceProfiles?: string[];
    screenshotTargets?: string[];
    scenarioId?: string;
    scenarioName?: string;
    uiScreens?: any[];
    uiActions?: any[];
} | null | undefined;

function buildRequiredFileChecks(
    ctx: ScanContext,
    runnerConfig: RunnerConfigLike
) {
    const requiredFiles = Array.isArray(runnerConfig?.requiredFiles)
        ? runnerConfig.requiredFiles.map((item) => String(item).trim()).filter(Boolean)
        : [];

    return requiredFiles.map((fileName) => {
        const matched = findFilesByName(ctx, [fileName]);
        return makeCheck({
            code: `required_file_${fileName.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase()}`,
            label: `Required file: ${fileName}`,
            passed: matched.length > 0,
            score: matched.length > 0 ? 1 : 0,
            maxScore: 1,
            message:
                matched.length > 0
                    ? `Tìm thấy file bắt buộc: ${fileName}`
                    : `Thiếu file bắt buộc: ${fileName}`,
            evidence: matched,
        });
    });
}

export async function runRunnerForSubmission(
    submission: SubmissionLike
): Promise<RunnerReportInput> {
    const rubric = Array.isArray(submission.assignmentSnapshot?.rubric)
        ? submission.assignmentSnapshot.rubric
        : [];

    const archiveAbsolutePath = buildArchiveAbsolutePath(submission.sourceArchive);
    const hasArchive = Boolean(archiveAbsolutePath && fs.existsSync(archiveAbsolutePath));
    const hasGitUrl = Boolean(String(submission.repositoryUrl || "").trim());

    if (!hasArchive && !hasGitUrl) {
        return {
            buildPassed: null,
            testPassed: null,
            runtimeStatus: "project_invalid",
            checks: [
                makeCheck({
                    code: "source_missing",
                    label: "Nguồn bài nộp",
                    status: "not_run",
                    score: 0,
                    maxScore: 0,
                    message: "Không tìm thấy file ZIP bài nộp và cũng không có link GitHub.",
                    evidence: [],
                }),
            ],
            rawSummary: "Runner không chạy được vì thiếu nguồn bài nộp.",
        };
    }

    if (!hasArchive && hasGitUrl) {
        console.log("[RUNTIME] repositoryUrl =", submission.repositoryUrl);
        console.log("[RUNTIME] start runAndroidProjectRuntime from GitHub");

        const runtimeReport = await runAndroidProjectRuntime({
            sourceArchive: submission.sourceArchive ?? null,
            repositoryUrl: submission.repositoryUrl ?? null,
            assignmentAttachments: submission.assignmentSnapshot?.attachments ?? [],
            assignmentRunnerConfig: submission.assignmentSnapshot?.runnerConfig ?? null,
            adbSerial: process.env.ANDROID_ADB_SERIAL || undefined,
        });

        console.log("[RUNTIME] result =", {
            runtimeStatus: runtimeReport.runtimeStatus,
            buildPassed: runtimeReport.buildPassed,
            testPassed: runtimeReport.testPassed,
            screenshots: runtimeReport.screenshots?.length ?? 0,
            logs: runtimeReport.logs?.length ?? 0,
        });

        return {
            buildPassed: runtimeReport.buildPassed ?? null,
            testPassed: runtimeReport.testPassed ?? null,
            runtimeStatus: runtimeReport.runtimeStatus ?? "not_run",
            visualSimilarity: runtimeReport.visualSimilarity ?? null,
            accessibilityScore: null,
            packageName: runtimeReport.packageName ?? null,
            apkPath: runtimeReport.apkPath ?? null,
            screenshots: runtimeReport.screenshots ?? [],
            artifacts: runtimeReport.artifacts ?? [],
            logs: runtimeReport.logs ?? [],
            visualComparison: runtimeReport.visualComparison ?? null,
            visualComparisons: runtimeReport.visualComparisons ?? [],
            checks: runtimeReport.checks ?? [],
            rawSummary: runtimeReport.rawSummary ?? "Runner runtime đã chạy từ GitHub.",
        };
    }

    const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "autograde-runner-"));

    try {
        let scanRootDir = tempDir;

        if (archiveAbsolutePath && fs.existsSync(archiveAbsolutePath)) {
            const zip = new AdmZip(archiveAbsolutePath);
            zip.extractAllTo(tempDir, true);
            scanRootDir = tempDir;
        } else if (hasGitUrl) {
            scanRootDir = tempDir;
        }

        const ctx = await loadScanContext(scanRootDir);
        const checks: RunnerCheck[] = [];

        const project = detectAndroidProject(ctx);

        checks.push(
            makeCheck({
                code: "android_manifest_exists",
                label: "AndroidManifest.xml tồn tại",
                passed: project.hasManifest,
                score: project.hasManifest ? 1 : 0,
                maxScore: 1,
                message: project.hasManifest
                    ? "Tìm thấy AndroidManifest.xml"
                    : "Không tìm thấy AndroidManifest.xml",
                evidence: project.hasManifest ? findFilesByName(ctx, ["AndroidManifest.xml"]) : [],
            })
        );

        checks.push(
            makeCheck({
                code: "android_gradle_project_exists",
                label: "Project Android có file Gradle cơ bản",
                passed: project.hasAppGradle && project.hasSettingsGradle,
                score: project.hasAppGradle && project.hasSettingsGradle ? 1 : 0,
                maxScore: 1,
                message:
                    project.hasAppGradle && project.hasSettingsGradle
                        ? "Tìm thấy app/build.gradle và settings.gradle"
                        : "Thiếu file Gradle cơ bản của project Android",
                evidence: [
                    ...findFilesByName(ctx, ["app/build.gradle.kts", "app/build.gradle"]),
                    ...findFilesByName(ctx, ["settings.gradle.kts", "settings.gradle"]),
                ],
            })
        );

        checks.push(
            ...buildRequiredFileChecks(
                ctx,
                (submission.assignmentSnapshot?.runnerConfig ?? null) as RunnerConfigLike
            )
        );

        const databaseEvidence = findEvidence(ctx, [
            /@Entity\b/,
            /@Dao\b/,
            /@Database\b/,
            /\bSQLiteOpenHelper\b/,
            /\bSQLiteDatabase\b/,
            /CREATE TABLE/i,
            /\bexecSQL\s*\(/,
            /\binsert\s*\(/,
            /\brawQuery\s*\(/,
            /\bdelete\s*\(/
        ]);

        checks.push(
            makeCheck({
                code: "database_setup",
                label: "Thiết lập cơ sở dữ liệu",
                criterionCode: findCriterionCode(rubric, [
                    "cơ sở dữ liệu",
                    "database",
                    "room",
                    "sqlite",
                    "lưu thông tin"
                ]),
                passed: databaseEvidence.length > 0,
                score: databaseEvidence.length > 0 ? 1 : 0,
                maxScore: 1,
                message:
                    databaseEvidence.length > 0
                        ? "Tìm thấy dấu hiệu triển khai database (Room hoặc SQLiteOpenHelper)."
                        : "Chưa tìm thấy dấu hiệu database rõ ràng.",
                evidence: databaseEvidence,
            })
        );

        const listEvidence = findEvidence(ctx, [/\bLazyColumn\b/, /\bitems\s*\(/, /\bCard\b/]);
        checks.push(
            makeCheck({
                code: "compose_list_ui",
                label: "Hiển thị danh sách bằng Compose",
                criterionCode: findCriterionCode(rubric, [
                    "danh sách",
                    "list",
                    "lazycolumn",
                    "recyclerview",
                ]),
                passed: listEvidence.length > 0,
                score: listEvidence.length > 0 ? 1 : 0,
                maxScore: 1,
                message:
                    listEvidence.length > 0
                        ? "Tìm thấy LazyColumn/Card cho danh sách."
                        : "Chưa thấy danh sách Compose rõ ràng.",
                evidence: listEvidence,
            })
        );

        const formEvidence = findEvidence(ctx, [/\bOutlinedTextField\b/, /\bTextField\b/, /\bButton\b/]);
        checks.push(
            makeCheck({
                code: "compose_form_ui",
                label: "Giao diện form nhập bằng Compose",
                criterionCode: findCriterionCode(rubric, ["giao diện", "thiết kế", "form", "gửi thông tin"]),
                passed: formEvidence.length > 0,
                score: formEvidence.length > 0 ? 1 : 0,
                maxScore: 1,
                message:
                    formEvidence.length > 0
                        ? "Tìm thấy thành phần form Compose."
                        : "Chưa thấy form Compose rõ ràng.",
                evidence: formEvidence,
            })
        );

        const validationEvidence = findEvidence(ctx, [
            /isBlank\s*\(/,
            /isNullOrBlank\s*\(/,
            /isEmpty\s*\(/,
            /toIntOrNull\s*\(/,
            /toDoubleOrNull\s*\(/,
            /toFloatOrNull\s*\(/,
            /Regex\s*\(/,
            /\.matches\s*\(Regex/
        ]);
        checks.push(
            makeCheck({
                code: "form_validation",
                label: "Kiểm tra dữ liệu nhập và định dạng",
                criterionCode: findCriterionCode(rubric, ["validation", "kiểm tra", "định dạng", "giá"]),
                passed: validationEvidence.length > 0,
                score: validationEvidence.length > 0 ? 1 : 0,
                maxScore: 1,
                message:
                    validationEvidence.length > 0
                        ? "Tìm thấy logic kiểm tra dữ liệu/định dạng."
                        : "Chưa thấy logic validation rõ ràng.",
                evidence: validationEvidence,
            })
        );

        const navigationEvidence = findEvidence(ctx, [
            /\bNavHost\b/,
            /\bnavigate\s*\(/,
            /\bpopBackStack\s*\(/,
            /\bnavigateUp\s*\(/,
            /\bstartActivity\s*\(/,
            /\bIntent\s*\(/,
            /FLAG_ACTIVITY_REORDER_TO_FRONT/,
            /FLAG_ACTIVITY_SINGLE_TOP/
        ]);
        checks.push(
            makeCheck({
                code: "navigation_and_back",
                label: "Điều hướng và quay lại",
                criterionCode: findCriterionCode(rubric, ["điều hướng", "quay lại", "back"]),
                passed: navigationEvidence.length > 0,
                score: navigationEvidence.length > 0 ? 1 : 0,
                maxScore: 1,
                message:
                    navigationEvidence.length > 0
                        ? "Tìm thấy dấu hiệu navigate/back."
                        : "Chưa thấy logic điều hướng/back rõ ràng.",
                evidence: navigationEvidence,
            })
        );

        const saveDataEvidence = findEvidence(ctx, [
            /\.insert\s*\(/,
            /insert\s*\(/,
            /MutableStateFlow/,
            /collectAsState/,
            /observeAsState/,
        ]);
        checks.push(
            makeCheck({
                code: "save_and_refresh_data",
                label: "Lưu dữ liệu và cập nhật danh sách",
                criterionCode: findCriterionCode(rubric, ["lưu", "database", "hiển thị", "danh sách", "nhận dữ liệu"]),
                passed: saveDataEvidence.length > 0,
                score: saveDataEvidence.length > 0 ? 1 : 0,
                maxScore: 1,
                message:
                    saveDataEvidence.length > 0
                        ? "Tìm thấy dấu hiệu insert/cập nhật state danh sách."
                        : "Chưa thấy dấu hiệu lưu dữ liệu và refresh danh sách.",
                evidence: saveDataEvidence,
            })
        );

        const longPressEvidence = findEvidence(ctx, [
            /\bcombinedClickable\b/,
            /\bonLongClick\b/,
            /\bonLongPress\b/,
            /\bdetectTapGestures\b/,
            /\.delete\s*\(/,
            /delete\s*\(/,
        ]);
        checks.push(
            makeCheck({
                code: "delete_by_long_press",
                label: "Nhấn giữ để xóa item",
                criterionCode: findCriterionCode(rubric, ["nhấn giữ", "long click", "xóa item", "xóa"]),
                passed: longPressEvidence.length > 0,
                score: longPressEvidence.length > 0 ? 1 : 0,
                maxScore: 1,
                message:
                    longPressEvidence.length > 0
                        ? "Tìm thấy dấu hiệu long click và delete."
                        : "Chưa thấy logic long click/delete rõ ràng.",
                evidence: longPressEvidence,
            })
        );

        const sendBackEvidence = findEvidence(ctx, [
            /SavedStateHandle/,
            /sharedViewModel/i,
            /MutableStateFlow/,
            /StateFlow/,
            /\bonClick\s*=\s*\{/,
            /\bonClick\s*=\s*.*->/,
        ]);
        checks.push(
            makeCheck({
                code: "send_data_back",
                label: "Truyền dữ liệu ngược về màn hình trước",
                criterionCode: findCriterionCode(rubric, [
                    "truyền dữ liệu ngược",
                    "gửi dữ liệu về",
                    "màn hình 01",
                    "cửa sổ 01",
                ]),
                passed: sendBackEvidence.length > 0,
                score: sendBackEvidence.length > 0 ? 1 : 0,
                maxScore: 1,
                message:
                    sendBackEvidence.length > 0
                        ? "Tìm thấy dấu hiệu callback/shared state/truyền dữ liệu ngược."
                        : "Chưa thấy rõ logic truyền dữ liệu ngược.",
                evidence: sendBackEvidence,
            })
        );

        const staticPassedChecks = checks.filter((item) => item.status === "passed").length;

        let runtimeReport: RunnerReportInput | null = null;

        console.log("[RUNTIME] sourceArchive =", submission.sourceArchive);
        console.log("[RUNTIME] repositoryUrl =", submission.repositoryUrl);

        if (submission.sourceArchive?.url || submission.repositoryUrl) {
            console.log("[RUNTIME] start runAndroidProjectRuntime");

            runtimeReport = await runAndroidProjectRuntime({
                sourceArchive: submission.sourceArchive ?? null,
                repositoryUrl: submission.repositoryUrl ?? null,
                assignmentAttachments: submission.assignmentSnapshot?.attachments ?? [],
                assignmentRunnerConfig: submission.assignmentSnapshot?.runnerConfig ?? null,
                adbSerial: process.env.ANDROID_ADB_SERIAL || undefined,
            });

            console.log("[RUNTIME] result =", {
                runtimeStatus: runtimeReport.runtimeStatus,
                buildPassed: runtimeReport.buildPassed,
                testPassed: runtimeReport.testPassed,
                screenshots: runtimeReport.screenshots?.length ?? 0,
                logs: runtimeReport.logs?.length ?? 0,
            });
        } else {
            console.log("[RUNTIME] skipped because sourceArchive.url and repositoryUrl are missing");
        }

        const runtimeChecks = runtimeReport?.checks ?? [];
        const allChecks = [...checks, ...runtimeChecks];

        const passedChecks = allChecks.filter((item) => item.status === "passed").length;
        const ratio = allChecks.length ? passedChecks / allChecks.length : 0;

        return {
            buildPassed:
                runtimeReport?.buildPassed ??
                (project.hasManifest && project.hasAppGradle && project.hasSettingsGradle),

            testPassed: runtimeReport?.testPassed ?? null,

            runtimeStatus: runtimeReport?.runtimeStatus ?? "not_run",

            visualSimilarity: runtimeReport
                ? runtimeReport.visualSimilarity ?? null
                : round2(clamp(ratio, 0, 1) * 100),

            accessibilityScore: null,

            packageName: runtimeReport?.packageName ?? null,
            apkPath: runtimeReport?.apkPath ?? null,

            screenshots: runtimeReport?.screenshots ?? [],
            artifacts: runtimeReport?.artifacts ?? [],
            logs: runtimeReport?.logs ?? [],

            visualComparison: runtimeReport?.visualComparison ?? null,
            visualComparisons: runtimeReport?.visualComparisons ?? [],
            checks: allChecks,

            rawSummary: runtimeReport
                ? runtimeReport.rawSummary
                : `Runner tĩnh đã quét source Android. Passed ${staticPassedChecks}/${checks.length} checks.`,
        };
    } catch (error) {
        return {
            buildPassed: null,
            testPassed: null,
            checks: [
                makeCheck({
                    code: "runner_exception",
                    label: "Runner exception",
                    status: "not_run",
                    score: 0,
                    maxScore: 0,
                    message:
                        error instanceof Error
                            ? `Runner lỗi: ${error.message}`
                            : "Runner lỗi không xác định.",
                    evidence: [],
                }),
            ],
            rawSummary:
                error instanceof Error ? `Runner exception: ${error.message}` : "Runner exception.",
        };
    } finally {
        await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
}
