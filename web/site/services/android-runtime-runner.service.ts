import fs from "fs";
import { promises as fsp } from "fs";
import os from "os";
import path from "path";
import { execFile, spawn } from "child_process";
import AdmZip from "adm-zip";
import type { RunnerCheck, RunnerReportInput } from "@/lib/grading-contract";
import { compareStudentScreenshotWithBaseline } from "@/services/visual-comparison.service";

type UiTestAction =
    | {
    type: "wait";
    ms: number;
}
    | {
    type: "screenshot";
    screenKey: string;
}
    | {
    type: "tapTag";
    tag: string;
}
    | {
    type: "textTag";
    tag: string;
    value: string;
}
    | {
    type: "pressBack";
};

type UiScreenConfig = {
    screenKey: string;
    label?: string;
    baselineUrl?: string;
    threshold?: number;
};
type AssignmentRunnerConfig = {
    requiredFiles?: string[];
    entryFiles?: string[];
    buildCommand?: string;
    runCommand?: string;
    deviceProfiles?: string[];
    screenshotTargets?: string[];
    scenarioId?: string;
    scenarioName?: string;
    uiScreens?: UiScreenConfig[];
    uiActions?: UiTestAction[];
} | null | undefined;
type SourceArchive = {
    url?: string | null;
    storedName?: string | null;
    originalName?: string | null;
} | null | undefined;
const DEFAULT_AVD_NAME = process.env.ANDROID_AVD_NAME || "Pixel_6";

type EmulatorStartResult = {
    ok: boolean;
    started: boolean;
    message: string;
    stdout: string;
    stderr: string;
};

let emulatorReadyCache = false;
let emulatorStartingPromise: Promise<EmulatorStartResult> | null = null;
type AssignmentAttachment = {
    kind?: string;
    url?: string;
    originalName?: string;
    mimeType?: string;
};

function makeCheck(input: {
    code: string;
    label: string;
    status: RunnerCheck["status"];
    message: string;
    evidence?: string[];
}): RunnerCheck {
    return {
        code: input.code,
        label: input.label,
        status: input.status,
        message: input.message,
        evidence: input.evidence ?? [],
        score: input.status === "passed" ? 1 : 0,
        maxScore: 1,
    };
}

function archiveToAbsolutePath(sourceArchive: SourceArchive) {
    const url = String(sourceArchive?.url || "").trim();
    if (!url) return null;

    if (url.startsWith("/")) {
        return path.join(process.cwd(), "public", url.replace(/^\//, ""));
    }

    return path.join(process.cwd(), "public", url);
}

function runText(
    cmd: string,
    args: string[],
    cwd?: string,
    timeoutMs = 120_000
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
        execFile(
            cmd,
            args,
            {
                cwd,
                timeout: timeoutMs,
                maxBuffer: 1024 * 1024 * 20,
                env: process.env,
            },
            (error, stdout, stderr) => {
                resolve({
                    ok: !error,
                    stdout: String(stdout || ""),
                    stderr: String(stderr || error?.message || ""),
                });
            }
        );
    });
}

function runTextLive(
    cmd: string,
    args: string[],
    cwd?: string,
    timeoutMs = 120_000
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
        console.log("[RUN-LIVE] start", { cmd, args, cwd, timeoutMs });

        const child = spawn(cmd, args, {
            cwd,
            env: process.env,
            shell: false,
            windowsHide: true,
        });

        let stdout = "";
        let stderr = "";
        let finished = false;

        const timer = setTimeout(() => {
            if (finished) return;

            finished = true;
            child.kill("SIGKILL");

            resolve({
                ok: false,
                stdout,
                stderr: stderr || `Command timeout after ${timeoutMs}ms`,
            });
        }, timeoutMs);

        child.stdout.on("data", (data) => {
            const text = data.toString();
            stdout += text;
            console.log("[RUN-LIVE][stdout]", text);
        });

        child.stderr.on("data", (data) => {
            const text = data.toString();
            stderr += text;
            console.log("[RUN-LIVE][stderr]", text);
        });

        child.on("error", (error) => {
            if (finished) return;

            finished = true;
            clearTimeout(timer);

            resolve({
                ok: false,
                stdout,
                stderr: stderr || error.message,
            });
        });

        child.on("close", (code) => {
            if (finished) return;

            finished = true;
            clearTimeout(timer);

            console.log("[RUN-LIVE] close", { code });

            resolve({
                ok: code === 0,
                stdout,
                stderr,
            });
        });
    });
}

function runBinary(
    cmd: string,
    args: string[],
    cwd?: string,
    timeoutMs = 30_000
): Promise<{ ok: boolean; stdout: Buffer; stderr: string }> {
    return new Promise((resolve) => {
        execFile(
            cmd,
            args,
            {
                cwd,
                timeout: timeoutMs,
                maxBuffer: 1024 * 1024 * 20,
                encoding: "buffer",
                env: process.env,
            },
            (error, stdout, stderr) => {
                resolve({
                    ok: !error,
                    stdout: Buffer.isBuffer(stdout) ? stdout : Buffer.from([]),
                    stderr: Buffer.isBuffer(stderr)
                        ? stderr.toString("utf8")
                        : String(stderr || error?.message || ""),
                });
            }
        );
    });
}

async function walk(dir: string): Promise<string[]> {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    const results: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // Không quét sâu các thư mục build/cache nặng nếu có trong bài nộp.
            if ([".gradle", "build", ".idea"].includes(entry.name)) continue;
            results.push(...await walk(fullPath));
        } else {
            results.push(fullPath);
        }
    }

    return results;
}

async function findAndroidProjectRoot(tempDir: string) {
    const files = await walk(tempDir);

    const settings = files.find((file) => {
        const lower = file.replace(/\\/g, "/").toLowerCase();
        return lower.endsWith("/settings.gradle.kts") || lower.endsWith("/settings.gradle");
    });

    return settings ? path.dirname(settings) : null;
}

async function findDebugApk(projectRoot: string) {
    const allFiles: string[] = [];

    async function scan(dir: string) {
        const entries = await fsp.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await scan(fullPath);
            } else {
                allFiles.push(fullPath);
            }
        }
    }

    await scan(projectRoot);

    return allFiles.find((file) => {
        const lower = file.replace(/\\/g, "/").toLowerCase();
        return lower.endsWith(".apk") && lower.includes("/build/outputs/apk/debug/");
    }) || null;
}

async function readPackageName(projectRoot: string) {
    const candidates = [
        path.join(projectRoot, "app", "build.gradle.kts"),
        path.join(projectRoot, "app", "build.gradle"),
        path.join(projectRoot, "app", "src", "main", "AndroidManifest.xml"),
    ];

    for (const file of candidates) {
        if (!fs.existsSync(file)) continue;

        const text = await fsp.readFile(file, "utf8").catch(() => "");

        const applicationId =
            text.match(/applicationId\s*=\s*["']([^"']+)["']/)?.[1] ||
            text.match(/applicationId\s+["']([^"']+)["']/)?.[1];

        if (applicationId) return applicationId;
    }

    for (const file of candidates) {
        if (!fs.existsSync(file)) continue;

        const text = await fsp.readFile(file, "utf8").catch(() => "");

        const namespace =
            text.match(/namespace\s*=\s*["']([^"']+)["']/)?.[1] ||
            text.match(/namespace\s+["']([^"']+)["']/)?.[1];

        if (namespace) return namespace;

        const manifestPackage = text.match(/package\s*=\s*["']([^"']+)["']/)?.[1];
        if (manifestPackage) return manifestPackage;
    }

    return null;
}

async function commandExists(command: string) {
    const check = process.platform === "win32"
        ? await runText("where", [command], undefined, 10_000)
        : await runText("which", [command], undefined, 10_000);

    return check.ok && check.stdout.trim().length > 0;
}

