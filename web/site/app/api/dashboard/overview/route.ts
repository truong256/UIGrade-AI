import { successResponse } from "@/lib/api-response";
import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import {
    SupabaseWebAssignmentService,
    SupabaseWebClassService,
    SupabaseWebProfileService,
    SupabaseWebSubmissionService,
} from "@/services/supabase/web-mvp.supabase";

function trend(current: number, previous = 0) {
    const delta = current - previous;
    return { delta, absolute: Math.abs(delta), direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat" };
}

function dashboardRange(value: string | null) {
    const parsed = Number(value || 7);
    return Number.isFinite(parsed)
        ? Math.max(7, Math.min(90, Math.trunc(parsed)))
        : 7;
}

function relationId(value: unknown): string {
    if (!value || typeof value !== "object") return "";
    const record = value as Record<string, unknown>;
    return String(record._id || record.id || "");
}

function isCompletedStudentAssignment(item: { latestSubmission?: { status?: string } | null }) {
    return item.latestSubmission?.status === "submitted"
        || item.latestSubmission?.status === "late";
}

export async function GET(request: Request) {
    try {
        const actor = await requireActiveRequestActor(request);
        const rangeDays = dashboardRange(new URL(request.url).searchParams.get("range"));
        const [profile, classes, assignments, submissions] = await Promise.all([
            SupabaseWebProfileService.get(actor),
            SupabaseWebClassService.list(actor),
            SupabaseWebAssignmentService.list(actor),
            SupabaseWebSubmissionService.list(actor, {}),
        ]);
        const publishedScores = submissions.map((item) => item.finalScore).filter((score) => typeof score === "number") as number[];
        const averageScore = publishedScores.length ? publishedScores.reduce((sum, score) => sum + score, 0) / publishedScores.length : 0;
        const completedStudentAssignments = actor.role === "student"
            ? assignments.filter(isCompletedStudentAssignment).length
            : 0;
        const pendingAssignments = actor.role === "student"
            ? assignments.length - completedStudentAssignments
            : submissions.filter((item) => item.gradeStatus === "pending").length;
        const completionRate = assignments.length
            ? Math.round((actor.role === "student" ? completedStudentAssignments : submissions.length) / assignments.length * 100)
            : 0;
        const now = new Date();
        const days = Array.from({ length: rangeDays }, (_, offset) => {
            const date = new Date(now);
            date.setUTCDate(now.getUTCDate() - (rangeDays - offset - 1));
            const key = date.toISOString().slice(0, 10);
            return {
                date: key,
                label: new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date),
                value: submissions.filter((item) => String(item.submittedAt || "").startsWith(key)).length,
            };
        });
        const currentSubmissionCount = submissions.length;
        const data = {
            generatedAt: now.toISOString(), rangeDays,
            user: { role: actor.role, name: profile.name, greeting: `Xin chào, ${profile.name}` },
            summary: {
                totalClasses: classes.length,
                totalAssignments: assignments.length,
                totalStudents: actor.role === "lecturer" ? classes.reduce((sum, item) => sum + Number(item.studentCount || 0), 0) : 0,
                totalSubmissions: submissions.length,
            },
            stats: {
                totalSubmissions: { current: currentSubmissionCount, previous: 0, trend: trend(currentSubmissionCount), subtitle: "Bài nộp có quyền truy cập" },
                completionRate: { current: completionRate, previous: 0, trend: trend(completionRate), subtitle: "Tỷ lệ hoàn thành" },
                averageScore: { current: averageScore, previous: 0, trend: trend(averageScore), subtitle: "Chỉ tính điểm đã công bố" },
                needsAttention: { current: pendingAssignments, previous: 0, trend: trend(pendingAssignments), subtitle: actor.role === "student" ? "Bài chưa nộp" : "Bài chờ chấm" },
            },
            charts: {
                submissionsByDay: days,
                averageScoreByClass: classes.map((item) => {
                    const classId = String(item._id || "");
                    const scores = submissions
                        .filter((submission) => relationId(submission.classroomId) === classId)
                        .map((submission) => submission.finalScore)
                        .filter((score): score is number => typeof score === "number");
                    return {
                        label: item.name,
                        value: scores.length
                            ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2))
                            : 0,
                    };
                }),
            },
            notifications: [],
            recentActivities: submissions.slice(0, 8).map((item) => ({
                submissionId: item._id,
                studentName: item.studentId?.name || profile.name,
                className: item.classroomId?.name || "Lớp học",
                assignmentTitle: item.assignmentId?.title || "Bài tập",
                score: item.finalScore,
                scoreClassName: item.finalScore === null ? "text-slate-500" : "text-emerald-600",
                status: item.gradeStatus === "overridden" ? "Đã công bố" : "Chờ chấm",
                submittedAt: item.submittedAt,
                actionHref: actor.role === "student"
                    ? "/ui/my_results"
                    : `/ui/grading_detail?${new URLSearchParams({
                        assignmentId: relationId(item.assignmentId),
                        studentId: relationId(item.studentId),
                        submissionId: String(item._id || ""),
                    }).toString()}`,
            })),
        };
        return successResponse(data, "Lấy dữ liệu dashboard thành công");
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
