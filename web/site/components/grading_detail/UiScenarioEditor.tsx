"use client";

import {
    UI_SCENARIO_TEMPLATES,
    normalizeUiRunnerConfig,
    type UiAction,
    type UiActionType,
    type UiRunnerConfig,
    type UiScreen,
} from "@/lib/ui-runner-config";

type Props = {
    value: UiRunnerConfig;
    onChange: (value: UiRunnerConfig) => void;
    compact?: boolean;
};

function cloneConfig(config: UiRunnerConfig): UiRunnerConfig {
    return JSON.parse(JSON.stringify(config));
}

function makeScreen(index: number): UiScreen {
    return {
        screenKey: `ui-${String(index + 1).padStart(2, "0")}`,
        label: `Màn hình ${index + 1}`,
        threshold: 70,
    };
}

function makeAction(type: UiActionType): UiAction {
    if (type === "wait") {
        return {
            type: "wait",
            ms: 1000,
        };
    }

    if (type === "screenshot") {
        return {
            type: "screenshot",
            screenKey: "ui-01",
        };
    }

    if (type === "textTag") {
        return {
            type: "textTag",
            tag: "input-name",
            value: "Nguyen Van A",
        };
    }

    if (type === "tapTag") {
        return {
            type: "tapTag",
            tag: "btn-save",
        };
    }

    return {
        type: "pressBack",
    };
}

function collectTags(actions: UiAction[]) {
    const tags = new Set<string>();

    for (const action of actions) {
        if ((action.type === "tapTag" || action.type === "textTag") && action.tag) {
            tags.add(action.tag);
        }
    }

    return Array.from(tags);
}