function findWindowsGradleExecutable() {
    if (process.platform !== "win32") return null;

    const candidates = [
        "C:\\ProgramData\\chocolatey\\bin\\gradle.exe",
        "C:\\ProgramData\\chocolatey\\lib\\gradle\\tools\\gradle\\bin\\gradle.bat",
        path.join(process.env.USERPROFILE || "", "scoop", "shims", "gradle.cmd"),
        path.join(process.env.USERPROFILE || "", "scoop", "apps", "gradle", "current", "bin", "gradle.bat"),
        "C:\\Gradle\\gradle-8.7\\bin\\gradle.bat",
        "C:\\Gradle\\gradle-8.9\\bin\\gradle.bat",
    ];

    return candidates.find((item) => item && fs.existsSync(item)) || null;
}

async function detectAndroidGradlePluginVersion(projectRoot: string) {
    const candidates = [
        path.join(projectRoot, "build.gradle.kts"),
        path.join(projectRoot, "build.gradle"),
        path.join(projectRoot, "settings.gradle.kts"),
        path.join(projectRoot, "settings.gradle"),
    ];

    for (const file of candidates) {
        if (!fs.existsSync(file)) continue;

        const text = await fsp.readFile(file, "utf8").catch(() => "");

        const patterns = [
            /id\s*\(\s*["']com\.android\.application["']\s*\)\s*version\s*["']([^"']+)["']/,
            /id\s+["']com\.android\.application["']\s+version\s+["']([^"']+)["']/,
            /com\.android\.application["']?\s*version\s*["']([^"']+)["']/,
            /com\.android\.tools\.build:gradle:([^"'\s]+)/,
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match?.[1]) return match[1];
        }
    }

    return null;
}

function pickGradleVersionForAgp(agpVersion: string | null) {
    if (!agpVersion) return "8.7";

    const version = Number(agpVersion.split(".").slice(0, 2).join("."));
    if (Number.isNaN(version)) return "8.7";

    if (version >= 8.7) return "8.9";
    if (version >= 8.5) return "8.7";
    if (version >= 8.4) return "8.6";
    if (version >= 8.3) return "8.4";
    if (version >= 8.2) return "8.2";
    if (version >= 8.1) return "8.0";
    if (version >= 8.0) return "8.0";
    if (version >= 7.4) return "7.6";
    if (version >= 7.3) return "7.5";
    if (version >= 7.2) return "7.4.2";

    return "8.7";
}

async function ensureGradleWrapper(projectRoot: string) {
    const gradlew = path.join(projectRoot, "gradlew");
    const gradlewBat = path.join(projectRoot, "gradlew.bat");

    if (process.platform === "win32" && fs.existsSync(gradlewBat)) {
        return {
            ok: true,
            generated: false,
            message: "Project đã có gradlew.bat.",
            cmd: "cmd.exe",
            argsPrefix: ["/c", gradlewBat],
        };
    }

    if (process.platform !== "win32" && fs.existsSync(gradlew)) {
        await fsp.chmod(gradlew, 0o755).catch(() => {});

        return {
            ok: true,
            generated: false,
            message: "Project đã có gradlew.",
            cmd: gradlew,
            argsPrefix: [] as string[],
        };
    }

    let systemGradleCmd = "gradle";
    const hasSystemGradle = await commandExists("gradle");

    if (!hasSystemGradle) {
        const fallbackGradle = findWindowsGradleExecutable();

        if (fallbackGradle) {
            systemGradleCmd = fallbackGradle;
        } else {
            return {
                ok: false,
                generated: false,
                message:
                    "Project không có Gradle Wrapper và máy runner chưa tìm thấy Gradle global trong PATH hoặc đường dẫn phổ biến. " +
                    "Hãy chạy gradle -v trong terminal đang chạy npm run dev, hoặc sửa code trỏ đúng đường dẫn gradle.exe/gradle.bat.",
                cmd: "",
                argsPrefix: [] as string[],
            };
        }
    }

    const agpVersion = await detectAndroidGradlePluginVersion(projectRoot);
    const gradleVersion = pickGradleVersionForAgp(agpVersion);

    const wrapperResult = await runTextLive(
        systemGradleCmd,
        [
            "wrapper",
            "--gradle-version",
            gradleVersion,
            "--distribution-type",
            "bin",
            "--no-daemon",
            "--console=plain",
        ],
        projectRoot,
        600_000
    );

    if (!wrapperResult.ok) {
        return {
            ok: false,
            generated: false,
            message:
                "Máy runner có Gradle global nhưng sinh Gradle Wrapper thất bại.\n\n" +
                `${wrapperResult.stdout}\n${wrapperResult.stderr}`,
            cmd: "",
            argsPrefix: [] as string[],
        };
    }

    if (process.platform === "win32" && fs.existsSync(gradlewBat)) {
        return {
            ok: true,
            generated: true,
            message: `Đã tự sinh gradlew.bat bằng Gradle ${gradleVersion}.`,
            cmd: "cmd.exe",
            argsPrefix: ["/c", gradlewBat],
        };
    }

    if (fs.existsSync(gradlew)) {
        await fsp.chmod(gradlew, 0o755).catch(() => {});

        return {
            ok: true,
            generated: true,
            message: `Đã tự sinh gradlew bằng Gradle ${gradleVersion}.`,
            cmd: gradlew,
            argsPrefix: [] as string[],
        };
    }

    return {
        ok: false,
        generated: false,
        message: "Đã chạy gradle wrapper nhưng không thấy gradlew/gradlew.bat được tạo.",
        cmd: "",
        argsPrefix: [] as string[],
    };
}

function resolveEmulatorCommand() {
    const candidates = [
        process.env.EMULATOR_PATH,
        process.env.ANDROID_HOME
            ? path.join(process.env.ANDROID_HOME, "emulator", process.platform === "win32" ? "emulator.exe" : "emulator")
            : null,
        process.env.ANDROID_SDK_ROOT
            ? path.join(process.env.ANDROID_SDK_ROOT, "emulator", process.platform === "win32" ? "emulator.exe" : "emulator")
            : null,
        process.env.LOCALAPPDATA && process.platform === "win32"
            ? path.join(process.env.LOCALAPPDATA, "Android", "Sdk", "emulator", "emulator.exe")
            : null,
        process.platform === "win32" ? "C:\\Users\\a\\AppData\\Local\\Android\\Sdk\\emulator\\emulator.exe" : null,
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
    }

    return "emulator";
}

function resolveAdbCommand() {
    const candidates = [
        process.env.ADB_PATH,
        process.env.ANDROID_HOME
            ? path.join(process.env.ANDROID_HOME, "platform-tools", process.platform === "win32" ? "adb.exe" : "adb")
            : null,
        process.env.ANDROID_SDK_ROOT
            ? path.join(process.env.ANDROID_SDK_ROOT, "platform-tools", process.platform === "win32" ? "adb.exe" : "adb")
            : null,
        process.env.LOCALAPPDATA && process.platform === "win32"
            ? path.join(process.env.LOCALAPPDATA, "Android", "Sdk", "platform-tools", "adb.exe")
            : null,
        process.platform === "win32" ? "C:\\Users\\a\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe" : null,
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
    }

    return "adb";
}

async function hasReadyAdbDevice(adbCmd: string, adbSerial?: string) {
    const args = adbSerial ? ["-s", adbSerial, "devices"] : ["devices"];
    const result = await runText(adbCmd, args, undefined, 30_000);

    const lines = result.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("List of devices"));

    const hasDevice = lines.some((line) => /\bdevice$/.test(line));

    return {
        ok: result.ok && hasDevice,
        stdout: result.stdout,
        stderr: result.stderr,
    };
}

async function startEmulatorIfNeeded(input: {
    adbCmd: string;
    adbSerial?: string;
    avdName?: string;
}): Promise<EmulatorStartResult> {
    // Lần chấm sau: nếu đã xác nhận emulator chạy trước đó, kiểm tra nhanh lại bằng adb.
    if (emulatorReadyCache) {
        const cachedCheck = await hasReadyAdbDevice(input.adbCmd, input.adbSerial);

        if (cachedCheck.ok) {
            return {
                ok: true,
                started: false,
                message: "Emulator/device đã chạy sẵn từ lần chấm trước, dùng lại luôn.",
                stdout: cachedCheck.stdout,
                stderr: cachedCheck.stderr,
            };
        }

        // Nếu người dùng đã tắt emulator ngoài hệ thống thì bỏ cache.
        emulatorReadyCache = false;
    }

    const firstCheck = await hasReadyAdbDevice(input.adbCmd, input.adbSerial);

    if (firstCheck.ok) {
        emulatorReadyCache = true;

        return {
            ok: true,
            started: false,
            message: "Emulator/device đã chạy sẵn, không cần bật lại.",
            stdout: firstCheck.stdout,
            stderr: firstCheck.stderr,
        };
    }

    // Nếu đang có một bài khác bật emulator, không spawn thêm emulator mới.
    if (emulatorStartingPromise) {
        return emulatorStartingPromise;
    }

    emulatorStartingPromise = actuallyStartEmulator(input);

    try {
        const result = await emulatorStartingPromise;

        if (result.ok) {
            emulatorReadyCache = true;
        }

        return result;
    } finally {
        emulatorStartingPromise = null;
    }
}

async function actuallyStartEmulator(input: {
    adbCmd: string;
    adbSerial?: string;
    avdName?: string;
}): Promise<EmulatorStartResult> {
    const emulatorCmd = resolveEmulatorCommand();
    const avdName = input.avdName || DEFAULT_AVD_NAME;

    if (!fs.existsSync(emulatorCmd) && emulatorCmd !== "emulator") {
        return {
            ok: false,
            started: false,
            message: `Không tìm thấy emulator tại: ${emulatorCmd}`,
            stdout: "",
            stderr: "",
        };
    }

    const avdList = await runText(emulatorCmd, ["-list-avds"], undefined, 30_000);

    console.log("[RUNTIME-EMULATOR] available AVDs =", avdList.stdout);
    console.log("[RUNTIME-EMULATOR] selected AVD =", avdName);

    if (
        !avdList.ok ||
        !avdList.stdout
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean)
            .includes(avdName)
    ) {
        return {
            ok: false,
            started: false,
            message:
                `Không tìm thấy AVD tên "${avdName}".\n\n` +
                `Danh sách AVD hiện có:\n${avdList.stdout}\n\n` +
                `Hãy sửa ANDROID_AVD_NAME trong .env.local cho đúng.`,
            stdout: avdList.stdout,
            stderr: avdList.stderr,
        };
    }

    const emulatorArgs = [
        "-avd",
        avdName,
        "-no-snapshot",
        "-no-audio",
        "-no-boot-anim",
        "-gpu",
        "swiftshader_indirect",
    ];

    console.log("[RUNTIME-EMULATOR] starting emulator", {
        emulatorCmd,
        emulatorArgs,
    });

    const child = spawn(
        "cmd.exe",
        [
            "/c",
            "start",
            '""',
            "/min",
            emulatorCmd,
            ...emulatorArgs,
        ],
        {
            detached: true,
            stdio: "ignore",
            windowsHide: true,
            shell: false,
            env: process.env,
        }
    );

    child.unref();

    let emulatorStdout = "";
    let emulatorStderr = "";

    child.stdout?.on("data", (data) => {
        const text = data.toString();
        emulatorStdout += text;
        console.log("[RUNTIME-EMULATOR][stdout]", text);
    });

    child.stderr?.on("data", (data) => {
        const text = data.toString();
        emulatorStderr += text;
        console.log("[RUNTIME-EMULATOR][stderr]", text);
    });

    child.on("error", (error) => {
        emulatorStderr += error.message;
        console.log("[RUNTIME-EMULATOR] spawn error", error.message);
    });

    child.unref();

    const maxWaitMs = Number(process.env.ANDROID_EMULATOR_WAIT_MS || 300_000);
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const deviceCheck = await hasReadyAdbDevice(input.adbCmd, input.adbSerial);

        if (deviceCheck.ok) {
            const bootArgs = input.adbSerial
                ? ["-s", input.adbSerial, "shell", "getprop", "sys.boot_completed"]
                : ["shell", "getprop", "sys.boot_completed"];

            const boot = await runText(input.adbCmd, bootArgs, undefined, 30_000);

            if (boot.stdout.trim() === "1") {
                return {
                    ok: true,
                    started: true,
                    message: `Đã tự bật emulator ${avdName} và emulator đã boot xong.`,
                    stdout: `${deviceCheck.stdout}\n${emulatorStdout}`,
                    stderr: `${deviceCheck.stderr}\n${emulatorStderr}`,
                };
            }

            console.log("[RUNTIME-EMULATOR] device found, waiting boot_completed...", {
                boot: boot.stdout.trim(),
            });
        } else {
            console.log("[RUNTIME-EMULATOR] waiting emulator device...");
        }
    }

    const finalCheck = await hasReadyAdbDevice(input.adbCmd, input.adbSerial);

    return {
        ok: false,
        started: true,
        message: `Đã thử bật emulator ${avdName} nhưng emulator chưa sẵn sàng sau ${maxWaitMs / 1000} giây.`,
        stdout: `${finalCheck.stdout}\n${emulatorStdout}`,
        stderr: `${finalCheck.stderr}\n${emulatorStderr}`,
    };
}

function compactLog(stdout: string, stderr: string, limit = 30000) {
    const fullLog = `${stdout}\n${stderr}`;

    if (fullLog.length <= limit) return fullLog;

    const half = Math.floor(limit / 2);
    return fullLog.slice(0, half) +
        "\n\n... LOG ĐÃ BỊ RÚT GỌN Ở GIỮA ...\n\n" +
        fullLog.slice(-half);
}


function normalizeGithubUrl(url?: string | null) {
    const value = String(url || "").trim();

    if (!value) return null;

    const match = value.match(/^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/?$/);

    if (!match) return null;

    const owner = match[1];
    const repo = match[2];

    if (!owner || !repo) return null;

    return {
        owner,
        repo,
        displayUrl: `https://github.com/${owner}/${repo}`,
        cloneUrl: `https://github.com/${owner}/${repo}.git`,
    };
}

async function assertPublicGithubRepo(gitUrl: string) {
    const normalized = normalizeGithubUrl(gitUrl);

    if (!normalized) {
        return {
            ok: false,
            message: "Link GitHub không hợp lệ. Chỉ chấp nhận dạng https://github.com/owner/repo",
            stdout: "",
            stderr: "",
        };
    }

    const hasGit = await commandExists("git");

    if (!hasGit) {
        return {
            ok: false,
            message: "Máy runner chưa cài Git hoặc lệnh git chưa có trong PATH.",
            stdout: "",
            stderr: "git command not found",
        };
    }

    const result = await runTextLive(
        "git",
        ["ls-remote", "--exit-code", normalized.cloneUrl, "HEAD"],
        undefined,
        60_000
    );

    if (!result.ok) {
        return {
            ok: false,
            message:
                "Không truy cập được repository GitHub. Repo phải để Public và link phải đúng dạng https://github.com/owner/repo.",
            stdout: result.stdout,
            stderr: result.stderr,
        };
    }

    return {
        ok: true,
        message: "Repository GitHub hợp lệ và truy cập public được.",
        stdout: result.stdout,
        stderr: result.stderr,
    };
}

function isGeneratedAndroidRepoPath(repoPath: string) {
    const normalized = repoPath.replace(/\\/g, "/").replace(/^\/+/, "").toLowerCase();
    const parts = normalized.split("/").filter(Boolean);

    return (
        parts.includes("build") ||
        parts.includes(".gradle") ||
        parts.includes(".idea") ||
        normalized.endsWith(".iml") ||
        normalized === "local.properties" ||
        normalized.endsWith("/local.properties")
    );
}

function summarizeGeneratedRepoPaths(paths: string[], limit = 40) {
    if (!paths.length) return "Không phát hiện file/thư mục build cache thừa.";

    const shown = paths.slice(0, limit).join("\n");
    const more = paths.length > limit ? `\n... còn ${paths.length - limit} file/thư mục khác` : "";

    return (
        `Phát hiện ${paths.length} file/thư mục sinh tự động trong repo GitHub. ` +
        "Hệ thống đã bỏ qua các file này khi checkout để clone/build sạch.\n" +
        shown +
        more
    );
}

async function writeSparseCheckoutRules(repoDir: string) {
    const infoDir = path.join(repoDir, ".git", "info");
    await fsp.mkdir(infoDir, { recursive: true });

    const sparseRules = [
        "/*",
        "!/.gradle/",
        "!/.gradle/**",
        "!/.idea/",
        "!/.idea/**",
        "!/build/",
        "!/build/**",
        "!/**/build/",
        "!/**/build/**",
        "!/local.properties",
        "!/**/local.properties",
        "!/*.iml",
        "!/**/*.iml",
        "",
    ].join("\n");

    await fsp.writeFile(path.join(infoDir, "sparse-checkout"), sparseRules, "utf8");
}

async function removeGeneratedAndroidDirs(projectRoot: string) {
    const candidates = [
        path.join(projectRoot, ".gradle"),
        path.join(projectRoot, ".idea"),
        path.join(projectRoot, "build"),
        path.join(projectRoot, "app", "build"),
        path.join(projectRoot, "local.properties"),
    ];

    for (const item of candidates) {
        await fsp.rm(item, { recursive: true, force: true }).catch(() => {});
    }
}

async function cloneGithubRepo(input: {
    gitUrl: string;
    tempDir: string;
}) {
    const normalized = normalizeGithubUrl(input.gitUrl);

    if (!normalized) {
        return {
            ok: false,
            projectDir: "",
            stdout: "",
            stderr: "Link GitHub không hợp lệ. Chỉ chấp nhận dạng https://github.com/owner/repo",
        };
    }

    const publicCheck = await assertPublicGithubRepo(input.gitUrl);

    if (!publicCheck.ok) {
        return {
            ok: false,
            projectDir: "",
            stdout: publicCheck.stdout,
            stderr: `${publicCheck.message}\n\n${publicCheck.stderr}`,
        };
    }

    const targetDir = path.join(input.tempDir, "repo");

    // Clone không checkout ngay để tránh lỗi Windows "Filename too long"
    // khi sinh viên lỡ push app/build, build, .gradle, .idea lên GitHub.
    const clone = await runTextLive(
        "git",
        [
            "clone",
            "--depth",
            "1",
            "--filter=blob:none",
            "--no-checkout",
            normalized.cloneUrl,
            targetDir,
        ],
        undefined,
        180_000
    );

    if (!clone.ok) {
        return {
            ok: false,
            projectDir: "",
            stdout: clone.stdout,
            stderr: clone.stderr,
        };
    }

    // Bật longpaths riêng cho repo này. Nếu máy Windows chưa bật global, lệnh này vẫn giúp phần lớn case.
    await runText("git", ["config", "core.longpaths", "true"], targetDir, 30_000);

    const trackedFiles = await runTextLive(
        "git",
        ["ls-tree", "-r", "--name-only", "HEAD"],
        targetDir,
        60_000
    );

    if (!trackedFiles.ok) {
        return {
            ok: false,
            projectDir: "",
            stdout: `${clone.stdout}\n${trackedFiles.stdout}`,
            stderr: `Clone được repo nhưng không đọc được danh sách file.\n${trackedFiles.stderr}`,
        };
    }

    const generatedPaths = trackedFiles.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter(isGeneratedAndroidRepoPath);

    const cleanupReport = summarizeGeneratedRepoPaths(generatedPaths);

    // Luôn sparse checkout để loại bỏ build cache nếu có. Nếu không có file thừa, rules này vẫn an toàn.
    await runText("git", ["config", "core.sparseCheckout", "true"], targetDir, 30_000);
    await runText("git", ["config", "core.sparseCheckoutCone", "false"], targetDir, 30_000);
    await writeSparseCheckoutRules(targetDir);

    const checkout = await runTextLive(
        "git",
        ["checkout", "-f", "HEAD"],
        targetDir,
        180_000
    );

    if (!checkout.ok) {
        const checkoutLog = `${checkout.stdout}\n${checkout.stderr}`;
        const filenameTooLongHelp = checkoutLog.toLowerCase().includes("filename too long")
            ? "\n\nRepo vẫn còn file đường dẫn quá dài. Hãy yêu cầu sinh viên xóa build/, app/build/, .gradle/, .idea/ khỏi GitHub hoặc bật Windows long paths cho Git."
            : "";

        return {
            ok: false,
            projectDir: "",
            stdout: `${clone.stdout}\n${trackedFiles.stdout}\n${checkout.stdout}`,
            stderr: `${cleanupReport}\n\nCheckout source thất bại.\n${checkout.stderr}${filenameTooLongHelp}`,
        };
    }

    await removeGeneratedAndroidDirs(targetDir);

    return {
        ok: true,
        projectDir: targetDir,
        stdout: [
            clone.stdout,
            trackedFiles.stdout,
            checkout.stdout,
            "",
            cleanupReport,
        ].join("\n"),
        stderr: [clone.stderr, trackedFiles.stderr, checkout.stderr].filter(Boolean).join("\n"),
    };
}

async function prepareProjectSource(input: {
    sourceArchive: SourceArchive;
    repositoryUrl?: string | null;
    tempDir: string;
    logs: Array<{ label: string; content: string }>;
}) {
    const gitUrl = String(input.repositoryUrl || "").trim();

    if (gitUrl) {
        const normalized = normalizeGithubUrl(gitUrl);

        if (!normalized) {
            return {
                ok: false,
                sourceRoot: "",
                message: "Link GitHub không hợp lệ. Chỉ chấp nhận dạng https://github.com/owner/repo",
            };
        }

        const cloned = await cloneGithubRepo({
            gitUrl,
            tempDir: input.tempDir,
        });

        input.logs.push({
            label: "GitHub clone log",
            content:
                `Git URL: ${gitUrl}\n` +
                `Yêu cầu: repository phải Public và link đúng dạng https://github.com/owner/repo\n\n` +
                `stdout:\n${cloned.stdout}\n\n` +
                `stderr:\n${cloned.stderr}`,
        });

        if (!cloned.ok) {
            return {
                ok: false,
                sourceRoot: "",
                message:
                    "Không clone được repository GitHub. Repo phải Public, link phải đúng dạng https://github.com/owner/repo, và máy runner phải cài Git.",
            };
        }

        return {
            ok: true,
            sourceRoot: cloned.projectDir,
            message: "Đã clone repository GitHub public thành công.",
        };
    }

    const archivePath = archiveToAbsolutePath(input.sourceArchive);

    if (!archivePath || !fs.existsSync(archivePath)) {
        return {
            ok: false,
            sourceRoot: "",
            message: "Không tìm thấy file ZIP bài nộp và cũng không có link GitHub.",
        };
    }

    const zip = new AdmZip(archivePath);
    zip.extractAllTo(input.tempDir, true);

    return {
        ok: true,
        sourceRoot: input.tempDir,
        message: "Đã giải nén ZIP bài nộp thành công.",
    };
}
function parseBounds(value: string) {
    const match = value.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);

    if (!match) return null;

    const left = Number(match[1]);
    const top = Number(match[2]);
    const right = Number(match[3]);
    const bottom = Number(match[4]);

    return {
        left,
        top,
        right,
        bottom,
        x: Math.round((left + right) / 2),
        y: Math.round((top + bottom) / 2),
    };
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function dumpUiXml(input: {
    adbCmd: string;
    adbBase: string[];
}) {
    await runText(
        input.adbCmd,
        [...input.adbBase, "shell", "uiautomator", "dump", "/sdcard/window.xml"],
        undefined,
        30_000
    );

    const result = await runText(
        input.adbCmd,
        [...input.adbBase, "exec-out", "cat", "/sdcard/window.xml"],
        undefined,
        30_000
    );

    return result.stdout;
}

async function findBoundsByTestTag(input: {
    adbCmd: string;
    adbBase: string[];
    tag: string;
}) {
    const xml = await dumpUiXml({
        adbCmd: input.adbCmd,
        adbBase: input.adbBase,
    });

    const escaped = escapeRegExp(input.tag);

    const patterns = [
        new RegExp(
            `<node[^>]*(?:resource-id|content-desc|text)="[^"]*${escaped}[^"]*"[^>]*bounds="([^"]+)"`,
            "i"
        ),
        new RegExp(
            `<node[^>]*bounds="([^"]+)"[^>]*(?:resource-id|content-desc|text)="[^"]*${escaped}[^"]*"`,
            "i"
        ),
    ];

    for (const pattern of patterns) {
        const match = xml.match(pattern);

        if (match?.[1]) {
            return parseBounds(match[1]);
        }
    }

    return null;
}

async function tapByTestTag(input: {
    adbCmd: string;
    adbBase: string[];
    tag: string;
}) {
    const bounds = await findBoundsByTestTag(input);

    if (!bounds) {
        return {
            ok: false,
            message:
                `Không tìm thấy testTag "${input.tag}". ` +
                "Kiểm tra sinh viên đã dùng Modifier.testTag và root có testTagsAsResourceId = true chưa.",
        };
    }

    const tap = await runText(
        input.adbCmd,
        [...input.adbBase, "shell", "input", "tap", String(bounds.x), String(bounds.y)],
        undefined,
        30_000
    );

    return {
        ok: tap.ok,
        message: tap.ok
            ? `Đã tap testTag "${input.tag}" tại (${bounds.x}, ${bounds.y}).`
            : `Tap testTag "${input.tag}" thất bại: ${tap.stderr}`,
    };
}

function adbSafeText(value: string) {
    return value
        .replace(/\s+/g, "%s")
        .replace(/&/g, "\\&")
        .replace(/</g, "\\<")
        .replace(/>/g, "\\>")
        .replace(/\|/g, "\\|");
}

async function textByTestTag(input: {
    adbCmd: string;
    adbBase: string[];
    tag: string;
    value: string;
}) {
    const tapped = await tapByTestTag({
        adbCmd: input.adbCmd,
        adbBase: input.adbBase,
        tag: input.tag,
    });

    if (!tapped.ok) return tapped;

    await new Promise((resolve) => setTimeout(resolve, 500));

    const text = await runText(
        input.adbCmd,
        [...input.adbBase, "shell", "input", "text", adbSafeText(input.value)],
        undefined,
        30_000
    );

    return {
        ok: text.ok,
        message: text.ok
            ? `Đã nhập "${input.value}" vào testTag "${input.tag}".`
            : `Nhập text vào "${input.tag}" thất bại: ${text.stderr}`,
    };
}
function extractPackageNameFromDump(text: string) {
    const patterns = [
        /mCurrentFocus=Window\{[^}]*\s([a-zA-Z][\w.]+)\/[^\s}]+/i,
        /mFocusedApp=.*?ActivityRecord\{[^}]*\s([a-zA-Z][\w.]+)\/[^\s}]+/i,
        /topResumedActivity=.*?ActivityRecord\{[^}]*\s([a-zA-Z][\w.]+)\/[^\s}]+/i,
        /mResumedActivity: ActivityRecord\{[^}]*\s([a-zA-Z][\w.]+)\/[^\s}]+/i,
        /ResumedActivity: ActivityRecord\{[^}]*\s([a-zA-Z][\w.]+)\/[^\s}]+/i,
        /ACTIVITY\s+([a-zA-Z][\w.]+)\/[^\s}]+/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) return match[1];
    }

    return "";
}

