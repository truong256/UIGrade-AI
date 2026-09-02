"use client";

import { useMemo, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import type { UiScreen } from "@/lib/ui-runner-config";

type Props = {
    assignmentId: string;
    sourceImageUrl: string;
    screens: UiScreen[];
    onSaved?: () => void;
};

export default function UiBaselineCropper({
                                              assignmentId,
                                              sourceImageUrl,
                                              screens,
                                              onSaved,
                                          }: Props) {
    const imageRef = useRef<HTMLImageElement | null>(null);

    const screenOptions = useMemo(() => {
        return screens.length
            ? screens
            : [
                {
                    screenKey: "ui-01-home",
                    label: "Màn hình chính",
                    threshold: 70,
                },
            ];
    }, [screens]);

    const [screenKey, setScreenKey] = useState(
        screenOptions[0]?.screenKey || "ui-01-home"
    );
    const [label, setLabel] = useState(
        screenOptions[0]?.label || "Màn hình chính"
    );

    const [crop, setCrop] = useState<Crop>({
        unit: "%",
        x: 10,
        y: 10,
        width: 40,
        height: 65,
    });

    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    async function handleSave() {
        if (!completedCrop) {
            setMessage("Bạn cần kéo chọn vùng ảnh UI trước.");
            return;
        }

        const image = imageRef.current;

        if (!image) {
            setMessage("Không đọc được kích thước ảnh.");
            return;
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const cropPayload = {
            x: Math.round(completedCrop.x * scaleX),
            y: Math.round(completedCrop.y * scaleY),
            width: Math.round(completedCrop.width * scaleX),
            height: Math.round(completedCrop.height * scaleY),
        };

        setSaving(true);
        setMessage("");

        try {
            const response = await fetch(
                `/api/assignments/${assignmentId}/ui-baselines`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        sourceImageUrl,
                        screenKey,
                        label,
                        crop: cropPayload,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Không lưu được ảnh UI chuẩn.");
            }

            setMessage(`Đã lưu ảnh chuẩn cho ${screenKey}`);
            onSaved?.();
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Lỗi lưu ảnh crop."
            );
        } finally {
            setSaving(false);
        }
    }

    function handleScreenChange(value: string) {
        const found = screenOptions.find((item) => item.screenKey === value);
        setScreenKey(value);
        setLabel(found?.label || value);
        setMessage("");
    }

    return (
        <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4">
            <div className="shrink-0">
                <h3 className="text-base font-semibold text-slate-900">
                    Cắt ảnh UI chuẩn để so sánh
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                    Chọn screenKey theo kịch bản testTag, kéo vùng ảnh cần so sánh rồi bấm lưu.
                </p>
            </div>

            <div className="mt-3 grid shrink-0 grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                    Màn hình
                    <select
                        value={screenKey}
                        onChange={(event) => handleScreenChange(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                        {screenOptions.map((item) => (
                            <option key={item.screenKey} value={item.screenKey}>
                                {item.screenKey} - {item.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="text-sm font-medium text-slate-700">
                    Tên hiển thị
                    <input
                        value={label}
                        onChange={(event) => setLabel(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </label>
            </div>

            <div className="mt-3 flex h-[340px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 px-3 pt-3 pb-5">
                <ReactCrop
                    crop={crop}
                    onChange={(nextCrop) => setCrop(nextCrop)}
                    onComplete={(nextCrop) => setCompletedCrop(nextCrop)}
                    className="flex max-h-full max-w-full items-center justify-center"
                >
                    <img
                        ref={imageRef}
                        src={sourceImageUrl}
                        alt="Ảnh đề tổng"
                        className="block rounded-xl bg-white object-contain shadow-sm"
                        style={{
                            maxHeight: "300px",
                            maxWidth: "100%",
                            width: "auto",
                            height: "auto",
                        }}
                    />
                </ReactCrop>
            </div>

            <div className="mt-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {saving ? "Đang lưu..." : "Lưu ảnh UI chuẩn"}
                </button>

                {message && (
                    <span className="text-sm text-slate-600">{message}</span>
                )}
            </div>
        </div>
    );
}