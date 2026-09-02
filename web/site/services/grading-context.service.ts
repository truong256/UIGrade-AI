import fs from "fs/promises";
import path from "path";
import AdmZip from "adm-zip";

type FileMeta = {
    kind?: string;
    originalName?: string;
    storedName?: string;
    url?: string;
    mimeType?: string;
    size?: number;
};

type RubricCriterion = {
    code?: string;
    title?: string;
    description?: string;
    maxPoints?: number;
    gradingSource?: string;
    requiredEvidence?: string[];
};

type AssignmentLike = {
    title?: string;
    description?: string;
    rubricText?: string;
    rubric?: RubricCriterion[];
    attachments?: FileMeta[];
};

type SubmissionLike = {
    assignmentSnapshot?: AssignmentLike | null;
    assignmentId?: AssignmentLike | string | null;
    note?: string;
    repositoryUrl?: string;
    sourceArchive?: FileMeta | null;
    screenshots?: FileMeta[];
};

type ZipEntryLike = {
    entryName: string;
    isDirectory: boolean;
};

export type GeminiInlinePart = {
    inlineData: {
        mimeType: string;
        data: string;
    };
};

export type GradingContextResult = {
    text: string;
    multimodalParts: GeminiInlinePart[];
};

const MAX_TEXT_FILE_CHARS = 4000;
const MAX_SECTION_CHARS = 22000;
const MAX_IMAGE_PARTS = 4;
const MAX_TREE_LINES = 220;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function uniq(items: string[]) {
    return [...new Set(items.filter(Boolean))];
}

function lower(value: string) {
    return String(value || "").trim().toLowerCase();
}

function guessMimeType(fileName: string) {
    const ext = lower(path.extname(fileName));
    if (ext === ".png") return "image/png";
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
    if (ext === ".webp") return "image/webp";
    if (ext === ".gif") return "image/gif";
    if (ext === ".pdf") return "application/pdf";
    if (ext === ".json") return "application/json";
    if (ext === ".md") return "text/markdown";
    if (ext === ".txt") return "text/plain";
    return "application/octet-stream";
}