async function getCurrentForegroundApp(input: {
    adbCmd: string;
    adbBase: string[];
}) {
    const commands = [
        ["shell", "dumpsys", "window"],
        ["shell", "dumpsys", "activity", "activities"],
        ["shell", "dumpsys", "activity", "top"],
    ];

    const logs: string[] = [];

    for (const args of commands) {
        const result = await runText(
            input.adbCmd,
            [...input.adbBase, ...args],
            undefined,
            30_000
        );

        const text = `${result.stdout}\n${result.stderr}`;
        logs.push(`$ adb ${args.join(" ")}\n${text}`);

        const packageName = extractPackageNameFromDump(text);

        if (packageName) {
            return {
                ok: true,
                packageName,
                raw: logs.join("\n\n").slice(0, 4000),
            };
        }
    }

    return {
        ok: false,
        packageName: "",
        raw: logs.join("\n\n").slice(0, 4000),
    };
}

async function isAppInForeground(input: {
    adbCmd: string;
    adbBase: string[];
    packageName: string;
}) {
    const current = await getCurrentForegroundApp({
        adbCmd: input.adbCmd,
        adbBase: input.adbBase,
    });

    return {
        ok: current.packageName === input.packageName,
        currentPackage: current.packageName,
        raw: current.raw,
    };
}

