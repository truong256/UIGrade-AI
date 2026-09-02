"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnyObj, AssignmentDetail } from "@/app/ui/grading_detail/type/grading_detail.type";
import { toText } from "@/app/ui/grading_detail/type/grading_detail.unit";
import UiBaselineCropper from "./UiBaselineCropper";
import UiScenarioEditor from "./UiScenarioEditor";
import {
    DEFAULT_ANDROID_UI_RUNNER_CONFIG,
    normalizeUiRunnerConfig,
    type UiRunnerConfig,
} from "@/lib/ui-runner-config";

type Props = {
    assignment: AssignmentDetail | null;
    rubric: AnyObj[];
};

function findImageAttachment(attachments: AnyObj[]) {
    return attachments.find((item) => {
        const mime = toText(item.mimeType).toLowerCase();
        const url = toText(item.url).toLowerCase();

        return (
            mime.startsWith("image/") ||
            url.endsWith(".png") ||
            url.endsWith(".jpg") ||
            url.endsWith(".jpeg") ||
            url.endsWith(".webp")
        );
    });
}

export function SidebarConfig({ assignment, rubric: _rubric }: Props) {
    const [runnerConfig, setRunnerConfig] = useState<UiRunnerConfig>(
        DEFAULT_ANDROID_UI_RUNNER_CONFIG
    );

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [openConfigDialog, setOpenConfigDialog] = useState(false);
    const [dialogTab, setDialogTab] = useState<"scenario" | "baseline">("scenario");

    useEffect(() => {
        setRunnerConfig(
            normalizeUiRunnerConfig(
                assignment?.runnerConfig || DEFAULT_ANDROID_UI_RUNNER_CONFIG
            )
        );
    }, [assignment?._id, assignment?.runnerConfig]);

    const imageAttachment = useMemo(
        () => findImageAttachment(assignment?.attachments || []),
        [assignment?.attachments]
    );

    async function handleSaveRunnerConfig() {
        if (!assignment?._id) return;

        try {
            setSaving(true);
            setMessage("");

            const response = await fetch(`/api/assignments/${assignment._id}/runner-config`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    runnerConfig,
                }),
            });

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(data.message || "Không lưu được cấu hình testTag.");
            }

            setMessage("Đã lưu cấu hình kiểm thử UI.");
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Không lưu được cấu hình kiểm thử UI."
            );
        } finally {
            setSaving(false);
        }
    }

    if (!assignment?._id) {
        return (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Chưa có bài tập để cấu hình kiểm thử UI.
            </div>
        );
    }

    return (
        <div className="mt-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-bold text-slate-900">
                    Cấu hình kiểm thử UI Android
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                    Bấm nút bên dưới để mở cửa sổ cấu hình testTag, màn hình cần so sánh và ảnh chuẩn UI.
                </p>

                <button
                    type="button"
                    onClick={() => {
                        setDialogTab("scenario");
                        setOpenConfigDialog(true);
                    }}
                    className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95"
                >
                    Mở cấu hình kiểm thử UI
                </button>

                {message && (
                    <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        {message}
                    </p>
                )}
            </div>

            {openConfigDialog && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-6 py-8"
                    onClick={() => setOpenConfigDialog(false)}
                >
                    <div
                        className="mb-8 h-[76vh] w-[min(920px,calc(100vw-96px))] overflow-hidden rounded-3xl bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Cấu hình kiểm thử UI Android
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Thiết lập testTag, màn hình cần so sánh và ảnh UI chuẩn.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpenConfigDialog(false)}
                                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Đóng
                            </button>
                        </div>

                        <div className="border-b border-slate-200 bg-white px-4 py-2">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDialogTab("scenario")}
                                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                        dialogTab === "scenario"
                                            ? "bg-blue-600 text-white shadow-xs"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    1. Cấu hình testTag
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDialogTab("baseline")}
                                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                        dialogTab === "baseline"
                                            ? "bg-blue-600 text-white shadow-xs"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    2. Ảnh chuẩn UI
                                </button>
                            </div>
                        </div>

                        <div className="h-[calc(74vh-125px)] overflow-y-auto p-4">
                            {dialogTab === "scenario" ? (
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-blue-900">
                                                Lưu cấu hình kiểm thử
                                            </p>
                                            <p className="mt-0.5 text-xs text-blue-700">
                                                Sau khi chỉnh testTag hoặc màn hình so sánh, bấm lưu để áp dụng cho bài chấm.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleSaveRunnerConfig}
                                            disabled={saving}
                                            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {saving ? "Đang lưu..." : "Lưu cấu hình"}
                                        </button>
                                    </div>

                                    {message && (
                                        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                            {message}
                                        </p>
                                    )}

                                    <UiScenarioEditor
                                        value={runnerConfig}
                                        onChange={setRunnerConfig}
                                        compact={true}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">

                                    {imageAttachment?.url ? (
                                        <div className="h-[calc(74vh-260px)] min-h-[420px]">
                                            <UiBaselineCropper
                                                assignmentId={assignment._id}
                                                sourceImageUrl={toText(imageAttachment.url)}
                                                screens={runnerConfig.uiScreens}
                                            />
                                        </div>
                                    ) : (
                                        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
                                            Chưa có ảnh giao diện mẫu. Hãy upload ảnh đề tổng/giao diện mẫu vào file đính kèm bài tập.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}