// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
    AnyObj,
    AssignmentDetail,
    AssignmentOption,
    GradingFilter,
    GradingTab,
    SidebarStudent,
} from "../type/grading_detail.type";
import { normalizeAssignment, normalizeSubmissions, requestJson } from "../type/grading_detail.api";
import { asObj, buildSidebar, toText } from "../type/grading_detail.unit";
import {
    normalizeAssignmentRubric,
    validateGradePayload,
} from "@/lib/grading-workflow";

type ScoreMap = Record<string, string>;
type GradingMutation = "ai" | "save" | "publish";

export function useGradingDetail() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const assignmentId = searchParams.get("assignmentId") || "";
    const submissionIdParam = searchParams.get("submissionId") || "";
    const studentIdParam = searchParams.get("studentId") || "";

    const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
    const [assignmentOptions, setAssignmentOptions] = useState<AssignmentOption[]>([]);
    const [canGrade, setCanGrade] = useState(false);
    const [students, setStudents] = useState<SidebarStudent[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
    const [detail, setDetail] = useState<AnyObj | null>(null);
    const [history, setHistory] = useState<AnyObj[]>([]);
    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState<GradingFilter>("all");
    const [tab, setTab] = useState<GradingTab>("list");
    const [manualScore, setManualScore] = useState("");
    const [criterionScores, setCriterionScores] = useState<ScoreMap>({});
    const [criterionComments, setCriterionComments] = useState<ScoreMap>({});
    const [teacherComment, setTeacherComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [mutation, setMutation] = useState<GradingMutation | null>(null);
    const mutationRef = useRef<GradingMutation | null>(null);
    const detailRequestIdRef = useRef(0);
    const pageRequestIdRef = useRef(0);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const visibleStudents = useMemo(() => {
        const q = keyword.trim().toLowerCase();
        return students.filter((item) => {
            const searchMatch = !q
                || `${item.name} ${item.email} ${item.studentCode}`.toLowerCase().includes(q);
            const statusMatch = statusFilter === "all"
                || (statusFilter === "not_submitted" && item.missing)
                || (statusFilter === "submitted" && !item.missing)
                || (statusFilter === "late" && item.isLate)
                || (statusFilter === "ungraded" && !item.missing && item.gradeStatus === "pending")
                || (statusFilter === "grading" && item.gradeStatus === "draft")
                || (statusFilter === "graded" && item.gradeStatus === "published");
            return searchMatch && statusMatch;
        });
    }, [keyword, statusFilter, students]);

    const selectedSidebar = useMemo(
        () => students.find((item) => item.studentId === selectedStudentId) || null,
        [students, selectedStudentId]
    );
    const rubricState = useMemo(() => {
        try {
            return {
                items: normalizeAssignmentRubric(detail?.assignment?.rubric || assignment?.rubric || []),
                error: "",
            };
        } catch (rubricError) {
            return {
                items: [],
                error: rubricError instanceof Error ? rubricError.message : "Rubric không hợp lệ.",
            };
        }
    }, [assignment?.rubric, detail?.assignment?.rubric]);
    const rubric = rubricState.items;
    const maxScore = Number(detail?.assignment?.maxScore || assignment?.maxScore || 10);
    const isPublished = detail?.grade?.status === "published";
    const grading = mutation === "ai";
    const saving = mutation === "save";
    const publishing = mutation === "publish";
    const selectedFile = detail?.sourceArchive || detail?.files?.[0] || null;
    const totalScore = useMemo(() => {
        if (!rubric.length) {
            const value = Number(manualScore);
            return manualScore !== "" && Number.isFinite(value) ? value : 0;
        }
        return Math.round(rubric.reduce((total, criterion) => {
            const value = Number(criterionScores[criterion.code]);
            return total + (Number.isFinite(value) ? value : 0);
        }, 0) * 100) / 100;
    }, [criterionScores, manualScore, rubric]);

    useEffect(() => {
        if (rubricState.error) setError(rubricState.error);
    }, [rubricState.error]);

    function syncUrl(nextAssignmentId: string, nextStudentId?: string | null, nextSubmissionId?: string | null) {
        const params = new URLSearchParams(searchParams.toString());
        if (nextAssignmentId) params.set("assignmentId", nextAssignmentId);
        else params.delete("assignmentId");
        if (nextStudentId) params.set("studentId", nextStudentId);
        else params.delete("studentId");
        if (nextSubmissionId) params.set("submissionId", nextSubmissionId);
        else params.delete("submissionId");
        router.replace(params.size ? `${pathname}?${params.toString()}` : pathname);
    }

    async function loadAssignmentOptions() {
        const json = await requestJson(`/api/grading/assignments`);
        const payload = asObj(json.data);
        const rows = Array.isArray(json.data)
            ? json.data
            : Array.isArray(payload.items) ? payload.items : [];
        setCanGrade(payload.canGrade === true);
        const normalized = rows
            .map(normalizeAssignment)
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

    function resetGradeForm() {
        setManualScore("");
        setCriterionScores({});
        setCriterionComments({});
        setTeacherComment("");
    }

    async function loadDetail(
        nextAssignmentId: string,
        nextStudentId: string,
        nextSubmissionId: string | null,
        updateUrl = false
    ) {
        const requestId = ++detailRequestIdRef.current;
        setSelectedStudentId(nextStudentId);
        setSelectedSubmissionId(nextSubmissionId);
        if (updateUrl) syncUrl(nextAssignmentId, nextStudentId, nextSubmissionId);
        if (!nextSubmissionId) {
            setDetail(null);
            setHistory([]);
            setDetailLoading(false);
            resetGradeForm();
            return;
        }

        setDetailLoading(true);
        setError("");
        try {
            const [detailJson, historyJson] = await Promise.all([
                requestJson(`/api/grading/submissions/${nextSubmissionId}`),
                requestJson(`/api/grading/submissions/${nextSubmissionId}/history`),
            ]);
            if (requestId !== detailRequestIdRef.current) return;

            const detailData = asObj(detailJson.data);
            const grade = asObj(detailData.grade);
            const scoreMap: ScoreMap = {};
            const commentMap: ScoreMap = {};
            for (const raw of Array.isArray(grade.rubricBreakdown) ? grade.rubricBreakdown : []) {
                const entry = asObj(raw);
                const code = toText(entry.criterionCode);
                if (!code) continue;
                scoreMap[code] = toText(entry.awardedPoints);
                commentMap[code] = toText(entry.feedback || entry.note);
            }
            setDetail(detailData);
            setHistory(Array.isArray(historyJson.data) ? historyJson.data.map(asObj) : []);
            setManualScore(grade.score === null || grade.score === undefined ? "" : String(grade.score));
            setCriterionScores(scoreMap);
            setCriterionComments(commentMap);
            setTeacherComment(toText(grade.lecturerFeedback));
        } catch (loadError) {
            if (requestId === detailRequestIdRef.current) {
                setError(loadError instanceof Error ? loadError.message : "Không thể tải chi tiết bài nộp");
            }
        } finally {
            if (requestId === detailRequestIdRef.current) {
                setDetailLoading(false);
            }
        }
    }

    async function loadPage(nextAssignmentId: string, preferredSubmission?: string | null, preferredStudent?: string | null) {
        const requestId = ++pageRequestIdRef.current;
        setLoading(true);
        setError("");
        try {
            const json = await requestJson(`/api/grading/assignments/${nextAssignmentId}/submissions`);
            if (requestId !== pageRequestIdRef.current) return;

            const workspace = asObj(json.data);
            const assignmentData = normalizeAssignment(workspace.assignment);
            const submissionList = normalizeSubmissions(
                Array.isArray(workspace.submissions) ? workspace.submissions : []
            );
            const sidebar = buildSidebar(
                Array.isArray(workspace.students) ? workspace.students : [],
                submissionList
            );
            setAssignment(assignmentData);
            setStudents(sidebar);
            const picked = sidebar.find((item) => item.submissionId === preferredSubmission)
                || sidebar.find((item) => item.studentId === preferredStudent)
                || sidebar.find((item) => item.submissionId)
                || sidebar[0]
                || null;
            if (picked) await loadDetail(nextAssignmentId, picked.studentId, picked.submissionId, false);
            else {
                setSelectedStudentId("");
                setSelectedSubmissionId(null);
                setDetail(null);
                setHistory([]);
                resetGradeForm();
            }
        } catch (loadError) {
            if (requestId === pageRequestIdRef.current) {
                setError(loadError instanceof Error ? loadError.message : "Không thể tải trang chấm bài");
            }
        } finally {
            if (requestId === pageRequestIdRef.current) {
                setLoading(false);
            }
        }
    }

    useEffect(() => {
        const run = async () => {
            try {
                const options = assignmentOptions.length ? assignmentOptions : await loadAssignmentOptions();
                const targetAssignment = assignmentId || options[0]?._id || "";
                if (!targetAssignment) {
                    setError("Chưa có bài tập nào để chấm.");
                    setLoading(false);
                    return;
                }
                if (!assignmentId) {
                    syncUrl(targetAssignment, null, null);
                    return;
                }
                await loadPage(targetAssignment, submissionIdParam || null, studentIdParam || null);
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "Không thể tải dữ liệu chấm bài");
                setLoading(false);
            }
        };
        void run();
        // URL parameters are the authoritative page selection.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignmentId, submissionIdParam, studentIdParam]);

    function gradePayload(publish: boolean) {
        const payload = {
            manualScore,
            lecturerFeedback: teacherComment,
            criteria: rubric.flatMap((criterion) => {
                const awardedPoints = criterionScores[criterion.code];
                return awardedPoints === undefined || awardedPoints === "" ? [] : [{
                    criterionCode: criterion.code,
                    awardedPoints,
                    feedback: criterionComments[criterion.code] || "",
                }];
            }),
        };

        validateGradePayload({
            assignmentRubric: rubric,
            assignmentMaxScore: maxScore,
            criteria: payload.criteria,
            manualScore: payload.manualScore,
            lecturerFeedback: payload.lecturerFeedback,
            publish,
        });

        return payload;
    }

    function beginMutation(nextMutation: GradingMutation) {
        if (mutationRef.current) return false;
        mutationRef.current = nextMutation;
        setMutation(nextMutation);
        setError("");
        setNotice("");
        return true;
    }

    function finishMutation(nextMutation: GradingMutation) {
        if (mutationRef.current !== nextMutation) return;
        mutationRef.current = null;
        setMutation(null);
    }

    async function refreshSelected(message?: string) {
        await loadPage(assignmentId, selectedSubmissionId, selectedStudentId);
        if (message) setNotice(message);
    }

    async function handleSaveDraft() {
        if (!canGrade || !selectedSubmissionId || isPublished || !beginMutation("save")) return;
        try {
            const json = await requestJson(`/api/grading/submissions/${selectedSubmissionId}/draft`, {
                method: "PUT",
                body: JSON.stringify(gradePayload(false)),
            });
            await refreshSelected(json.message || "Đã lưu bản chấm nháp");
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Không thể lưu bản chấm nháp");
        } finally {
            finishMutation("save");
        }
    }

    async function handlePublish() {
        if (!canGrade || !selectedSubmissionId || !beginMutation("publish")) return;
        try {
            const json = await requestJson(`/api/grading/submissions/${selectedSubmissionId}/publish`, {
                method: "POST",
                body: JSON.stringify(gradePayload(true)),
            });
            await refreshSelected(json.message || "Đã công bố điểm cho sinh viên");
        } catch (publishError) {
            setError(publishError instanceof Error ? publishError.message : "Không thể công bố điểm");
        } finally {
            finishMutation("publish");
        }
    }

    async function handleGrade() {
        if (!canGrade || !selectedSubmissionId || isPublished || !beginMutation("ai")) return;
        try {
            const json = await requestJson(`/api/grading/submissions/${selectedSubmissionId}/ai-suggest`, {
                method: "POST",
            });
            setDetail((current) => current ? {
                ...current,
                grade: {
                    ...asObj(current.grade),
                    aiFeedback: asObj(json.data),
                },
            } : current);
            setNotice(json.message || "AI đã tạo gợi ý để giảng viên tham khảo");
        } catch (gradeError) {
            const detail = gradeError instanceof Error ? gradeError.message : "Dịch vụ AI không phản hồi.";
            setError(`Không thể tạo gợi ý AI. Bạn vẫn có thể chấm bài thủ công. ${detail}`);
        } finally {
            finishMutation("ai");
        }
    }

    function applyAiCriterion(code: string, score: number, feedback: string) {
        setCriterionScores((previous) => ({ ...previous, [code]: String(score) }));
        if (feedback) setCriterionComments((previous) => ({ ...previous, [code]: feedback }));
        setNotice("Đã chép gợi ý vào biểu mẫu nháp. Hãy kiểm tra và bấm Lưu nháp hoặc Công bố điểm riêng.");
    }

    return {
        assignmentId, assignment, assignmentOptions, students, visibleStudents, selectedSidebar,
        canGrade,
        selectedStudentId, selectedSubmissionId, detail, history, keyword, setKeyword,
        statusFilter, setStatusFilter, tab, setTab, manualScore, setManualScore,
        criterionScores, setCriterionScores, criterionComments, setCriterionComments,
        teacherComment, setTeacherComment, loading, detailLoading, grading, saving, publishing,
        error, notice, maxScore, rubric, selectedFile, totalScore, loadDetail, syncUrl,
        handleGrade, handleSaveDraft, handlePublish, applyAiCriterion,
    };
}
