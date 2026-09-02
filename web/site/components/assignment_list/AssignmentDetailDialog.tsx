"use client";

import Link from "next/link";
import Dialog from "./Dialog";
import type { AssignmentItem } from "@/app/ui/assignment_list/type/assignment_list.type";
import {
    formatDate,
    getStatusClasses,
    getStatusLabel,
} from "@/app/ui/assignment_list/type/assignment_list.utils";

type AssignmentDetailDialogProps = {
    item: AssignmentItem | null;
    canManage: boolean;
    isStudent: boolean;
    deletingId: string;
    onClose: () => void;
    onOpenEdit: (item: AssignmentItem) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
};

export default function AssignmentDetailDialog({
                                                   item,
                                                   canManage,
                                                   isStudent,
                                                   deletingId,
                                                   onClose,
                                                   onOpenEdit,
                                                   onDelete,
                                               }: AssignmentDetailDialogProps) {
    return (
        <Dialog
            open={Boolean(item)}
            title="Chi tiết bài tập"
            onClose={onClose}
            maxWidth="max-w-5xl"
        >
            {item ? (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Tên bài tập</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">
                                {item.title}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Lớp học</p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {item.classroom
                                    ? `${item.classroom.name} (${item.classroom.code})`
                                    : "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Ngày giao</p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {formatDate(item.startAt || item.createdAt)}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Hạn nộp</p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {formatDate(item.dueAt)}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Điểm tối đa</p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {item.maxScore}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Ngôn ngữ</p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {item.language || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Chính sách nộp bài</p>
                            <div className="mt-1 space-y-1 text-sm text-slate-700">
                                <p>
                                    Late submit: {item.allowLateSubmit ? "Có" : "Không"}
                                </p>
                                <p>
                                    Resubmit: {item.allowResubmit ? "Có" : "Không"}
                                </p>
                                <p>
                                    Late penalty: {item.latePenaltyPercent || 0}%
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Trạng thái</p>
                            <span
                                className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getStatusClasses(
                                    item.displayStatus
                                )}`}
                            >
                                    {getStatusLabel(item.displayStatus)}
                                </span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="mb-2 font-semibold text-slate-900">Mô tả đề bài</p>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {item.description || "Chưa có mô tả"}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
                        <p className="mb-2 font-semibold text-sky-800 text-xs flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px] text-sky-600">rubric</span>
                            Rubric / Thang điểm đánh giá
                        </p>
                        <p className="whitespace-pre-wrap text-xs leading-5 text-slate-700">
                            {item.rubricText || "Chưa có rubric"}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-sky-100 p-4">
                        <p className="mb-3 font-semibold text-slate-900 text-xs">
                            Rubric cấu trúc chi tiết
                        </p>
                        {Array.isArray(item.rubric) && item.rubric.length ? (
                            <div className="space-y-2">
                                {item.rubric.map((criterion) => (
                                    <div
                                        key={criterion.code}
                                        className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3.5 py-2.5"
                                    >
                                        <div>
                                            <p className="font-semibold text-xs text-slate-900">
                                                {criterion.title}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-slate-500">
                                                {criterion.code} · {criterion.gradingSource}
                                            </p>
                                        </div>

                                        <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-sky-700">
                                            {criterion.maxPoints}đ
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400">
                                Chưa có rubric cấu trúc.
                            </p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-sky-100 p-4">
                        <p className="mb-3 font-semibold text-slate-900 text-xs">
                            File đính kèm
                        </p>
                        {(item.attachments || []).length ? (
                            <div className="space-y-2">
                                {(item.attachments || []).map((file) => (
                                    <a
                                        key={file.url}
                                        href={file.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block rounded-xl bg-sky-50/50 border border-sky-100 px-3.5 py-2 text-xs text-sky-700 hover:underline"
                                    >
                                        {file.originalName}
                                        <span className="ml-2 text-[10px] uppercase text-slate-400">
                                            {file.kind}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400">
                                Không có file đính kèm
                            </p>
                        )}
                    </div>

                    {item.teacher ? (
                        <div className="rounded-2xl border border-sky-100 p-4">
                            <p className="mb-1 font-semibold text-slate-900 text-xs">
                                Giảng viên phụ trách
                            </p>
                            <p className="text-xs text-slate-600">
                                {item.teacher.name} ({item.teacher.email})
                            </p>
                        </div>
                    ) : null}

                    {item.latestSubmission ? (
                        <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
                            <p className="font-semibold text-sky-900 text-xs">
                                Bài nộp gần nhất
                            </p>
                            <p className="mt-1 text-xs text-sky-700">
                                Lần nộp #{item.latestSubmission.attemptNo} -{" "}
                                {item.latestSubmission.status}
                            </p>
                            <p className="mt-0.5 text-xs text-sky-700">
                                Điểm cuối cùng:{" "}
                                <span className="font-bold text-sky-950">{item.latestSubmission.finalScore ?? "Chưa chấm"}</span>
                            </p>
                        </div>
                    ) : null}

                    <div className="flex flex-wrap justify-end gap-3 pt-2">
                        {isStudent ? (
                            <>
                                <Link
                                    href="/ui/submit_assignment"
                                    className="rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 transition"
                                >
                                    Đi tới nộp bài
                                </Link>

                                {item.latestSubmission?._id ? (
                                    <Link
                                        href={`/ui/grading_detail?assignmentId=${item._id}&submissionId=${item.latestSubmission._id}`}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                    >
                                        Xem kết quả chấm
                                    </Link>
                                ) : null}
                            </>
                        ) : null}

                        {canManage ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        void onOpenEdit(item);
                                    }}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                                >
                                    Sửa bài tập
                                </button>

                                <button
                                    type="button"
                                    onClick={() => void onDelete(item._id)}
                                    disabled={deletingId === item._id}
                                    className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 disabled:opacity-60"
                                >
                                    {deletingId === item._id ? "Đang xóa..." : "Xóa"}
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </Dialog>
    );
}
