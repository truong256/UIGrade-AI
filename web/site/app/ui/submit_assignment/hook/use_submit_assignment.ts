import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAvailableAssignments, saveSubmission } from "../type/submit_assignment.api";
import type { AssignmentItem, SubmitAction } from "../type/submit_assignment.type";
import {
    canSubmitAssignment,
    getSubmissionValidationError,
} from "../type/submit_assignment.utils";

export function useSubmitAssignment() {
    const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [repositoryUrl, setRepositoryUrl] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const submissionInFlightRef = useRef(false);

    const selectedAssignment = useMemo(
        () => assignments.find((item) => item._id === selectedId) || null,
        [assignments, selectedId]
    );

    const canSubmit = useMemo(
        () => canSubmitAssignment(selectedAssignment),
        [selectedAssignment]
    );

    const loadAssignments = async () => {
        try {
            setLoading(true);
            setError("");

            const items = await fetchAvailableAssignments();
            setAssignments(items);

            setSelectedId((previousId) => {
                if (previousId && items.some((item) => item._id === previousId)) {
                    return previousId;
                }

                const requestedId = new URLSearchParams(window.location.search).get("assignmentId");
                if (requestedId && items.some((item) => item._id === requestedId)) {
                    return requestedId;
                }

                return items[0]?._id || "";
            });
        } catch (fetchError) {
            setError(
                fetchError instanceof Error
                    ? fetchError.message
                    : "Không tải được danh sách bài tập"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadAssignments();
    }, []);

    useEffect(() => {
        if (!selectedAssignment) {
            setRepositoryUrl("");
            setNote("");
            return;
        }

        setRepositoryUrl(selectedAssignment.latestSubmission?.repositoryUrl || "");
        setNote(selectedAssignment.latestSubmission?.note || "");
        setFiles([]);
    }, [selectedAssignment]);

    const replaceFiles = (nextFiles: FileList | File[]) => {
        setFiles(Array.from(nextFiles));
    };

    const removeSelectedFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const submitAssignment = async (action: SubmitAction) => {
        if (!selectedAssignment || submissionInFlightRef.current) return;

        if (!canSubmitAssignment(selectedAssignment)) {
            setError("Bài tập này hiện không thể nhận bài nộp.");
            return;
        }

        const validationError = getSubmissionValidationError({
            action,
            files,
            repositoryUrl,
            existingFiles: selectedAssignment.latestSubmission?.status === "draft"
                ? selectedAssignment.latestSubmission.files
                : [],
        });
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            submissionInFlightRef.current = true;
            setSubmitting(true);
            setError("");
            setSuccess("");

            await saveSubmission({
                assignmentId: selectedAssignment._id,
                repositoryUrl,
                note,
                action,
                files,
            });

            setSuccess(
                action === "draft"
                    ? "Đã lưu nháp bài nộp của bạn."
                    : "Nộp bài thành công. Danh sách đã được cập nhật."
            );

            setFiles([]);
            await loadAssignments();
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Không thể nộp bài"
            );
        } finally {
            submissionInFlightRef.current = false;
            setSubmitting(false);
        }
    };

    return {
        assignments,
        selectedId,
        setSelectedId,
        selectedAssignment,
        files,
        replaceFiles,
        removeSelectedFile,
        repositoryUrl,
        setRepositoryUrl,
        note,
        setNote,
        loading,
        submitting,
        error,
        success,
        canSubmit,
        submitAssignment,
    };
}