function resolveUploadPath(file: FileMeta | null | undefined) {
    const url = String(file?.url || "");
    if (!url.startsWith("/uploads/")) return null;
    return path.join(process.cwd(), "public", url.replace(/^\//, ""));
}

function isTextLike(fileName: string, mimeType?: string) {
    const ext = lower(path.extname(fileName));
    if (String(mimeType || "").startsWith("text/")) return true;

    return [
        ".txt",
        ".md",
        ".json",
        ".kt",
        ".kts",
        ".java",
        ".xml",
        ".gradle",
        ".properties",
        ".yml",
        ".yaml",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".css",
        ".html",
        ".csv",
    ].includes(ext);
}

function isInlineVisionAsset(fileName: string, mimeType?: string) {
    const mime = String(mimeType || "");
    const ext = lower(path.extname(fileName));
    return (
        mime.startsWith("image/") ||
        mime === "application/pdf" ||
        [".png", ".jpg", ".jpeg", ".webp", ".gif", ".pdf"].includes(ext)
    );
}

function isZipLike(fileName: string, mimeType?: string) {
    const mime = String(mimeType || "");
    const ext = lower(path.extname(fileName));
    return ext === ".zip" || mime.includes("zip");
}

async function readTextFile(filePath: string, limit = MAX_TEXT_FILE_CHARS) {
    const raw = await fs.readFile(filePath, "utf8");
    return raw.length > limit ? `${raw.slice(0, limit)}\n...[truncated]` : raw;
}

async function toInlinePart(filePath: string, fileName: string, mimeType?: string) {
    const buffer = await fs.readFile(filePath);
    const actualMime =
        mimeType && mimeType !== "application/octet-stream"
            ? mimeType
            : guessMimeType(fileName);

    return {
        inlineData: {
            mimeType: actualMime,
            data: buffer.toString("base64"),
        },
    } satisfies GeminiInlinePart;
}

function scoreZipEntry(entryName: string, requiredEvidence: string[]) {
    const normalized = lower(entryName);
    let score = 0;

    if (/^readme/i.test(path.basename(entryName))) score += 120;

    if (requiredEvidence.some((item) => normalized.includes(lower(path.basename(item))))) {
        score += 100;
    }

    if (normalized.includes("app/src/main")) score += 50;
    if (normalized.includes("src/main")) score += 30;

    if (
        /mainactivity|screen|viewmodel|manifest|build\.gradle|settings\.gradle|gradle\.properties/.test(
            normalized
        )
    ) {
        score += 30;
    }

    if (/\.(kt|kts|java|xml|md|json|gradle|properties|txt)$/i.test(normalized)) {
        score += 20;
    }

    if (/build\/|\.gradle\/|\.idea\/|node_modules\/|dist\/|out\//.test(normalized)) {
        score -= 80;
    }

    return score;
}

function summarizeZip(zipPath: string, label: string, requiredEvidence: string[]) {
    try {
        const zip = new AdmZip(zipPath);

        const rawEntries = zip.getEntries() as ZipEntryLike[];

        const entries: string[] = rawEntries
            .filter((entry: ZipEntryLike) => !entry.isDirectory)
            .map((entry: ZipEntryLike) => String(entry.entryName));

        const interesting: string[] = entries
            .filter((entry: string) =>
                /\.(md|txt|json|kt|kts|java|xml|gradle|properties)$/i.test(entry)
            )
            .sort(
                (a: string, b: string) =>
                    scoreZipEntry(b, requiredEvidence) - scoreZipEntry(a, requiredEvidence)
            )
            .slice(0, 12);

        const extractedFiles: string[] = [];

        for (const entryName of interesting) {
            try {
                const buffer = zip.readFile(entryName);
                if (!buffer) continue;

                const content = buffer.toString("utf8");

                extractedFiles.push(
                    `FILE: ${entryName}\n${
                        content.length > MAX_TEXT_FILE_CHARS
                            ? `${content.slice(0, MAX_TEXT_FILE_CHARS)}\n...[truncated]`
                            : content
                    }`
                );
            } catch {
                // bỏ qua file lỗi encoding
            }
        }

        return {
            entries,
            treeText: `ZIP TREE (${label}):\n${entries.slice(0, MAX_TREE_LINES).join("\n")}`,
            extractedFilesText: extractedFiles
                .join("\n\n-----\n\n")
                .slice(0, MAX_SECTION_CHARS),
        };
    } catch {
        return {
            entries: [] as string[],
            treeText: `ZIP TREE (${label}): không đọc được`,
            extractedFilesText: "",
        };
    }
}

async function summarizeAttachments(
    label: string,
    files: FileMeta[],
    requiredEvidence: string[]
) {
    const textParts: string[] = [];
    const imageParts: GeminiInlinePart[] = [];
    const zipEntries: string[] = [];

    for (const file of files) {
        const fileName = String(file.originalName || file.storedName || "file");
        const mimeType = String(file.mimeType || guessMimeType(fileName));
        const filePath = resolveUploadPath(file);

        if (!filePath) continue;

        try {
            if (isZipLike(fileName, mimeType)) {
                const zipSummary = summarizeZip(
                    filePath,
                    `${label} - ${fileName}`,
                    requiredEvidence
                );

                textParts.push(zipSummary.treeText);

                if (zipSummary.extractedFilesText) {
                    textParts.push(`ZIP EXTRACT (${fileName}):\n${zipSummary.extractedFilesText}`);
                }

                zipEntries.push(...zipSummary.entries);
                continue;
            }

            if (isTextLike(fileName, mimeType)) {
                const content = await readTextFile(filePath);
                textParts.push(`${label.toUpperCase()} FILE: ${fileName}\n${content}`);
                continue;
            }

            if (isInlineVisionAsset(fileName, mimeType) && imageParts.length < MAX_IMAGE_PARTS) {
                imageParts.push(await toInlinePart(filePath, fileName, mimeType));
                textParts.push(`${label.toUpperCase()} BINARY ASSET: ${fileName}`);
            }
        } catch {
            textParts.push(`${label.toUpperCase()} FILE: ${fileName}\nKhông đọc được nội dung.`);
        }
    }

    return {
        text: textParts.join("\n\n").slice(0, MAX_SECTION_CHARS),
        imageParts,
        zipEntries: uniq(zipEntries),
    };
}

function collectRequiredEvidence(rubric: RubricCriterion[]) {
    return uniq(
        rubric.flatMap((item) =>
            Array.isArray(item.requiredEvidence)
                ? item.requiredEvidence.map((x) => String(x))
                : []
        )
    );
}

function buildMissingEvidence(requiredEvidence: string[], submissionEntries: string[]) {
    if (!requiredEvidence.length || !submissionEntries.length) return [];

    return requiredEvidence.filter((expected) => {
        const target = lower(path.basename(expected));
        return !submissionEntries.some((entry) => lower(entry).includes(target));
    });
}

function toAssignmentLike(value: unknown): AssignmentLike {
    if (!isRecord(value)) {
        return {};
    }

    return {
        title: typeof value.title === "string" ? value.title : undefined,
        description: typeof value.description === "string" ? value.description : undefined,
        rubricText: typeof value.rubricText === "string" ? value.rubricText : undefined,
        rubric: Array.isArray(value.rubric) ? (value.rubric as RubricCriterion[]) : [],
        attachments: Array.isArray(value.attachments) ? (value.attachments as FileMeta[]) : [],
    };
}

function toSubmissionLike(value: unknown): SubmissionLike {
    if (!isRecord(value)) {
        return {};
    }

    return {
        assignmentSnapshot: toAssignmentLike(value.assignmentSnapshot),
        assignmentId: isRecord(value.assignmentId) ? toAssignmentLike(value.assignmentId) : null,
        note: typeof value.note === "string" ? value.note : "",
        repositoryUrl: typeof value.repositoryUrl === "string" ? value.repositoryUrl : "",
        sourceArchive: isRecord(value.sourceArchive)
            ? (value.sourceArchive as FileMeta)
            : null,
        screenshots: Array.isArray(value.screenshots)
            ? (value.screenshots as FileMeta[])
            : [],
    };
}

export async function buildGradingContext(
    rawSubmission: unknown
): Promise<GradingContextResult> {
    const submission = toSubmissionLike(rawSubmission);

    const snapshot = submission.assignmentSnapshot || {};
    const liveAssignment = toAssignmentLike(submission.assignmentId);

    const rubric: RubricCriterion[] =
        Array.isArray(snapshot.rubric) && snapshot.rubric.length > 0
            ? snapshot.rubric
            : Array.isArray(liveAssignment.rubric)
                ? liveAssignment.rubric
                : [];

    const requiredEvidence = collectRequiredEvidence(rubric);

    const attachments: FileMeta[] =
        Array.isArray(snapshot.attachments) && snapshot.attachments.length > 0
            ? snapshot.attachments
            : Array.isArray(liveAssignment.attachments)
                ? liveAssignment.attachments
                : [];

    const resourceFiles = attachments.filter((item) => item.kind === "resource");
    const rubricFiles = attachments.filter((item) => item.kind === "rubric");
    const templateFiles = attachments.filter((item) => item.kind === "template");

    const [resourceSummary, rubricSummary, templateSummary] = await Promise.all([
        summarizeAttachments("teacher_resource", resourceFiles, requiredEvidence),
        summarizeAttachments("teacher_rubric", rubricFiles, requiredEvidence),
        summarizeAttachments("teacher_template", templateFiles, requiredEvidence),
    ]);

    const submissionArchiveSummary = submission.sourceArchive
        ? await summarizeAttachments(
            "student_submission",
            [submission.sourceArchive],
            requiredEvidence
        )
        : { text: "", imageParts: [] as GeminiInlinePart[], zipEntries: [] as string[] };

    const screenshotSummary =
        Array.isArray(submission.screenshots) && submission.screenshots.length > 0
            ? await summarizeAttachments(
                "student_screenshot",
                submission.screenshots,
                requiredEvidence
            )
            : { text: "", imageParts: [] as GeminiInlinePart[], zipEntries: [] as string[] };

    const missingEvidence = buildMissingEvidence(
        requiredEvidence,
        submissionArchiveSummary.zipEntries
    );

    const text = [
        `ASSIGNMENT TITLE:\n${snapshot.title || liveAssignment.title || "Bài tập"}`,
        `ASSIGNMENT DESCRIPTION:\n${snapshot.description || liveAssignment.description || ""}`,
        `RUBRIC TEXT:\n${snapshot.rubricText || liveAssignment.rubricText || ""}`,
        `STRUCTURED RUBRIC JSON:\n${JSON.stringify(rubric, null, 2)}`,
        `STUDENT NOTE:\n${submission.note || ""}`,
        `STUDENT REPOSITORY:\n${submission.repositoryUrl || ""}`,
        resourceSummary.text,
        rubricSummary.text,
        templateSummary.text,
        submissionArchiveSummary.text,
        screenshotSummary.text,
        missingEvidence.length
            ? `MISSING REQUIRED EVIDENCE (heuristic):\n${missingEvidence.join("\n")}`
            : "MISSING REQUIRED EVIDENCE (heuristic): không phát hiện thiếu rõ ràng từ tên file.",
    ]
        .filter(Boolean)
        .join("\n\n==========\n\n");

    const multimodalParts = [
        ...resourceSummary.imageParts,
        ...rubricSummary.imageParts,
        ...templateSummary.imageParts,
        ...screenshotSummary.imageParts,
    ].slice(0, MAX_IMAGE_PARTS);

    return {
        text,
        multimodalParts,
    };
}