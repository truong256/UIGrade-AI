"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import UiScenarioEditor from "@/components/grading_detail/UiScenarioEditor";
import {
    DEFAULT_ANDROID_UI_RUNNER_CONFIG,
    EMPTY_RUNNER_CONFIG,
    type UiRunnerConfig,
} from "@/lib/ui-runner-config";
type Classroom = {
    _id: string;
    name: string;
    code: string;
    semester?: string;
    academicYear?: string;
};

type CurrentUser = {
    _id?: string;
    role?: "admin" | "teacher" | "User";
    name?: string;
};

type ApiResult<T> = {
    success: boolean;
    message?: string;
    data?: T;
    user?: T;
};

type FormState = {
    title: string;
    classroomId: string;
    language: string;
    description: string;
    rubricText: string;
    startAt: string;
    dueAt: string;
    allowLateSubmit: boolean;
    allowResubmit: boolean;
    latePenaltyPercent: string;
    maxScore: string;
};
type RubricCriterion = {
    code: string;
    title: string;
    description: string;
    maxPoints: number;
    gradingSource: "runner" | "ai" | "hybrid" | "manual";
    requiredEvidence: string[];
    passThreshold: number | null;
    notes: string;
};

const LANGUAGES = [
    { value: "kotlin", label: "kotlin" },
    { value: "java", label: "Java 17" },
    { value: "python", label: "Python 3.10" },
    { value: "javascript", label: "JavaScript (Node.js)" },
    { value: "typescript", label: "TypeScript" },
];

