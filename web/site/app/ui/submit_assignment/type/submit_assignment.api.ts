import type { ApiResult, AssignmentItem, SubmitAction } from "./submit_assignment.type";

export async function fetchAvailableAssignments() {
    const res = await fetch("/api/assignments/available", {
        cache: "no-store",
    });
    const result: ApiResult<AssignmentItem[]> = await res.json();

    if (!res.ok) {
        throw new Error(result.message || "Không tải được danh sách bài tập");
    }

    return result.data || [];
}

export async function saveSubmission(input: {
    assignmentId: string;
    repositoryUrl: string;
    note: string;
    action: SubmitAction;
    files: File[];
}) {
    const formData = new FormData();
    formData.set("assignmentId", input.assignmentId);
    formData.set("repositoryUrl", input.repositoryUrl);
    formData.set("note", input.note);
    formData.set("action", input.action);

    for (const file of input.files) {
        formData.append("submissionFiles", file);
    }

    const res = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
    });
    const result: ApiResult<unknown> = await res.json();

    if (!res.ok) {
        throw new Error(result.message || "Nộp bài thất bại");
    }

    return result;
}
