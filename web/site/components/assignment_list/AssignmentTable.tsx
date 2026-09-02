"use client";

import type { Dispatch, Ref, SetStateAction } from "react";
import type { AssignmentItem } from "@/app/ui/assignment_list/type/assignment_list.type";
import {
    formatDate,
    getStatusClasses,
    getStatusLabel,
} from "@/app/ui/assignment_list/type/assignment_list.utils";

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
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[1120px]">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                        <th className="px-5 py-4">Bài tập</th>
                        <th className="px-5 py-4">Lớp</th>
                        <th className="px-5 py-4">Ngày giao</th>
                        <th className="px-5 py-4">Hạn nộp</th>
                        <th className="px-5 py-4">Điểm tối đa</th>
                        <th className="px-5 py-4">Tệp đính kèm</th>
                        <th className="px-5 py-4">Trạng thái</th>
                        {isStudent ? (
                            <th className="px-5 py-4">Bài nộp gần nhất</th>
                        ) : null}
                        {canManage ? (
                            <th className="px-5 py-4 text-right">Thao tác</th>
                        ) : null}
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr>
                            <td
                                colSpan={tableColSpan}
                                className="px-5 py-10 text-center text-slate-500"
                            >
                                Đang tải danh sách bài tập...
                            </td>
                        </tr>
                    ) : items.length ? (
                        items.map((item) => (
                            <tr
                                key={item._id}
                                className="align-top transition hover:bg-slate-50"
                            >
                                <td
                                    className="cursor-pointer px-5 py-4"
                                    onClick={() => void onOpenDetail(item._id)}
                                >
                                    <div className="space-y-1">
                                        <p className="font-semibold text-slate-900">
                                            {item.title}
                                        </p>
                                        <p className="line-clamp-2 max-w-md text-sm text-slate-500">
                                            {item.description || "Chưa có mô tả"}
                                        </p>
                                    </div>
                                </td>

                                <td
                                    className="cursor-pointer px-5 py-4 text-sm text-slate-600"
                                    onClick={() => void onOpenDetail(item._id)}
                                >
                                    {item.classroom ? (
                                        <div>
                                            <p className="font-medium text-slate-800">
                                                {item.classroom.name}
                                            </p>
                                            <p>{item.classroom.code}</p>
                                        </div>
                                    ) : (
                                        "--"
                                    )}
                                </td>

                                <td
                                    className="cursor-pointer px-5 py-4 text-sm text-slate-600"
                                    onClick={() => void onOpenDetail(item._id)}
                                >
                                    {formatDate(item.startAt || item.createdAt)}
                                </td>

                                <td
                                    className="cursor-pointer px-5 py-4 text-sm text-slate-600"
                                    onClick={() => void onOpenDetail(item._id)}
                                >
                                    {formatDate(item.dueAt)}
                                </td>

                                <td
                                    className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-700"
                                    onClick={() => void onOpenDetail(item._id)}
                                >
                                    {item.maxScore}
                                </td>

                                <td
                                    className="cursor-pointer px-5 py-4 text-sm text-slate-600"
                                    onClick={() => void onOpenDetail(item._id)}
                                >
                                    {(item.attachments || []).length ? (
                                        <div className="space-y-2">
                                            {(item.attachments || [])
                                                .slice(0, 2)
                                                .map((file) => (
                                                    <a
                                                        key={`${item._id}-${file.url}`}
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block text-sky-600 hover:underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {file.originalName}
                                                    </a>
                                                ))}

                                            {(item.attachments || []).length > 2 ? (
                                                <p className="text-xs text-slate-400">
                                                    +{(item.attachments || []).length - 2} file
                                                    khác
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : (
                                        "Không có"
                                    )}
                                </td>

                                <td
                                    className="cursor-pointer px-5 py-4"
                                    onClick={() => void onOpenDetail(item._id)}
                                >
                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getStatusClasses(
                                                    item.displayStatus
                                                )}`}
                                            >
                                                {getStatusLabel(item.displayStatus)}
                                            </span>
                                </td>

                                {isStudent ? (
                                    <td
                                        className="cursor-pointer px-5 py-4 text-sm text-slate-600"
                                        onClick={() => void onOpenDetail(item._id)}
                                    >
                                        {item.latestSubmission ? (
                                            <div className="space-y-1">
                                                <p className="font-medium text-slate-800">
                                                    Attempt #{item.latestSubmission.attemptNo}
                                                </p>
                                                <p>{item.latestSubmission.status}</p>
                                                <p className="text-xs text-slate-500">
                                                    Điểm:{" "}
                                                    {item.latestSubmission.finalScore ?? "Chưa có"}
                                                </p>
                                            </div>
                                        ) : (
                                            "Chưa nộp"
                                        )}
                                    </td>
                                ) : null}

                                {canManage ? (
                                    <td className="px-5 py-4 text-right">
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
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                                            >
                                                        <span className="material-symbols-outlined">
                                                            more_vert
                                                        </span>
                                            </button>

                                            {menuOpenId === item._id ? (
                                                <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setMenuOpenId("");
                                                            void onOpenDetail(item._id);
                                                        }}
                                                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                                                    >
                                                                <span className="material-symbols-outlined text-[18px]">
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
                                                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                                                    >
                                                                <span className="material-symbols-outlined text-[18px]">
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
                                                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                                                    >
                                                                <span className="material-symbols-outlined text-[18px]">
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
                                className="px-5 py-10 text-center text-slate-500"
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
