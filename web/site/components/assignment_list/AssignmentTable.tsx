"use client";

import type { Dispatch, Ref, SetStateAction } from "react";
import type { AssignmentItem } from "@/app/ui/assignment_list/type/assignment_list.type";
import { formatDate } from "@/app/ui/assignment_list/type/assignment_list.utils";
import { AssignmentStatusBadge, SubmissionStatusBadge } from "@/components/shared/StatusBadge";

type AssignmentTableProps = {
    items: AssignmentItem[];
    loading: boolean;
    tableColSpan: number;
    canManage: boolean;
    isStudent: boolean;
    menuOpenId: string;
    setMenuOpenId: Dispatch<SetStateAction<string>>;
    menuWrapRef: Ref<HTMLDivElement>;
    deletingId: string;
    onOpenDetail: (id: string) => void | Promise<void>;
    onOpenEdit: (item: AssignmentItem) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
};

export default function AssignmentTable({
    items,
    loading,
    tableColSpan,
    canManage,
    isStudent,
    menuOpenId,
    setMenuOpenId,
    menuWrapRef,
    deletingId,
    onOpenDetail,
    onOpenEdit,
    onDelete,
}: AssignmentTableProps) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="max-h-[580px] overflow-auto">
                <table className="w-full min-w-[1120px] text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-xs border-b border-slate-200/80 text-xs font-semibold text-slate-600">
                        <tr>
                            <th className="px-5 py-3.5">Bài tập</th>
                            <th className="px-5 py-3.5">Lớp</th>
                            <th className="px-5 py-3.5">Ngày giao</th>
                            <th className="px-5 py-3.5">Hạn nộp</th>
                            <th className="px-5 py-3.5">Điểm tối đa</th>
                            <th className="px-5 py-3.5">Tệp đính kèm</th>
                            <th className="px-5 py-3.5">Trạng thái</th>
                            {isStudent ? (
                                <th className="px-5 py-3.5">Bài nộp gần nhất</th>
                            ) : null}
                            {canManage ? (
                                <th className="px-5 py-3.5 text-right">Thao tác</th>
                            ) : null}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <tr key={index}>
                                    <td colSpan={tableColSpan} className="px-5 py-4">
                                        <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                                    </td>
                                </tr>
                            ))
                        ) : items.length ? (
                            items.map((item) => (
                                <tr
                                    key={item._id}
                                    className="transition hover:bg-slate-50/60"
                                >
                                    <td
                                        className="cursor-pointer px-5 py-3.5"
                                        onClick={() => void onOpenDetail(item._id)}
                                    >
                                        <div className="space-y-0.5">
                                            <p className="font-semibold text-[#172033] hover:text-blue-600 transition-colors">
                                                {item.title}
                                            </p>
                                            <p className="line-clamp-1 max-w-md text-xs text-[#4A5568]">
                                                {item.description || "Chưa có mô tả"}
                                            </p>
                                        </div>
                                    </td>

                                    <td
                                        className="cursor-pointer px-5 py-3.5 text-xs text-slate-600"
                                        onClick={() => void onOpenDetail(item._id)}
                                    >
                                        {item.classroom ? (
                                            <div>
                                                <p className="font-semibold text-[#172033]">
                                                    {item.classroom.name}
                                                </p>
                                                <p className="font-mono text-blue-700 text-[11px]">{item.classroom.code}</p>
                                            </div>
                                        ) : (
                                            "--"
                                        )}
                                    </td>

                                    <td
                                        className="cursor-pointer px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap"
                                        onClick={() => void onOpenDetail(item._id)}
                                    >
                                        {formatDate(item.startAt || item.createdAt)}
                                    </td>

                                    <td
                                        className="cursor-pointer px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap"
                                        onClick={() => void onOpenDetail(item._id)}
                                    >
                                        {formatDate(item.dueAt)}
                                    </td>

                                    <td
                                        className="cursor-pointer px-5 py-3.5 text-xs font-semibold text-[#172033]"
                                        onClick={() => void onOpenDetail(item._id)}
                                    >
                                        {item.maxScore}
                                    </td>

                                    <td
                                        className="cursor-pointer px-5 py-3.5 text-xs text-slate-600"
                                        onClick={() => void onOpenDetail(item._id)}
                                    >
                                        {(item.attachments || []).length ? (
                                            <div className="space-y-1">
                                                {(item.attachments || [])
                                                    .slice(0, 2)
                                                    .map((file) => (
                                                        <a
                                                            key={`${item._id}-${file.url}`}
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="block font-medium text-blue-600 hover:underline truncate max-w-[150px]"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {file.originalName}
                                                        </a>
                                                    ))}

                                                {(item.attachments || []).length > 2 ? (
                                                    <p className="text-[10px] text-slate-400">
                                                        +{(item.attachments || []).length - 2} file khác
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs">Không có</span>
                                        )}
                                    </td>

                                    <td
                                        className="cursor-pointer px-5 py-3.5"
                                        onClick={() => void onOpenDetail(item._id)}
                                    >
                                        <AssignmentStatusBadge status={item.displayStatus} />
                                    </td>

                                    {isStudent ? (
                                        <td
                                            className="cursor-pointer px-5 py-3.5 text-xs text-slate-600"
                                            onClick={() => void onOpenDetail(item._id)}
                                        >
                                            {item.latestSubmission ? (
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-[#172033]">
                                                        Lần #{item.latestSubmission.attemptNo}
                                                    </p>
                                                    <SubmissionStatusBadge status={item.latestSubmission.status} />
                                                    <p className="text-[11px] text-slate-500">
                                                        Điểm: <span className="font-bold text-[#172033]">{item.latestSubmission.finalScore ?? "Chưa có"}</span>
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">Chưa nộp</span>
                                            )}
                                        </td>
                                    ) : null}

                                    {canManage ? (
                                        <td className="px-5 py-3.5 text-right">
                                            <div
                                                className="relative inline-block"
                                                ref={menuOpenId === item._id ? menuWrapRef : null}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setMenuOpenId((prev) =>
                                                            prev === item._id ? "" : item._id
                                                        )
                                                    }
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                                                    aria-label="Tùy chọn bài tập"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        more_vert
                                                    </span>
                                                </button>

                                                {menuOpenId === item._id ? (
                                                    <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMenuOpenId("");
                                                                void onOpenDetail(item._id);
                                                            }}
                                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px] text-slate-500">
                                                                visibility
                                                            </span>
                                                            Xem chi tiết
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMenuOpenId("");
                                                                void onOpenEdit(item);
                                                            }}
                                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px] text-blue-600">
                                                                edit
                                                            </span>
                                                            Sửa
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMenuOpenId("");
                                                                void onDelete(item._id);
                                                            }}
                                                            disabled={deletingId === item._id}
                                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">
                                                                delete
                                                            </span>
                                                            {deletingId === item._id
                                                                ? "Đang xóa..."
                                                                : "Xóa"}
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </td>
                                    ) : null}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={tableColSpan}
                                    className="px-5 py-10 text-center text-xs text-slate-500"
                                >
                                    Chưa có bài tập nào khớp bộ lọc hiện tại.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