function toDateTimeLocal(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}`;
}

function FileListCard({
                          title,
                          files,
                          onChange,
                          multiple = true,
                      }: {
    title: string;
    files: File[];
    onChange: (files: File[]) => void;
    multiple?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-600">
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    Chọn file
                    <input
                        type="file"
                        multiple={multiple}
                        className="hidden"
                        onChange={(event) => {
                            const nextFiles = Array.from(event.target.files || []);
                            onChange(nextFiles);
                            event.currentTarget.value = "";
                        }}
                    />
                </label>
            </div>

            {files.length ? (
                <div className="space-y-3">
                    {files.map((file) => (
                        <div
                            key={`${file.name}-${file.size}`}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                        >
                            <div>
                                <p className="font-medium text-slate-800">{file.name}</p>
                                <p className="text-xs text-slate-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    Chưa có file nào được chọn.
                </div>
            )}
        </div>
    );
}

function slugifyCriterionCode(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "criterion";
}

function inferGradingSource(text: string): RubricCriterion["gradingSource"] {
    const normalized = text.toLowerCase();

    if (
        /(build|test|runner|required file|readme|cấu trúc|structure|gradle|manifest)/i.test(
            normalized
        )
    ) {
        return "hybrid";
    }

    return "ai";
}

function normalizeRubricCriterion(
    item: any,
    index: number
): RubricCriterion {
    const title = String(item?.title || item?.name || `Tiêu chí ${index + 1}`).trim();
    const description = String(item?.description || title).trim();
    const maxPoints = Number(item?.maxPoints || item?.points || 0);

    return {
        code: String(item?.code || slugifyCriterionCode(title)),
        title,
        description,
        maxPoints: Number.isFinite(maxPoints) && maxPoints > 0 ? maxPoints : 1,
        gradingSource:
            item?.gradingSource === "runner" ||
            item?.gradingSource === "ai" ||
            item?.gradingSource === "hybrid" ||
            item?.gradingSource === "manual"
                ? item.gradingSource
                : inferGradingSource(`${title} ${description}`),
        requiredEvidence: Array.isArray(item?.requiredEvidence)
            ? item.requiredEvidence.map(String)
            : [],
        passThreshold:
            item?.passThreshold === null || item?.passThreshold === undefined
                ? null
                : Number(item.passThreshold),
        notes: String(item?.notes || ""),
    };
}

function rebalanceRubricPoints(
    rubric: RubricCriterion[],
    expectedMaxScore: number
) {
    if (!rubric.length) return rubric;

    const total = rubric.reduce((sum, item) => sum + Number(item.maxPoints || 0), 0);
    if (!Number.isFinite(total) || total <= 0) return rubric;

    if (Math.abs(total - expectedMaxScore) < 0.001) {
        return rubric;
    }

    const factor = expectedMaxScore / total;
    const scaled = rubric.map((item) => ({
        ...item,
        maxPoints: Number((item.maxPoints * factor).toFixed(2)),
    }));

    const scaledTotal = scaled.reduce((sum, item) => sum + item.maxPoints, 0);
    const delta = Number((expectedMaxScore - scaledTotal).toFixed(2));
    scaled[scaled.length - 1].maxPoints = Number(
        (scaled[scaled.length - 1].maxPoints + delta).toFixed(2)
    );

    return scaled;
}

function parseRubricTextToCriteria(
    rubricText: string,
    maxScore: number
): RubricCriterion[] {
    const rawLines = rubricText
        .split(/\n|;/g)
        .map((line) => line.trim())
        .filter(Boolean);

    if (!rawLines.length) {
        return [
            {
                code: "overall",
                title: "Chấm tổng thể",
                description: "Chấm tổng thể theo yêu cầu bài tập, file đề bài và starter code.",
                maxPoints: maxScore,
                gradingSource: "ai",
                requiredEvidence: [],
                passThreshold: null,
                notes: "",
            },
        ];
    }

    const criteria = rawLines.map((line, index) => {
        const match = line.match(/(\d+(?:[.,]\d+)?)\s*(điểm|đ|pts|point|points)?/i);
        const parsedPoint = match ? Number(String(match[1]).replace(",", ".")) : null;

        const cleanedTitle = line
            .replace(/(\d+(?:[.,]\d+)?)\s*(điểm|đ|pts|point|points)?/i, "")
            .replace(/^[-:–•\s]+/, "")
            .replace(/[-:–•\s]+$/, "")
            .trim();

        const title = cleanedTitle || `Tiêu chí ${index + 1}`;

        return {
            code: slugifyCriterionCode(title),
            title,
            description: line,
            maxPoints: parsedPoint && parsedPoint > 0 ? parsedPoint : 1,
            gradingSource: inferGradingSource(line),
            requiredEvidence: [],
            passThreshold: null,
            notes: "",
        } satisfies RubricCriterion;
    });

    return rebalanceRubricPoints(criteria, maxScore);
}

async function requestRubricParse(params: {
    rubricText: string;
    maxScore: number;
    assignmentTitle: string;
    language: string;
}) {
    const res = await fetch("/api/rubric/parse", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
        throw new Error(json.message || "Không thể phân tích rubric");
    }

    return json.data as {
        rubric: RubricCriterion[];
        source: "gemini" | "heuristic";
        warnings: string[];
    };
}
async function buildRubricPayload(
    rubricText: string,
    rubricFiles: File[],
    maxScore: number,
    assignmentTitle: string,
    language: string
): Promise<{
    rubric: RubricCriterion[];
    source: string;
    warnings: string[];
}> {
    const jsonRubricFile = rubricFiles.find((file) =>
        file.name.toLowerCase().endsWith(".json")
    );

    if (jsonRubricFile) {
        try {
            const raw = JSON.parse(await jsonRubricFile.text());
            const items = Array.isArray(raw)
                ? raw
                : Array.isArray(raw?.criteria)
                    ? raw.criteria
                    : [];

            if (items.length) {
                const normalized = items.map((item: any, index: number) =>
                    normalizeRubricCriterion(item, index)
                );

                return {
                    rubric: rebalanceRubricPoints(normalized, maxScore),
                    source: "file_json",
                    warnings: [],
                };
            }
        } catch {
            // fallback xuống API parse
        }
    }

    try {
        return await requestRubricParse({
            rubricText,
            maxScore,
            assignmentTitle,
            language,
        });
    } catch {
        return {
            rubric: parseRubricTextToCriteria(rubricText, maxScore),
            source: "heuristic",
            warnings: ["API parse rubric lỗi, dùng parser fallback phía client."],
        };
    }
}
export default function CreateAssignmentPage() {
    const router = useRouter();
    const now = useMemo(() => new Date(), []);
    const defaultStartAt = useMemo(() => toDateTimeLocal(now), [now]);
    const defaultDueAt = useMemo(() => {
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);
        return toDateTimeLocal(nextWeek);
    }, [now]);

    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [classes, setClasses] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState<FormState>({
        title: "",
        classroomId: "",
        language: "kotlin",
        description: "",
        rubricText: "",
        startAt: defaultStartAt,
        dueAt: defaultDueAt,
        allowLateSubmit: false,
        allowResubmit: true,
        latePenaltyPercent: "0",
        maxScore: "10",
    });

    const [resourceFiles, setResourceFiles] = useState<File[]>([]);
    const [rubricFiles, setRubricFiles] = useState<File[]>([]);
    const [templateFiles, setTemplateFiles] = useState<File[]>([]);
    const [runnerConfig, setRunnerConfig] = useState<UiRunnerConfig>(
        DEFAULT_ANDROID_UI_RUNNER_CONFIG
    );

    // rubric
    const [rubricPreview, setRubricPreview] = useState<RubricCriterion[]>([]);
    const [rubricParseWarnings, setRubricParseWarnings] = useState<string[]>([]);
    const [rubricParseSource, setRubricParseSource] = useState<string>("");
    const [parsingRubric, setParsingRubric] = useState(false);

    const canManageAssignments =
        currentUser?.role === "teacher" || currentUser?.role === "admin";

    useEffect(() => {
        const bootstrap = async () => {
            try {
                setLoading(true);
                setError("");

                const [userRes, classesRes] = await Promise.all([
                    fetch("/api/auth/me", { cache: "no-store" }),
                    fetch("/api/classes", { cache: "no-store" }),
                ]);

                const userJson: ApiResult<CurrentUser> = await userRes.json();
                const classesJson: ApiResult<Classroom[]> = await classesRes.json();

                if (userRes.ok) {
                    setCurrentUser((userJson.user as CurrentUser) || null);
                }

                if (!classesRes.ok) {
                    throw new Error(classesJson.message || "Không tải được danh sách lớp học");
                }

                const items = classesJson.data || [];
                setClasses(items);
                if (items.length) {
                    setForm((prev) => ({
                        ...prev,
                        classroomId: prev.classroomId || items[0]._id,
                    }));
                }
            } catch (fetchError) {
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : "Không thể khởi tạo dữ liệu tạo bài tập"
                );
            } finally {
                setLoading(false);
            }
        };

        void bootstrap();
    }, []);

    const selectedClass = useMemo(
        () => classes.find((item) => item._id === form.classroomId) || null,
        [classes, form.classroomId]
    );
    const handleSubmit = async (status: "draft" | "published") => {
        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            const body = new FormData();
            const parsedMaxScore = Number(form.maxScore || "10");
            const effectiveMaxScore =
                Number.isFinite(parsedMaxScore) && parsedMaxScore > 0 ? parsedMaxScore : 10;

            const rubricResult = await buildRubricPayload(
                form.rubricText,
                rubricFiles,
                effectiveMaxScore,
                form.title || "Bài tập",
                "vi"
            );

            const rubric = rubricResult.rubric;
            setRubricPreview(rubricResult.rubric);
            setRubricParseWarnings(rubricResult.warnings);
            setRubricParseSource(rubricResult.source);

            const submissionPolicy = {
                acceptedFileTypes: ["zip"],
                maxFileSizeMb: 256,
                maxAttempts: form.allowResubmit ? 999999 : 1,
                requireZip: true,
                allowGithubUrl: true,
                allowScreenshots: true,
            };

            const normalizedLanguage = (form.language || "kotlin").trim().toLowerCase();
            const isAndroidKotlin = normalizedLanguage === "kotlin";

            const runnerConfigPayload = isAndroidKotlin
                ? {
                    ...runnerConfig,
                    requiredFiles: [
                        "settings.gradle.kts",
                        "app/build.gradle.kts",
                        "AndroidManifest.xml",
                    ],
                    entryFiles: ["app/src/main/java", "app/src/main/kotlin"],
                    buildCommand: "./gradlew assembleDebug",
                    runCommand: "",
                    deviceProfiles: ["small-phone"],
                    screenshotTargets: runnerConfig.uiScreens.map((item) => item.screenKey),
                }
                : EMPTY_RUNNER_CONFIG;

            const aiConfig = {
                enabled: true,
                model: "gemini-2.5-flash",
                temperature: 0.2,
                feedbackLanguage: "vi",
            };

            body.set("title", form.title);
            body.set("classroomId", form.classroomId);
            body.set("language", form.language.trim() || "kotlin");
            body.set("description", form.description);
            body.set("rubricText", form.rubricText);
            body.set("rubric", JSON.stringify(rubric));
            body.set("submissionPolicy", JSON.stringify(submissionPolicy));
            body.set("runnerConfig", JSON.stringify(runnerConfigPayload));
            body.set("aiConfig", JSON.stringify(aiConfig));
            body.set("startAt", new Date(form.startAt).toISOString());
            body.set("dueAt", new Date(form.dueAt).toISOString());
            body.set("allowLateSubmit", String(form.allowLateSubmit));
            body.set("allowResubmit", String(form.allowResubmit));
            body.set("latePenaltyPercent", form.latePenaltyPercent || "0");
            body.set("maxScore", String(effectiveMaxScore));
            body.set("status", status);

            for (const file of resourceFiles) {
                body.append("resourceFiles", file);
            }

            for (const file of rubricFiles) {
                body.append("rubricFiles", file);
            }

            for (const file of templateFiles) {
                body.append("templateFiles", file);
            }

            const res = await fetch("/api/assignments", {
                method: "POST",
                body,
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || "Tạo bài tập thất bại");
            }

            setSuccess(
                status === "draft"
                    ? "Đã lưu bài tập ở trạng thái bản nháp."
                    : "Đã tạo và công bố bài tập thành công."
            );

            setTimeout(() => {
                router.push("/ui/assignment_list");
                router.refresh();
            }, 1200);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Không thể tạo bài tập"
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
                Đang tải dữ liệu tạo bài tập...
            </div>
        );
    }

    if (!canManageAssignments) {
        return (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-700 shadow-sm">
                Bạn cần đăng nhập bằng tài khoản giảng viên hoặc quản trị để tạo bài tập.
            </div>
        );
    }
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        Tạo bài tập
                    </h1>
                    <p className="mt-1 text-slate-500">
                        Tạo bài tập theo từng lớp, cấu hình deadline, rubric, file đính kèm và
                        quyền nộp lại.
                    </p>
                </div>

                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                    <span className="font-semibold text-slate-900">Lớp đang chọn:</span>{" "}
                    {selectedClass
                        ? `${selectedClass.name} (${selectedClass.code})`
                        : "Chưa chọn lớp"}
                </div>
            </div>

            {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            ) : null}

            {success ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                <div className="space-y-6">
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 text-lg font-bold text-slate-900">Thông tin cơ bản</h2>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Tên bài tập
                                </label>
                                <input
                                    value={form.title}
                                    onChange={(event) =>
                                        setForm((prev) => ({ ...prev, title: event.target.value }))
                                    }
                                    placeholder="Ví dụ: Lab 03 - Quản lý danh bạ"
                                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Lớp học
                                </label>
                                <select
                                    value={form.classroomId}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            classroomId: event.target.value,
                                        }))
                                    }
                                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                                >
                                    {classes.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.name} ({item.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Ngôn ngữ chấm
                                </label>
                                <select
                                    value={form.language}
                                    onChange={(event) =>
                                        setForm((prev) => ({ ...prev, language: event.target.value }))
                                    }
                                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                                >
                                    {LANGUAGES.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Mô tả đề bài
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            description: event.target.value,
                                        }))
                                    }
                                    placeholder="Mô tả yêu cầu, cấu trúc project, đầu vào đầu ra, quy ước đặt tên file..."
                                    className="min-h-[180px] w-full rounded-2xl border border-slate-200 p-4 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Rubric / thang điểm mô tả
                                </label>
                                <textarea
                                    value={form.rubricText}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            rubricText: event.target.value,
                                        }))
                                    }
                                    placeholder="Ví dụ: giao diện 2 điểm, xử lý dữ liệu 4 điểm, validation 2 điểm, clean code 2 điểm..."
                                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 p-4 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                                />
                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                setParsingRubric(true);
                                                setError("");

                                                const parsedMaxScore = Number(form.maxScore || "10");
                                                const effectiveMaxScore =
                                                    Number.isFinite(parsedMaxScore) && parsedMaxScore > 0 ? parsedMaxScore : 10;

                                                const result = await buildRubricPayload(
                                                    form.rubricText,
                                                    rubricFiles,
                                                    effectiveMaxScore,
                                                    form.title || "Bài tập",
                                                    "vi"
                                                );

                                                setRubricPreview(result.rubric);
                                                setRubricParseWarnings(result.warnings);
                                                setRubricParseSource(result.source);
                                            } catch (error) {
                                                setError(
                                                    error instanceof Error
                                                        ? error.message
                                                        : "Không thể phân tích rubric"
                                                );
                                            } finally {
                                                setParsingRubric(false);
                                            }
                                        }}
                                        className="inline-flex items-center rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                                        disabled={parsingRubric || !form.rubricText.trim()}
                                    >
                                        {parsingRubric ? "Đang phân tích..." : "Phân tích rubric bằng AI"}
                                    </button>

                                    {rubricParseSource ? (
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                            Nguồn: {rubricParseSource}
                                        </span>
                                    ) : null}
                                </div>
                                {rubricPreview.length ? (
                                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <p className="font-semibold text-slate-900">Rubric đã chuẩn hóa</p>
                                            <p className="text-sm text-slate-500">
                                                Tổng: {rubricPreview.reduce((sum, item) => sum + Number(item.maxPoints || 0), 0)}
                                            </p>
                                        </div>

                                        {rubricParseWarnings.length ? (
                                            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                                                {rubricParseWarnings.join(" • ")}
                                            </div>
                                        ) : null}

                                        <div className="space-y-3">
                                            {rubricPreview.map((item) => (
                                                <div
                                                    key={item.code}
                                                    className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-semibold text-slate-900">{item.title}</p>
                                                            <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                                                            <p className="mt-2 text-xs text-slate-400">
                                                                code: {item.code} • source: {item.gradingSource}
                                                            </p>
                                                        </div>
                                                        <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-600">
                                                            {item.maxPoints}đ
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </section>

                    {form.language.trim().toLowerCase() === "kotlin" && (
                        <UiScenarioEditor
                            value={runnerConfig}
                            onChange={setRunnerConfig}
                        />
                    )}

                    <FileListCard
                        title="File đính kèm đề bài"
                        files={resourceFiles}
                        onChange={setResourceFiles}
                    />

                    <FileListCard
                        title="File rubric / thang điểm"
                        files={rubricFiles}
                        onChange={setRubricFiles}
                    />

                    <FileListCard
                        title="Template / test case / starter code"
                        files={templateFiles}
                        onChange={setTemplateFiles}
                    />
                </div>

                <div className="space-y-6">
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 text-lg font-bold text-slate-900">Thiết lập nộp bài</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Ngày bắt đầu
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.startAt}
                                    onChange={(event) =>
                                        setForm((prev) => ({ ...prev, startAt: event.target.value }))
                                    }
                                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Hạn nộp
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.dueAt}
                                    onChange={(event) =>
                                        setForm((prev) => ({ ...prev, dueAt: event.target.value }))
                                    }
                                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Tổng điểm tối đa
                                </label>
                                <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={form.maxScore}
                                    onChange={(event) =>
                                        setForm((prev) => ({ ...prev, maxScore: event.target.value }))
                                    }
                                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Phạt nộp trễ (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={form.latePenaltyPercent}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            latePenaltyPercent: event.target.value,
                                        }))
                                    }
                                    disabled={!form.allowLateSubmit}
                                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-slate-100"
                                />
                            </div>

                            <label className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={form.allowLateSubmit}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            allowLateSubmit: event.target.checked,
                                        }))
                                    }
                                    className="mt-1"
                                />
                                <span>
                                    <span className="block font-semibold text-slate-900">
                                        Cho phép nộp trễ
                                    </span>
                                    Sinh viên vẫn có thể nộp sau deadline và hệ thống tự gắn trạng thái
                                    nộp trễ.
                                </span>
                            </label>

                            <label className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={form.allowResubmit}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            allowResubmit: event.target.checked,
                                        }))
                                    }
                                    className="mt-1"
                                />
                                <span>
                                    <span className="block font-semibold text-slate-900">
                                        Cho phép nộp lại
                                    </span>
                                    Khi bật, sinh viên có thể upload phiên bản mới nếu đã nộp trước đó.
                                </span>
                            </label>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-slate-900">Tóm tắt</h2>

                        <div className="space-y-3 text-sm text-slate-600">
                            <div className="flex items-center justify-between gap-3">
                                <span>Tên bài tập</span>
                                <span className="font-medium text-slate-900">
                                    {form.title || "Chưa nhập"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span>Số file đính kèm</span>
                                <span className="font-medium text-slate-900">
                                    {resourceFiles.length + rubricFiles.length + templateFiles.length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span>Nộp lại</span>
                                <span className="font-medium text-slate-900">
                                    {form.allowResubmit ? "Cho phép" : "Không"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span>Nộp trễ</span>
                                <span className="font-medium text-slate-900">
                                    {form.allowLateSubmit ? "Cho phép" : "Không"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => void handleSubmit("published")}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-semibold text-white shadow-lg shadow-orange-100 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <span className="material-symbols-outlined text-[18px]">send</span>
                                {submitting ? "Đang xử lý..." : "Tạo và công bố bài tập"}
                            </button>

                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => void handleSubmit("draft")}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <span className="material-symbols-outlined text-[18px]">draft</span>
                                Lưu nháp
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}