export default function UiScenarioEditor({ value, onChange, compact = false }: Props) {
    const config = normalizeUiRunnerConfig(value);
    const tags = collectTags(config.uiActions);

    const fieldClass =
        "h-10 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

    const smallButtonClass =
        "rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition";

    function update(next: Partial<UiRunnerConfig>) {
        onChange(
            normalizeUiRunnerConfig({
                ...config,
                ...next,
            })
        );
    }

    function applyTemplate(scenarioId: string) {
        const template = UI_SCENARIO_TEMPLATES.find((item) => item.scenarioId === scenarioId);

        if (!template) return;

        const next = cloneConfig({
            ...template,
            requiredFiles: config.requiredFiles,
            entryFiles: config.entryFiles,
            buildCommand: config.buildCommand,
            runCommand: config.runCommand,
            deviceProfiles: config.deviceProfiles,
        });

        update(next);
    }

    function updateScreen(index: number, patch: Partial<UiScreen>) {
        const uiScreens = [...config.uiScreens];
        uiScreens[index] = {
            ...uiScreens[index],
            ...patch,
        };

        update({
            uiScreens,
            screenshotTargets: uiScreens.map((item) => item.screenKey),
        });
    }

    function removeScreen(index: number) {
        const uiScreens = config.uiScreens.filter((_, itemIndex) => itemIndex !== index);

        update({
            uiScreens,
            screenshotTargets: uiScreens.map((item) => item.screenKey),
        });
    }

    function addScreen() {
        const uiScreens = [...config.uiScreens, makeScreen(config.uiScreens.length)];

        update({
            uiScreens,
            screenshotTargets: uiScreens.map((item) => item.screenKey),
        });
    }

    function updateAction(index: number, patch: Partial<UiAction>) {
        const uiActions = [...config.uiActions];
        uiActions[index] = {
            ...uiActions[index],
            ...patch,
        };

        update({
            uiActions,
        });
    }

    function removeAction(index: number) {
        update({
            uiActions: config.uiActions.filter((_, itemIndex) => itemIndex !== index),
        });
    }

    function addAction(type: UiActionType) {
        update({
            uiActions: [...config.uiActions, makeAction(type)],
        });
    }

    return (
        <section className={`rounded-2xl border border-sky-100 bg-white shadow-xs ${compact ? "p-4" : "p-5"}`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sky-600 text-[18px]">settings_suggest</span>
                        Cấu hình kiểm thử UI Android
                    </h2>
                </div>

                <select
                    value={config.scenarioId || ""}
                    onChange={(event) => applyTemplate(event.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 lg:max-w-xs bg-white"
                >
                    {UI_SCENARIO_TEMPLATES.map((item) => (
                        <option key={item.scenarioId} value={item.scenarioId}>
                            {item.scenarioName}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50/50 p-3">
                <p className="text-xs font-bold text-sky-900">
                    Danh sách testTag cần ghi vào đề bài cho sinh viên
                </p>

                {tags.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                            <code
                                key={tag}
                                className="rounded-lg bg-white border border-sky-200 px-2.5 py-0.5 text-xs font-mono font-bold text-sky-700 shadow-2xs"
                            >
                                {tag}
                            </code>
                        ))}
                    </div>
                ) : (
                    <p className="mt-1 text-xs text-sky-700">
                        Chưa có testTag nào trong kịch bản.
                    </p>
                )}
            </div>

            <div className="mt-4">
                <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-xs font-bold text-slate-900">
                        Màn hình cần so sánh
                    </h3>

                    <button
                        type="button"
                        onClick={addScreen}
                        className="rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition active:scale-95"
                    >
                        + Thêm màn hình
                    </button>
                </div>

                <div className="space-y-3">
                    {config.uiScreens.map((screen, index) => (
                        <div
                            key={`${screen.screenKey}-${index}`}
                            className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_90px_64px]"
                        >
                            <input
                                value={screen.screenKey}
                                onChange={(event) =>
                                    updateScreen(index, { screenKey: event.target.value })
                                }
                                placeholder="screenKey, ví dụ ui-01-login"
                                className={fieldClass}
                            />

                            <input
                                value={screen.label}
                                onChange={(event) =>
                                    updateScreen(index, { label: event.target.value })
                                }
                                placeholder="Tên màn hình"
                                className={fieldClass}
                            />

                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={screen.threshold}
                                onChange={(event) =>
                                    updateScreen(index, {
                                        threshold: Number(event.target.value || 70),
                                    })
                                }
                                className={fieldClass}
                            />

                            <button
                                type="button"
                                onClick={() => removeScreen(index)}
                                className="h-10 rounded-xl border border-rose-200 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                            >
                                Xóa
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-5">
                <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h3 className="font-bold text-slate-900">
                        testTag
                    </h3>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        <button type="button" onClick={() => addAction("wait")} className={smallButtonClass}>
                            + Chờ
                        </button>
                        <button type="button" onClick={() => addAction("screenshot")} className={smallButtonClass}>
                            + Chụp ảnh
                        </button>
                        <button type="button" onClick={() => addAction("textTag")} className={smallButtonClass}>
                            + Nhập text
                        </button>
                        <button type="button" onClick={() => addAction("tapTag")} className={smallButtonClass}>
                            + Bấm tag
                        </button>
                        <button type="button" onClick={() => addAction("pressBack")} className={smallButtonClass}>
                            + Back
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {config.uiActions.map((action, index) => (
                        <div
                            key={`${action.type}-${index}`}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                        >
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-sm font-bold text-slate-700">
                                    Bước {index + 1}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => removeAction(index)}
                                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                                >
                                    Xóa bước
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-2 lg:grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)]">
                                <select
                                    value={action.type}
                                    onChange={(event) =>
                                        updateAction(index, makeAction(event.target.value as UiActionType))
                                    }
                                    className={fieldClass}
                                >
                                    <option value="wait">wait</option>
                                    <option value="screenshot">screenshot</option>
                                    <option value="textTag">textTag</option>
                                    <option value="tapTag">tapTag</option>
                                    <option value="pressBack">pressBack</option>
                                </select>

                                {action.type === "wait" && (
                                    <input
                                        type="number"
                                        value={action.ms || 1000}
                                        onChange={(event) =>
                                            updateAction(index, {
                                                ms: Number(event.target.value || 1000),
                                            })
                                        }
                                        placeholder="Thời gian chờ ms"
                                        className={fieldClass}
                                    />
                                )}

                                {action.type === "screenshot" && (
                                    <input
                                        value={action.screenKey || ""}
                                        onChange={(event) =>
                                            updateAction(index, {
                                                screenKey: event.target.value,
                                            })
                                        }
                                        placeholder="screenKey"
                                        className={fieldClass}
                                    />
                                )}

                                {(action.type === "textTag" || action.type === "tapTag") && (
                                    <input
                                        value={action.tag || ""}
                                        onChange={(event) =>
                                            updateAction(index, {
                                                tag: event.target.value,
                                            })
                                        }
                                        placeholder="testTag"
                                        className={fieldClass}
                                    />
                                )}

                                {action.type === "textTag" && (
                                    <input
                                        value={action.value || ""}
                                        onChange={(event) =>
                                            updateAction(index, {
                                                value: event.target.value,
                                            })
                                        }
                                        placeholder="Giá trị nhập"
                                        className={fieldClass}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {!compact && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    <p className="font-semibold text-slate-900">
                        Gợi ý ghi vào đề bài:
                    </p>
                    <p className="mt-1">
                        Sinh viên bắt buộc gắn đúng các testTag trên bằng
                        <code className="mx-1 rounded bg-white px-1">Modifier.testTag(...)</code>
                        và root Compose cần bật
                        <code className="mx-1 rounded bg-white px-1">testTagsAsResourceId = true</code>.
                    </p>
                </div>
            )}
        </section>
    );
}