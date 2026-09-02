"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from "react";

import AssignmentDetailDialog from "@/components/assignment_list/AssignmentDetailDialog";
import { fetchCurrentUserClient } from "@/lib/auth-client";
import AssignmentEditDialog from "@/components/assignment_list/AssignmentEditDialog";
import AssignmentListAlerts from "@/components/assignment_list/AssignmentListAlerts";
import AssignmentListFilters from "@/components/assignment_list/AssignmentListFilters";
import AssignmentListHeader from "@/components/assignment_list/AssignmentListHeader";
import AssignmentTable from "@/components/assignment_list/AssignmentTable";
import type {
    ApiResult,
    AssignmentItem,
    AttachmentItem,
    ClassroomOption,
    CurrentUser,
    EditFormState,
} from "./type/assignment_list.type";
import {
    formatDateTimeInput,
    normalizeAssignment,
} from "./type/assignment_list.utils";

export default function AssignmentListPage() {
    const [items, setItems] = useState<AssignmentItem[]>([]);
    const [classes, setClasses] = useState<ClassroomOption[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [classFilter, setClassFilter] = useState("all");

    const [detailItem, setDetailItem] = useState<AssignmentItem | null>(null);
    const [editItem, setEditItem] = useState<AssignmentItem | null>(null);

    const [editForm, setEditForm] = useState<EditFormState>({
        title: "",
        classroomId: "",
        description: "",
        rubricText: "",
        startAt: "",
        dueAt: "",
        maxScore: "10",
        language: "cpp",
        allowLateSubmit: false,
        allowResubmit: false,
        latePenaltyPercent: "0",
        status: "published",
    });

    const [editExistingAttachments, setEditExistingAttachments] = useState<
        AttachmentItem[]
    >([]);
    const [editResourceFiles, setEditResourceFiles] = useState<File[]>([]);
    const [editRubricFiles, setEditRubricFiles] = useState<File[]>([]);
    const [editTemplateFiles, setEditTemplateFiles] = useState<File[]>([]);

    const [menuOpenId, setMenuOpenId] = useState("");
    const menuWrapRef = useRef<HTMLDivElement | null>(null);

    const canManage =
        currentUser?.role === "teacher" || currentUser?.role === "admin";
    const isStudent = currentUser?.role === "User";

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            setError("");

            const [currentUserData, assignmentsRes, classesRes] = await Promise.all([
                fetchCurrentUserClient(),
                fetch("/api/assignments", { cache: "no-store" }),
                fetch("/api/classes", { cache: "no-store" }),
            ]);

            setCurrentUser(currentUserData);

            const assignmentsJson: ApiResult<unknown> = await assignmentsRes
                .json()
                .catch(() => ({} as ApiResult<unknown>));

            const classesJson: ApiResult<ClassroomOption[]> = await classesRes
                .json()
                .catch(() => ({} as ApiResult<ClassroomOption[]>));

            if (!assignmentsRes.ok) {
                throw new Error(
                    assignmentsJson.message || "Không tải được danh sách bài tập"
                );
            }

            setItems(
                Array.isArray(assignmentsJson.data)
                    ? assignmentsJson.data.map((item) => normalizeAssignment(item))
                    : []
            );

            if (classesRes.ok) {
                setClasses(classesJson.data || []);
            } else {
                setClasses([]);
            }
        } catch (fetchError) {
            setError(
                fetchError instanceof Error
                    ? fetchError.message
                    : "Không tải được dữ liệu"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchAssignments();
    }, []);

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (!menuWrapRef.current) return;
            if (!menuWrapRef.current.contains(event.target as Node)) {
                setMenuOpenId("");
            }
        };

        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const classOptions = useMemo(() => {
        const fetched = classes.map((item) => ({
            value: item._id,
            label: `${item.name} (${item.code})`,
        }));

        if (fetched.length) {
            return fetched;
        }

        const map = new Map<string, string>();

        for (const item of items) {
            if (item.classroom?._id) {
                map.set(
                    item.classroom._id,
                    `${item.classroom.name} (${item.classroom.code})`
                );
            }
        }

        return Array.from(map.entries()).map(([value, label]) => ({
            value,
            label,
        }));
    }, [classes, items]);

    const filteredItems = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();

        return items.filter((item) => {
            const matchKeyword = normalizedKeyword
                ? [item.title, item.description, item.classroom?.name, item.classroom?.code]
                    .filter(Boolean)
                    .some((value) =>
                        String(value).toLowerCase().includes(normalizedKeyword)
                    )
                : true;

            const matchStatus =
                statusFilter === "all" ? true : item.displayStatus === statusFilter;

            const matchClass =
                classFilter === "all" ? true : item.classroom?._id === classFilter;

            return matchKeyword && matchStatus && matchClass;
        });
    }, [classFilter, items, keyword, statusFilter]);

    const openDetail = async (id: string) => {
        try {
            setError("");

            const fallbackItem = items.find((x) => x._id === id) || null;

            const res = await fetch(`/api/assignments/${id}`, { cache: "no-store" });
            const json: ApiResult<unknown> = await res
                .json()
                .catch(() => ({} as ApiResult<unknown>));

            if (!res.ok) {
                throw new Error(json.message || "Không lấy được chi tiết bài tập");
            }

            if (json.data) {
                const normalized = normalizeAssignment(json.data);

                setDetailItem(
                    normalized.classroom
                        ? normalized
                        : fallbackItem
                            ? {
                                ...normalized,
                                classroom: fallbackItem.classroom,
                                teacher: normalized.teacher || fallbackItem.teacher || null,
                                attachments:
                                    normalized.attachments?.length
                                        ? normalized.attachments
                                        : fallbackItem.attachments || [],
                            }
                            : normalized
                );
                return;
            }

            setDetailItem(fallbackItem);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Không lấy được chi tiết bài tập"
            );
        }
    };

    const applyEditItem = (item: AssignmentItem) => {
        setEditItem(item);
        setEditExistingAttachments(item.attachments || []);
        setEditResourceFiles([]);
        setEditRubricFiles([]);
        setEditTemplateFiles([]);

        setEditForm({
            title: item.title || "",
            classroomId: item.classroom?._id || "",
            description: item.description || "",
            rubricText: item.rubricText || "",
            startAt: formatDateTimeInput(item.startAt || item.createdAt),
            dueAt: formatDateTimeInput(item.dueAt),
            maxScore: String(item.maxScore || 10),
            language: item.language || "cpp",
            allowLateSubmit: Boolean(item.allowLateSubmit),
            allowResubmit: Boolean(item.allowResubmit),
            latePenaltyPercent: String(item.latePenaltyPercent || 0),
            status: item.status || "published",
        });
    };

    const openEdit = async (item: AssignmentItem) => {
        try {
            setError("");

            const res = await fetch(`/api/assignments/${item._id}`, {
                cache: "no-store",
            });

            const json: ApiResult<unknown> = await res
                .json()
                .catch(() => ({} as ApiResult<unknown>));

            if (res.ok && json.data) {
                const normalized = normalizeAssignment(json.data);

                applyEditItem(
                    normalized.classroom
                        ? normalized
                        : {
                            ...normalized,
                            classroom: item.classroom,
                            teacher: normalized.teacher || item.teacher || null,
                            attachments:
                                normalized.attachments?.length
                                    ? normalized.attachments
                                    : item.attachments || [],
                        }
                );
                return;
            }

            applyEditItem(item);
        } catch {
            applyEditItem(item);
        }
    };

    const appendFiles =
        (setter: Dispatch<SetStateAction<File[]>>) => (files: File[]) => {
            setter((prev) => [...prev, ...files]);
        };

    const removeExistingAttachment = (url: string) => {
        setEditExistingAttachments((prev) => prev.filter((item) => item.url !== url));
    };

    const removeNewFile =
        (setter: Dispatch<SetStateAction<File[]>>) => (index: number) => {
            setter((prev) => prev.filter((_, i) => i !== index));
        };

    const handleUpdate = async () => {
        if (!editItem) return;

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            if (!editForm.title.trim()) {
                throw new Error("Tên bài tập không được để trống");
            }

            if (!editForm.classroomId) {
                throw new Error("Vui lòng chọn lớp học");
            }

            if (!editForm.startAt || !editForm.dueAt) {
                throw new Error("Vui lòng nhập ngày bắt đầu và hạn nộp");
            }

            const startAt = new Date(editForm.startAt);
            const dueAt = new Date(editForm.dueAt);

            if (Number.isNaN(startAt.getTime()) || Number.isNaN(dueAt.getTime())) {
                throw new Error("Ngày giờ không hợp lệ");
            }

            const formData = new FormData();
            formData.set("title", editForm.title);
            formData.set("classroomId", editForm.classroomId);
            formData.set("description", editForm.description);
            formData.set("rubricText", editForm.rubricText);
            formData.set("startAt", startAt.toISOString());
            formData.set("dueAt", dueAt.toISOString());
            formData.set("maxScore", editForm.maxScore);
            formData.set("language", editForm.language);
            formData.set("allowLateSubmit", String(editForm.allowLateSubmit));
            formData.set("allowResubmit", String(editForm.allowResubmit));
            formData.set("latePenaltyPercent", editForm.latePenaltyPercent);
            formData.set("status", editForm.status);

            for (const item of editExistingAttachments) {
                formData.append("keepExistingAttachmentUrls", item.url);
            }

            for (const file of editResourceFiles) {
                formData.append("resourceFiles", file);
            }

            for (const file of editRubricFiles) {
                formData.append("rubricFiles", file);
            }

            for (const file of editTemplateFiles) {
                formData.append("templateFiles", file);
            }

            const res = await fetch(`/api/assignments/${editItem._id}`, {
                method: "PUT",
                body: formData,
            });

            const json: { message?: string } = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(json.message || "Cập nhật bài tập thất bại");
            }

            setSuccess("Đã cập nhật bài tập thành công");
            setEditItem(null);
            setEditExistingAttachments([]);
            setEditResourceFiles([]);
            setEditRubricFiles([]);
            setEditTemplateFiles([]);
            await fetchAssignments();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Cập nhật bài tập thất bại"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const ok = window.confirm("Bạn có chắc muốn xóa bài tập này?");
        if (!ok) return;

        try {
            setDeletingId(id);
            setError("");
            setSuccess("");

            const res = await fetch(`/api/assignments/${id}`, {
                method: "DELETE",
            });

            const json: { message?: string } = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(json.message || "Xóa bài tập thất bại");
            }

            setSuccess("Đã xóa bài tập thành công");

            if (detailItem?._id === id) {
                setDetailItem(null);
            }

            await fetchAssignments();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Xóa bài tập thất bại");
        } finally {
            setDeletingId("");
        }
    };

    const tableColSpan = canManage ? (isStudent ? 9 : 8) : isStudent ? 8 : 7;

    return (
        <div className="space-y-6">
            <AssignmentListHeader canManage={canManage} isStudent={isStudent} />

            <AssignmentListAlerts error={error} success={success} />

            <AssignmentListFilters
                keyword={keyword}
                statusFilter={statusFilter}
                classFilter={classFilter}
                classOptions={classOptions}
                onKeywordChange={setKeyword}
                onStatusFilterChange={setStatusFilter}
                onClassFilterChange={setClassFilter}
                onResetFilters={() => {
                    setKeyword("");
                    setStatusFilter("all");
                    setClassFilter("all");
                }}
            />

            <AssignmentTable
                items={filteredItems}
                loading={loading}
                tableColSpan={tableColSpan}
                canManage={canManage}
                isStudent={isStudent}
                menuOpenId={menuOpenId}
                setMenuOpenId={setMenuOpenId}
                menuWrapRef={menuWrapRef}
                deletingId={deletingId}
                onOpenDetail={openDetail}
                onOpenEdit={openEdit}
                onDelete={handleDelete}
                onResetFilters={() => {
                    setKeyword("");
                    setStatusFilter("all");
                    setClassFilter("all");
                }}
            />

            <AssignmentDetailDialog
                item={detailItem}
                canManage={canManage}
                isStudent={isStudent}
                deletingId={deletingId}
                onClose={() => setDetailItem(null)}
                onOpenEdit={openEdit}
                onDelete={handleDelete}
            />

            <AssignmentEditDialog
                item={editItem}
                form={editForm}
                setForm={setEditForm}
                classOptions={classOptions}
                existingAttachments={editExistingAttachments}
                resourceFiles={editResourceFiles}
                rubricFiles={editRubricFiles}
                templateFiles={editTemplateFiles}
                saving={saving}
                onClose={() => setEditItem(null)}
                onSave={handleUpdate}
                onPickResourceFiles={appendFiles(setEditResourceFiles)}
                onPickRubricFiles={appendFiles(setEditRubricFiles)}
                onPickTemplateFiles={appendFiles(setEditTemplateFiles)}
                onRemoveExistingAttachment={removeExistingAttachment}
                onRemoveResourceFile={removeNewFile(setEditResourceFiles)}
                onRemoveRubricFile={removeNewFile(setEditRubricFiles)}
                onRemoveTemplateFile={removeNewFile(setEditTemplateFiles)}
            />
        </div>
    );
}