async function resolveLauncherActivity(input: {
    adbCmd: string;
    adbBase: string[];
    packageName: string;
}) {
    const result = await runText(
        input.adbCmd,
        [
            ...input.adbBase,
            "shell",
            "cmd",
            "package",
            "resolve-activity",
            "--brief",
            input.packageName,
        ],
        undefined,
        30_000
    );

    const lines = result.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    const activity = lines.find((line) => line.includes("/"));

    return {
        ok: result.ok && Boolean(activity),
        activity: activity || "",
        log: `${result.stdout}\n${result.stderr}`,
    };
}

async function launchAppAndVerify(input: {
    adbCmd: string;
    adbBase: string[];
    packageName: string;
}) {
    const logs: string[] = [];

    const monkey = await runTextLive(
        input.adbCmd,
        [
            ...input.adbBase,
            "shell",
            "monkey",
            "-p",
            input.packageName,
            "-c",
            "android.intent.category.LAUNCHER",
            "1",
        ],
        undefined,
        30_000
    );

    logs.push("=== monkey launch ===");
    logs.push(monkey.stdout);
    logs.push(monkey.stderr);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    let foreground = await isAppInForeground({
        adbCmd: input.adbCmd,
        adbBase: input.adbBase,
        packageName: input.packageName,
    });

    logs.push("=== foreground after monkey ===");
    logs.push(`currentPackage=${foreground.currentPackage}`);

    if (foreground.ok) {
        return {
            ok: true,
            message: "App đã mở và đang ở foreground sau lệnh monkey.",
            log: logs.join("\n"),
        };
    }

    const resolved = await resolveLauncherActivity({
        adbCmd: input.adbCmd,
        adbBase: input.adbBase,
        packageName: input.packageName,
    });

    logs.push("=== resolve launcher activity ===");
    logs.push(resolved.log);
    logs.push(`activity=${resolved.activity}`);

    if (resolved.activity) {
        const start = await runTextLive(
            input.adbCmd,
            [
                ...input.adbBase,
                "shell",
                "am",
                "start",
                "-W",
                "-n",
                resolved.activity,
            ],
            undefined,
            30_000
        );

        logs.push("=== am start launch ===");
        logs.push(start.stdout);
        logs.push(start.stderr);

        await new Promise((resolve) => setTimeout(resolve, 3000));

        foreground = await isAppInForeground({
            adbCmd: input.adbCmd,
            adbBase: input.adbBase,
            packageName: input.packageName,
        });

        logs.push("=== foreground after am start ===");
        logs.push(`currentPackage=${foreground.currentPackage}`);

        if (foreground.ok) {
            return {
                ok: true,
                message: "App đã mở và đang ở foreground sau lệnh am start.",
                log: logs.join("\n"),
            };
        }
    }

    return {
        ok: false,
        message:
            `Không xác nhận được app đang mở. Package cần mở: ${input.packageName}. ` +
            `Package hiện tại: ${foreground.currentPackage || "không đọc được"}.`,
        log: logs.join("\n"),
    };
}
async function runUiScenario(input: {
    adbCmd: string;
    adbBase: string[];
    outputDir: string;
    packageName: string;
    actions: UiTestAction[];
}) {
    const screenshots: Array<{
        screenKey: string;
        label: string;
        path: string;
        url: string;
        mimeType: string;
    }> = [];

    const logs: Array<{ label: string; content: string }> = [];

    for (const action of input.actions) {
        if (action.type === "wait") {
            await new Promise((resolve) => setTimeout(resolve, Number(action.ms || 1000)));
            continue;
        }

        if (action.type === "pressBack") {
            await runText(
                input.adbCmd,
                [...input.adbBase, "shell", "input", "keyevent", "4"],
                undefined,
                30_000
            );
            continue;
        }

        if (action.type === "tapTag") {
            const result = await tapByTestTag({
                adbCmd: input.adbCmd,
                adbBase: input.adbBase,
                tag: action.tag,
            });

            logs.push({
                label: `UI action tapTag ${action.tag}`,
                content: result.message,
            });

            if (!result.ok) {
                return {
                    ok: false as const,
                    screenshots,
                    logs,
                    message: result.message,
                };
            }

            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
        }

        if (action.type === "textTag") {
            const result = await textByTestTag({
                adbCmd: input.adbCmd,
                adbBase: input.adbBase,
                tag: action.tag,
                value: action.value,
            });

            logs.push({
                label: `UI action textTag ${action.tag}`,
                content: result.message,
            });

            if (!result.ok) {
                return {
                    ok: false as const,
                    screenshots,
                    logs,
                    message: result.message,
                };
            }

            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
        }

        if (action.type === "screenshot") {
            const screenshot = await captureScreenshot({
                adbCmd: input.adbCmd,
                adbBase: input.adbBase,
                outputDir: input.outputDir,
                packageName: input.packageName,
                screenKey: action.screenKey,
            });

            if (!screenshot.ok) {
                return {
                    ok: false as const,
                    screenshots,
                    logs,
                    message: screenshot.error,
                };
            }

            screenshots.push({
                screenKey: action.screenKey,
                label: action.screenKey,
                path: screenshot.path,
                url: screenshot.url,
                mimeType: "image/png",
            });

            continue;
        }
    }

    return {
        ok: true as const,
        screenshots,
        logs,
        message: "Đã chạy xong kịch bản UI.",
    };
}
async function captureScreenshot(input: {
    screenKey?: string;
    adbCmd: string;
    adbBase: string[];
    outputDir: string;
    packageName: string;
}) {
    // Chờ app qua splash screen và Compose render xong.
    await new Promise((resolve) => setTimeout(resolve, 1200));

    let finalScreenshotBuffer: Buffer | null = null;
    let lastScreenshotError = "";

    for (let attempt = 1; attempt <= 3; attempt++) {
        const capture = await runBinary(
            input.adbCmd,
            [...input.adbBase, "exec-out", "screencap", "-p"],
            undefined,
            30_000
        );

        if (capture.ok && capture.stdout.length > 0) {
            finalScreenshotBuffer = capture.stdout;
        } else {
            lastScreenshotError = capture.stderr;
        }

        if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 2500));
        }
    }

    if (!finalScreenshotBuffer || finalScreenshotBuffer.length === 0) {
        return {
            ok: false as const,
            error: lastScreenshotError || "Không nhận được dữ liệu ảnh từ adb screencap.",
            path: "",
            url: "",
        };
    }

    const safePackage = input.packageName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const safeScreenKey = String(input.screenKey || "home").replace(/[^a-zA-Z0-9._-]/g, "_");
    const screenshotName = `${Date.now()}-${safePackage}-${safeScreenKey}.png`;
    const screenshotPath = path.join(input.outputDir, screenshotName);
    const screenshotUrl = `/uploads/runner-artifacts/${screenshotName}`;
    await fsp.writeFile(screenshotPath, finalScreenshotBuffer);

    return {
        ok: true as const,
        path: screenshotPath,
        url: screenshotUrl,
        error: "",
    };
}
export async function runAndroidProjectRuntime(input: {
    sourceArchive: SourceArchive;
    repositoryUrl?: string | null;
    assignmentAttachments?: AssignmentAttachment[];
    assignmentRunnerConfig?: AssignmentRunnerConfig;
    adbSerial?: string;
}): Promise<RunnerReportInput> {
    console.time("[RUNTIME-TIME] total");

    const checks: RunnerCheck[] = [];
    const logs: Array<{ label: string; content: string }> = [];

    const hasArchive = Boolean(input.sourceArchive?.url);
    const hasGitUrl = Boolean(String(input.repositoryUrl || "").trim());

    if (!hasArchive && !hasGitUrl) {
        return {
            runtimeStatus: "project_invalid",
            buildPassed: false,
            testPassed: false,
            checks: [
                makeCheck({
                    code: "source_missing",
                    label: "Nguồn bài nộp",
                    status: "failed",
                    message: "Không có file ZIP bài nộp và cũng không có link GitHub.",
                }),
            ],
            rawSummary: "Không chạy được vì thiếu nguồn bài nộp.",
        };
    }

    const runnerRoot = process.env.ANDROID_RUNNER_TMP || os.tmpdir();
    await fsp.mkdir(runnerRoot, { recursive: true });
    const tempDir = await fsp.mkdtemp(path.join(runnerRoot, "android-runtime-"));
    const outputDir = path.join(process.cwd(), "public", "uploads", "runner-artifacts");
    await fsp.mkdir(outputDir, { recursive: true });

    try {
        const preparedSource = await prepareProjectSource({
            sourceArchive: input.sourceArchive,
            repositoryUrl: input.repositoryUrl,
            tempDir,
            logs,
        });

        if (!preparedSource.ok) {
            return {
                runtimeStatus: "project_invalid",
                buildPassed: false,
                testPassed: false,
                checks: [
                    makeCheck({
                        code: "source_prepare",
                        label: "Chuẩn bị source bài nộp",
                        status: "failed",
                        message: preparedSource.message,
                    }),
                ],
                logs,
                rawSummary: preparedSource.message,
            };
        }

        checks.push(
            makeCheck({
                code: "source_prepare",
                label: "Chuẩn bị source bài nộp",
                status: "passed",
                message: preparedSource.message,
            })
        );

        const projectRoot = await findAndroidProjectRoot(preparedSource.sourceRoot);

        if (!projectRoot) {
            return {
                runtimeStatus: "project_invalid",
                buildPassed: false,
                testPassed: false,
                checks: [
                    makeCheck({
                        code: "android_project_root",
                        label: "Project Android hợp lệ",
                        status: "failed",
                        message: "Không tìm thấy settings.gradle hoặc settings.gradle.kts. Có thể sinh viên nén sai thư mục.",
                    }),
                ],
                rawSummary: "Bài không phải project Android Studio hợp lệ hoặc nén sai cấp thư mục.",
            };
        }

        checks.push(
            makeCheck({
                code: "android_project_root",
                label: "Project Android hợp lệ",
                status: "passed",
                message: "Tìm thấy project Android Studio.",
                evidence: [projectRoot],
            })
        );

        const wrapper = await ensureGradleWrapper(projectRoot);

        if (!wrapper.ok) {
            checks.push(
                makeCheck({
                    code: "gradle_wrapper",
                    label: "Gradle Wrapper",
                    status: "failed",
                    message: wrapper.message,
                })
            );

            logs.push({
                label: "Gradle wrapper log",
                content: wrapper.message,
            });

            return {
                runtimeStatus: "build_failed",
                buildPassed: false,
                testPassed: false,
                visualSimilarity: null,
                checks,
                logs,
                rawSummary: "Bài không chạy được vì thiếu Gradle Wrapper và máy runner chưa tự sinh được wrapper.",
            };
        }

        checks.push(
            makeCheck({
                code: "gradle_wrapper",
                label: "Gradle Wrapper",
                status: "passed",
                message: wrapper.message,
            })
        );

        const build = await runTextLive(
            wrapper.cmd,
            [
                ...wrapper.argsPrefix,
                ":app:assembleDebug",
                "--no-daemon",
                "--stacktrace",
                "--console=plain",
                "--info",
            ],
            projectRoot,
            900_000
        );

        const fullBuildLog = `${build.stdout}\n${build.stderr}`;

        const importantLines = fullBuildLog
            .split(/\r?\n/)
            .filter((line) => {
                const lower = line.toLowerCase();

                return (
                    line.startsWith("e:") ||
                    line.startsWith("w:") ||
                    lower.includes("error:") ||
                    lower.includes("unresolved reference") ||
                    lower.includes("type mismatch") ||
                    lower.includes("compilation error") ||
                    lower.includes("failed") ||
                    lower.includes("exception")
                );
            })
            .join("\n");

        logs.push({
            label: "Gradle build log",
            content:
                importantLines.trim().length > 0
                    ? importantLines
                    : fullBuildLog.length > 30000
                        ? fullBuildLog.slice(0, 12000) +
                        "\n\n... LOG ĐÃ BỊ RÚT GỌN Ở GIỮA ...\n\n" +
                        fullBuildLog.slice(-12000)
                        : fullBuildLog,
        });
        if (!build.ok) {
            checks.push(
                makeCheck({
                    code: "gradle_build",
                    label: "Build APK bằng Gradle",
                    status: "failed",
                    message: "Bài không build được. Giáo viên xem Gradle build log để biết lỗi.",
                })
            );

            return {
                runtimeStatus: "build_failed",
                buildPassed: false,
                testPassed: false,
                checks,
                logs,
                rawSummary: "Bài không chạy được vì lỗi build Gradle.",
            };
        }

        checks.push(
            makeCheck({
                code: "gradle_build",
                label: "Build APK bằng Gradle",
                status: "passed",
                message: "Build APK thành công.",
            })
        );

        const apkPath = await findDebugApk(projectRoot);

        if (!apkPath) {
            return {
                runtimeStatus: "apk_missing",
                buildPassed: false,
                testPassed: false,
                checks: [
                    ...checks,
                    makeCheck({
                        code: "debug_apk",
                        label: "File APK debug",
                        status: "failed",
                        message: "Build xong nhưng không tìm thấy file APK debug.",
                    }),
                ],
                logs,
                rawSummary: "Không tìm thấy APK sau khi build.",
            };
        }

        const packageName = await readPackageName(projectRoot);

        if (!packageName) {
            return {
                runtimeStatus: "launch_failed",
                buildPassed: true,
                testPassed: false,
                apkPath,
                checks: [
                    ...checks,
                    makeCheck({
                        code: "package_name",
                        label: "Package name",
                        status: "failed",
                        message: "Không đọc được applicationId/packageName nên không mở được app.",
                    }),
                ],
                logs,
                rawSummary: "Build được APK nhưng không xác định được package name.",
            };
        }

        // Chỉ bật emulator sau khi build APK thành công để tránh máy yếu bị treo.
        const adbCmd = resolveAdbCommand();
        const adbBase = input.adbSerial ? ["-s", input.adbSerial] : [];

        const emulatorReady = await startEmulatorIfNeeded({
            adbCmd,
            adbSerial: input.adbSerial,
            avdName: DEFAULT_AVD_NAME,
        });

        logs.push({
            label: "Emulator startup log",
            content:
                emulatorReady.message +
                "\n\nstdout:\n" +
                emulatorReady.stdout +
                "\n\nstderr:\n" +
                emulatorReady.stderr,
        });

        if (!emulatorReady.ok) {
            return {
                runtimeStatus: "install_failed",
                buildPassed: true,
                testPassed: false,
                apkPath,
                packageName,
                checks: [
                    ...checks,
                    makeCheck({
                        code: "emulator_start",
                        label: "Tự bật emulator",
                        status: "failed",
                        message: emulatorReady.message,
                    }),
                ],
                logs,
                rawSummary: "Build APK thành công nhưng hệ thống không tự bật được emulator.",
            };
        }

        checks.push(
            makeCheck({
                code: "emulator_start",
                label: "Tự bật emulator",
                status: "passed",
                message: emulatorReady.message,
            })
        );

        const devices = await runText(adbCmd, ["devices"], undefined, 30_000);

        logs.push({
            label: "ADB devices",
            content: `${devices.stdout}\n${devices.stderr}`,
        });

        if (!devices.ok) {
            return {
                runtimeStatus: "install_failed",
                buildPassed: true,
                testPassed: false,
                apkPath,
                packageName,
                checks: [
                    ...checks,
                    makeCheck({
                        code: "adb_command",
                        label: "ADB command",
                        status: "failed",
                        message: "Build APK thành công nhưng máy runner không tìm thấy adb. Cần cài Android SDK Platform-Tools hoặc cấu hình ADB_PATH.",
                    }),
                ],
                logs,
                rawSummary: "Build APK thành công nhưng chưa chạy được vì không tìm thấy adb.",
            };
        }

        const deviceLines = devices.stdout
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("List of devices"));

        const hasReadyDevice = deviceLines.some((line) => /\bdevice$/.test(line));

        if (!hasReadyDevice) {
            return {
                runtimeStatus: "install_failed",
                buildPassed: true,
                testPassed: false,
                apkPath,
                packageName,
                checks: [
                    ...checks,
                    makeCheck({
                        code: "adb_device",
                        label: "Emulator/device",
                        status: "failed",
                        message: "Build APK thành công nhưng chưa có emulator/device Android đang chạy.",
                    }),
                ],
                logs,
                rawSummary: "Build APK thành công nhưng chưa có emulator/device để cài app.",
            };
        }

        checks.push(
            makeCheck({
                code: "adb_device",
                label: "Emulator/device",
                status: "passed",
                message: "ADB thấy emulator/device đang chạy.",
            })
        );

        const install = await runTextLive(
            adbCmd,
            [...adbBase, "install", "-r", apkPath],
            undefined,
            180_000
        );

        logs.push({
            label: "ADB install log",
            content: compactLog(install.stdout, install.stderr, 12000),
        });

        if (!install.ok) {
            return {
                runtimeStatus: "install_failed",
                buildPassed: true,
                testPassed: false,
                apkPath,
                packageName,
                checks: [
                    ...checks,
                    makeCheck({
                        code: "adb_install",
                        label: "Cài APK vào emulator",
                        status: "failed",
                        message: "APK build được nhưng không cài được vào emulator.",
                    }),
                ],
                logs,
                rawSummary: "APK không cài được vào emulator.",
            };
        }

        checks.push(
            makeCheck({
                code: "adb_install",
                label: "Cài APK vào emulator",
                status: "passed",
                message: "Cài APK thành công.",
            })
        );
        await runText(
            adbCmd,
            [...adbBase, "shell", "pm", "clear", packageName],
            undefined,
            30_000
        );

        await runText(
            adbCmd,
            [...adbBase, "shell", "settings", "put", "global", "window_animation_scale", "0"],
            undefined,
            30_000
        );

        await runText(
            adbCmd,
            [...adbBase, "shell", "settings", "put", "global", "transition_animation_scale", "0"],
            undefined,
            30_000
        );

        await runText(
            adbCmd,
            [...adbBase, "shell", "settings", "put", "global", "animator_duration_scale", "0"],
            undefined,
            30_000
        );
        await runText(
            adbCmd,
            [...adbBase, "shell", "pm", "clear", packageName],
            undefined,
            30_000
        );

        await runText(
            adbCmd,
            [...adbBase, "shell", "settings", "put", "global", "window_animation_scale", "0"],
            undefined,
            30_000
        );

        await runText(
            adbCmd,
            [...adbBase, "shell", "settings", "put", "global", "transition_animation_scale", "0"],
            undefined,
            30_000
        );

        await runText(
            adbCmd,
            [...adbBase, "shell", "settings", "put", "global", "animator_duration_scale", "0"],
            undefined,
            30_000
        );

        const launch = await launchAppAndVerify({
            adbCmd,
            adbBase,
            packageName,
        });

        logs.push({
            label: "ADB launch log",
            content: compactLog(launch.log, "", 12000),
        });

        if (!launch.ok) {
            return {
                runtimeStatus: "launch_failed",
                buildPassed: true,
                testPassed: false,
                apkPath,
                packageName,
                checks: [
                    ...checks,
                    makeCheck({
                        code: "app_launch",
                        label: "Mở app",
                        status: "failed",
                        message: launch.message,
                    }),
                ],
                logs,
                rawSummary: launch.message,
            };
        }

        checks.push(
            makeCheck({
                code: "app_launch",
                label: "Mở app",
                status: "passed",
                message: "Mở app thành công.",
            })
        );

        const runnerConfig = input.assignmentRunnerConfig || {};
        const uiActions = Array.isArray(runnerConfig.uiActions)
            ? runnerConfig.uiActions
            : [];

        const uiScreens = Array.isArray(runnerConfig.uiScreens)
            ? runnerConfig.uiScreens
            : [];

        const finalActions: UiTestAction[] =
            uiActions.length > 0
                ? uiActions
                : [
                    {
                        type: "wait",
                        ms: 8000,
                    },
                    {
                        type: "screenshot",
                        screenKey: "ui-01-home",
                    },
                ];

        const scenario = await runUiScenario({
            adbCmd,
            adbBase,
            outputDir,
            packageName,
            actions: finalActions,
        });

        logs.push(...scenario.logs);

        if (!scenario.ok) {
            return {
                runtimeStatus: "screenshot_failed",
                buildPassed: true,
                testPassed: false,
                apkPath,
                packageName,
                screenshots: scenario.screenshots,
                checks: [
                    ...checks,
                    makeCheck({
                        code: "ui_scenario",
                        label: "Chạy kịch bản UI bằng testTag",
                        status: "failed",
                        message: scenario.message,
                    }),
                ],
                logs,
                rawSummary: `App đã chạy được nhưng lỗi kịch bản UI/testTag: ${scenario.message}`,
            };
        }

        if (scenario.screenshots.length === 0) {
            return {
                runtimeStatus: "screenshot_failed",
                buildPassed: true,
                testPassed: false,
                apkPath,
                packageName,
                checks: [
                    ...checks,
                    makeCheck({
                        code: "screenshot",
                        label: "Chụp giao diện thật",
                        status: "failed",
                        message: "Kịch bản UI chạy xong nhưng không có bước screenshot nào.",
                    }),
                ],
                logs,
                rawSummary: "Không có screenshot nào được sinh ra từ kịch bản UI.",
            };
        }

        checks.push(
            makeCheck({
                code: "screenshot",
                label: "Chụp giao diện thật",
                status: "passed",
                message: `Đã chụp được ${scenario.screenshots.length} giao diện thật từ emulator.`,
                evidence: scenario.screenshots.map((shot) => shot.url),
            })
        );

        checks.push(
            makeCheck({
                code: "ui_scenario",
                label: "Chạy kịch bản UI bằng testTag",
                status: "passed",
                message: "Đã chạy xong kịch bản UI/testTag.",
                evidence: scenario.screenshots.map((shot) => shot.url),
            })
        );

        const visualResults: Array<{
            screenKey: string;
            label: string;
            similarity: number;
            diffPercent?: number | null;
            baselineUrl?: string;
            studentUrl?: string;
            diffUrl?: string;
            message?: string;
        }> = [];

        const artifacts: Array<{
            label: string;
            url: string;
            mimeType: string;
        }> = [];

        for (const shot of scenario.screenshots) {
            const screenConfig = uiScreens.find(
                (item) => item.screenKey === shot.screenKey
            );

            const baselineUrl = screenConfig?.baselineUrl || null;
            const threshold = Number(screenConfig?.threshold || 70);

            if (!baselineUrl) {
                checks.push(
                    makeCheck({
                        code: `visual_compare_${shot.screenKey}`,
                        label: `So sánh UI ${screenConfig?.label || shot.screenKey}`,
                        status: "not_run",
                        message: `Chưa có ảnh chuẩn baselineUrl cho ${shot.screenKey}.`,
                        evidence: [shot.url],
                    })
                );

                continue;
            }

            const comparison = await compareStudentScreenshotWithBaseline({
                studentScreenshotPath: shot.path,
                studentScreenshotUrl: shot.url,
                baselineUrl,
                outputDir,
            });

            if (!comparison) {
                checks.push(
                    makeCheck({
                        code: `visual_compare_${shot.screenKey}`,
                        label: `So sánh UI ${screenConfig?.label || shot.screenKey}`,
                        status: "not_run",
                        message: `Không so sánh được ${shot.screenKey}.`,
                        evidence: [baselineUrl, shot.url].filter(Boolean),
                    })
                );

                continue;
            }

            visualResults.push({
                screenKey: shot.screenKey,
                label: screenConfig?.label || shot.label,
                ...comparison,
            });

            if (comparison.diffUrl) {
                artifacts.push({
                    label: `Ảnh diff ${shot.screenKey}`,
                    url: comparison.diffUrl,
                    mimeType: "image/png",
                });
            }

            checks.push(
                makeCheck({
                    code: `visual_compare_${shot.screenKey}`,
                    label: `So sánh UI ${screenConfig?.label || shot.screenKey}`,
                    status: comparison.similarity >= threshold ? "passed" : "warning",
                    message: `Độ giống ${shot.screenKey}: ${comparison.similarity}%. Ngưỡng đạt: ${threshold}%.`,
                    evidence: [
                        comparison.baselineUrl || baselineUrl,
                        comparison.studentUrl || shot.url,
                        comparison.diffUrl || "",
                    ].filter(Boolean),
                })
            );
        }

        const avgSimilarity =
            visualResults.length > 0
                ? Math.round(
                (visualResults.reduce((sum, item) => sum + item.similarity, 0) /
                    visualResults.length) *
                100
            ) / 100
                : null;
        const firstVisualResult = visualResults[0] ?? null;

        const visualComparison =
            firstVisualResult
                ? {
                    similarity: Number(firstVisualResult.similarity ?? 0),
                    diffPercent: Number(firstVisualResult.diffPercent ?? 0),
                    baselineUrl: String(firstVisualResult.baselineUrl || ""),
                    studentUrl: String(firstVisualResult.studentUrl || ""),
                    diffUrl: String(firstVisualResult.diffUrl || ""),
                    message: String(firstVisualResult.message || ""),
                }
                : null;
        return {
            runtimeStatus: "passed",
            buildPassed: true,
            testPassed: true,
            apkPath,
            packageName,
            checks,
            logs,
            visualSimilarity: avgSimilarity,
            visualComparison,
            visualComparisons: visualResults,
            screenshots: scenario.screenshots.map((shot) => ({
                label: shot.label || shot.screenKey,
                path: shot.path,
                url: shot.url,
                mimeType: shot.mimeType,
            })),
            artifacts,
            rawSummary:
                avgSimilarity !== null
                    ? `Bài chạy được. Độ giống UI trung bình: ${avgSimilarity}%.`
                    : "Bài chạy được và đã sinh screenshot thật, nhưng chưa có đủ ảnh chuẩn UI để so sánh.",
        };
    } catch (error) {
        return {
            runtimeStatus: "not_run",
            buildPassed: false,
            testPassed: false,
            checks: [
                makeCheck({
                    code: "runtime_exception",
                    label: "Runtime runner exception",
                    status: "failed",
                    message: error instanceof Error ? error.message : "Lỗi runtime không xác định.",
                }),
            ],
            logs,
            rawSummary: error instanceof Error ? error.message : "Runtime runner exception.",
        };
    } finally {
        await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        console.timeEnd("[RUNTIME-TIME] total");
    }
}
