import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AnyObj, AssignmentDetail, AssignmentOption, GradingTab, SidebarStudent } from "../type/grading_detail.type";
import { normalizeAssignment, normalizeSubmissions, requestJson } from "../type/grading_detail.api";
import { asObj, buildSidebar, toId, toNum, toText } from "../type/grading_detail.unit";

export function useGradingDetail() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const assignmentId = searchParams.get("assignmentId") || "";
    const submissionIdParam = searchParams.get("submissionId") || "";
    const studentIdParam = searchParams.get("studentId") || "";

    const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
    const [assignmentOptions, setAssignmentOptions] = useState<AssignmentOption[]>([]);
    const [students, setStudents] = useState<SidebarStudent[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
    const [detail, setDetail] = useState<AnyObj | null>(null);
    const [history, setHistory] = useState<AnyObj[]>([]);
    const [keyword, setKeyword] = useState("");
    const [tab, setTab] = useState<GradingTab>("list");
    const [manualScore, setManualScore] = useState("");
    const [teacherComment, setTeacherComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [grading, setGrading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const visibleStudents = useMemo(() => {
        const q = keyword.trim().toLowerCase();
        if (!q) return students;
        return students.filter((item) => `${item.name} ${item.studentCode}`.toLowerCase().includes(q));
    }, [keyword, students]);

    const selectedSidebar = useMemo(
        () => students.find((item) => item.studentId === selectedStudentId) || null,
        [students, selectedStudentId]
    );

    const maxScore =
        detail?.assignmentSnapshot?.maxScore ||
        detail?.assignment?.maxScore ||
        assignment?.maxScore ||
        10;
    const rubric = detail?.assignmentSnapshot?.rubric || assignment?.rubric || [];
    const selectedFile = detail?.sourceArchive || detail?.files?.[0] || null;

    async function loadAssignmentOptions() {
        const json = await requestJson(`/api/assignments`);
        const list = Array.isArray(json.data) ? json.data : [];

        const normalized = list
            .map((item) => normalizeAssignment(item))
            .filter((item) => item._id)
            .map((item) => ({
                _id: item._id,
                title: item.title,
                dueAt: item.dueAt,
                classroomName: item.classroom?.name || "",
            }));

        setAssignmentOptions(normalized);
        return normalized;
    }

    function syncUrl(nextAssignmentId: string, nextStudentId?: string | null, nextSubmissionId?: string | null) {
        const params = new URLSearchParams(searchParams.toString());
        if (nextAssignmentId) params.set("assignmentId", nextAssignmentId);
        if (nextStudentId) params.set("studentId", nextStudentId);
        else params.delete("studentId");
        if (nextSubmissionId) params.set("submissionId", nextSubmissionId);
        else params.delete("submissionId");
        router.replace(`${pathname}?${params.toString()}`);
    }

    async function loadDetail(
        nextAssignmentId: string,
        nextStudentId: string,
        nextSubmissionId: string | null,
        updateUrl = false
    ) {
        setSelectedStudentId(nextStudentId);
        setSelectedSubmissionId(nextSubmissionId);

        if (updateUrl) {
            syncUrl(nextAssignmentId, nextStudentId, nextSubmissionId);
        }

        if (!nextSubmissionId) {
            setDetail(null);
            setHistory([]);
            setManualScore("");
            setTeacherComment("");
            return;
        }

        setDetailLoading(true);
        setError("");

        try {
            const [detailJson, historyJson] = await Promise.all([
                requestJson(`/api/submissions/${nextSubmissionId}`),
                requestJson(`/api/submissions/${nextSubmissionId}/history`),
            ]);

            const detailData = asObj(detailJson.data);
            setDetail(detailData);
            setHistory(Array.isArray(historyJson.data) ? historyJson.data.map(asObj) : []);
            setManualScore(
                detailData.finalScore !== null && detailData.finalScore !== undefined
                    ? String(detailData.finalScore)
                    : detailData.autoGrade?.score !== null && detailData.autoGrade?.score !== undefined
                        ? String(detailData.autoGrade.score)
                        : ""
            );
            setTeacherComment(toText(detailData.teacherOverride?.comment));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Không thể tải chi tiết bài nộp");
        } finally {
            setDetailLoading(false);
        }
    }

    async function loadPage(
        nextAssignmentId: string,
        preferSubmissionId?: string | null,
        preferStudentId?: string | null
    ) {
        setLoading(true);
        setError("");

        try {
            const assignmentJson = await requestJson(`/api/assignments/${nextAssignmentId}`);
            const assignmentData = normalizeAssignment(assignmentJson.data);
            setAssignment(assignmentData);

            const [classJson, submissionsJson] = await Promise.all([
                assignmentData.classroom?._id
                    ? requestJson(`/api/classes/${assignmentData.classroom._id}/students?status=active`)
                    : Promise.resolve({ items: [] }),
                requestJson(`/api/submissions?assignmentId=${nextAssignmentId}`),
            ]);

            const submissionList = normalizeSubmissions(
                Array.isArray(submissionsJson.data) ? submissionsJson.data : []
            );
            const sidebar = buildSidebar(Array.isArray(classJson.items) ? classJson.items : [], submissionList);
            setStudents(sidebar);

            const picked =
                sidebar.find((item) => item.submissionId && item.submissionId === preferSubmissionId) ||
                sidebar.find((item) => item.studentId === preferStudentId) ||
                sidebar.find((item) => item.submissionId) ||
                sidebar[0] ||
                null;

            if (picked) {
                await loadDetail(nextAssignmentId, picked.studentId, picked.submissionId, false);
            } else {
                setSelectedStudentId("");
                setSelectedSubmissionId(null);
                setDetail(null);
                setHistory([]);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Không thể tải trang chấm bài");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const run = async () => {
            try {
                if (!assignmentOptions.length) {
                    await loadAssignmentOptions();
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : "Không thể tải danh sách bài tập");
            }

            if (!assignmentId && submissionIdParam) {
                try {
                    setLoading(true);
                    const submissionJson = await requestJson(`/api/submissions/${submissionIdParam}`);
                    const submission = asObj(submissionJson.data);

                    const resolvedAssignmentId = toId(
                        asObj(submission.assignment || submission.assignmentId)._id ||
                        submission.assignmentId
                    );

                    const resolvedStudentId = toId(
                        asObj(submission.student || submission.studentId)._id ||
                        submission.studentId
                    );

                    if (resolvedAssignmentId) {
                        syncUrl(
                            resolvedAssignmentId,
                            resolvedStudentId || null,
                            submissionIdParam
                        );
                    } else {
                        setError("Không xác định được bài tập của bài nộp này.");
                        setLoading(false);
                    }
                } catch (e) {
                    setError(e instanceof Error ? e.message : "Không thể tải chi tiết bài nộp");
                    setLoading(false);
                }
                return;
            }

            if (!assignmentId) {
                try {
                    setLoading(true);
                    const options = assignmentOptions.length
                        ? assignmentOptions
                        : await loadAssignmentOptions();

                    const first = options[0] || null;

                    if (first?._id) {
                        syncUrl(first._id, null, null);
                    } else {
                        setError("Chưa có bài tập nào để chấm.");
                        setLoading(false);
                    }
                } catch (e) {
                    setError(e instanceof Error ? e.message : "Không thể tải danh sách bài tập");
                    setLoading(false);
                }
                return;
            }

            await loadPage(assignmentId, submissionIdParam || null, studentIdParam || null);
        };

        void run();
    }, [assignmentId, submissionIdParam, studentIdParam]);

    async function handleGrade(mode: "grade" | "regrade") {
        if (!selectedSubmissionId) return;

        const isRegrade = mode === "regrade";

        setGrading(true);
        setError("");
        setNotice("");

        try {
            const json = await requestJson(`/api/submissions/${selectedSubmissionId}/grade`, {
                method: "POST",
                body: JSON.stringify({
                    regenerateAi: isRegrade,
                    regenerateRunner: isRegrade,
                    mode: isRegrade ? "full" : "normal",
                }),
            });

            setNotice(
                json.message ||
                (isRegrade ? "Chấm lại bài thành công" : "Chấm AI thành công")
            );

            await loadPage(assignmentId, selectedSubmissionId, selectedStudentId);
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : isRegrade
                        ? "Không thể chấm lại bài"
                        : "Không thể chấm AI"
            );
        } finally {
            setGrading(false);
        }
    }

    async function handleSave() {
        if (!selectedSubmissionId) return;

        const score = Number(manualScore);

        if (!Number.isFinite(score)) {
            setError("Điểm không hợp lệ.");
            return;
        }

        if (score < 0 || score > maxScore) {
            setError(`Điểm phải từ 0 đến ${maxScore}.`);
            return;
        }

        if (!teacherComment.trim()) {
            setError("Vui lòng nhập nhận xét của giảng viên.");
            return;
        }

        setSaving(true);
        setError("");
        setNotice("");

        try {
            const json = await requestJson(`/api/submissions/${selectedSubmissionId}/override`, {
                method: "POST",
                body: JSON.stringify({
                    score,
                    comment: teacherComment.trim(),
                }),
            });

            setNotice(json.message || "Lưu phản hồi thành công");
            await loadPage(assignmentId, selectedSubmissionId, selectedStudentId);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Không thể lưu điểm thủ công");
        } finally {
            setSaving(false);
        }
    }

    return {
        assignmentId,
        assignment,
        assignmentOptions,
        students,
        visibleStudents,
        selectedSidebar,
        selectedStudentId,
        selectedSubmissionId,
        detail,
        history,
        keyword,
        setKeyword,
        tab,
        setTab,
        manualScore,
        setManualScore,
        teacherComment,
        setTeacherComment,
        loading,
        detailLoading,
        grading,
        saving,
        error,
        notice,
        maxScore,
        rubric,
        selectedFile,
        loadDetail,
        syncUrl,
        handleGrade,
        handleSave,
    };
}
