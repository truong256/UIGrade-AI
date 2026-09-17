"use client";

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { useState } from "react";
import type { AnyObj } from "@/app/ui/grading_detail/type/grading_detail.type";
import { asObj, toText } from "@/app/ui/grading_detail/type/grading_detail.unit";

type Props = {
    detail: AnyObj | null;
    canGrade: boolean;
    onApplyCriterion: (criterionCode: string, score: number, feedback: string) => void;
};

function confidenceLabel(value: number) {
    if (value >= 0.85) return "Cao";
    if (value >= 0.65) return "Trung bình";
    return "Thấp";
}

function asList(value: unknown) {
    return Array.isArray(value) ? value.map(asObj) : [];
}

export function AiFeedbackPanel({ detail, canGrade, onApplyCriterion }: Props) {
    const [ignored, setIgnored] = useState<Record<string, boolean>>({});
    const aiFeedback = asObj(detail?.grade?.aiFeedback);
    const hasFeedback = Object.keys(aiFeedback).length > 0;
    const criteria = asList(aiFeedback.criterionFeedback);
    const confidence = Number(aiFeedback.overallConfidence || 0);
    const coverage = asObj(aiFeedback.evidenceCoverage);
    const metadata = asObj(aiFeedback.metadata);
    const critic = asObj(aiFeedback.critic);
    const stale = metadata.stale === true;

    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-2 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-[20px]">smart_toy</span>
                        AI Grading Assistant
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-500">Gợi ý độc lập; không tự lưu hoặc công bố điểm.</p>
                </div>
                {hasFeedback && (
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${confidence >= 0.65 ? "bg-blue-50 text-blue-700" : "bg-amber-100 text-amber-800"}`}>
                        Độ tin cậy {confidenceLabel(confidence)} — {Math.round(confidence * 100)}%
                    </span>
                )}
            </div>

            {!hasFeedback ? (
                <div className="mt-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/30 px-4 py-8 text-center text-xs text-slate-400">
                    Chưa có gợi ý AI. Giảng viên vẫn có thể chấm, lưu nháp và công bố điểm thủ công.
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                    {stale && (
                        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                            Bài nộp đã thay đổi sau lần phân tích AI gần nhất. Hãy tạo lại gợi ý AI.
                        </div>
                    )}
                    {(aiFeedback.needsHumanReview === true || confidence < 0.65) && (
                        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900">
                            <strong>Cần giảng viên xem lại.</strong> Có tiêu chí thiếu bằng chứng, độ tin cậy thấp hoặc mâu thuẫn cần kiểm tra thủ công.
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Metric label="Điểm AI" value={`${Number(aiFeedback.suggestedTotal || 0)} / ${Number(aiFeedback.maxScore || detail?.assignment?.maxScore || 0)}`} />
                        <Metric label="Evidence" value={`${Number(coverage.verified || 0)} / ${Number(coverage.total || criteria.length)}`} />
                        <Metric label="Cần xem lại" value={String(criteria.filter((item) => item.needsHumanReview === true).length)} />
                        <Metric label="Critic" value={toText(critic.verdict, "--")} />
                    </div>

                    {toText(aiFeedback.summary) && (
                        <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 text-xs leading-relaxed text-[#172033]">
                            {toText(aiFeedback.summary)}
                        </div>
                    )}

                    <div className="space-y-3">
                        {criteria.map((criterion) => {
                            const code = toText(criterion.criterionCode);
                            if (!code || ignored[code]) return null;
                            const criterionConfidence = Number(criterion.confidence || 0);
                            const evidence = asList(criterion.evidence);
                            const feedback = toText(criterion.summary);
                            return (
                                <article key={code} className="rounded-xl border border-slate-200 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{toText(criterion.title, code)}</p>
                                            <p className="mt-0.5 text-xs font-semibold text-blue-700">
                                                AI: {Number(criterion.awardedPoints || 0)} điểm • {confidenceLabel(criterionConfidence)} {Math.round(criterionConfidence * 100)}%
                                            </p>
                                        </div>
                                        {criterion.needsHumanReview === true && (
                                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">Kiểm tra thủ công</span>
                                        )}
                                    </div>
                                    {feedback && <p className="mt-2 text-xs leading-relaxed text-slate-600">{feedback}</p>}
                                    <div className="mt-3 rounded-lg bg-slate-50 p-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Bằng chứng</p>
                                        {evidence.length ? (
                                            <ul className="mt-1.5 space-y-1.5 text-xs text-slate-700">
                                                {evidence.map((item) => (
                                                    <li key={toText(item.id)}>
                                                        <strong>{toText(item.source)}:</strong> {toText(item.description)}
                                                        {item.lineStart ? ` (dòng ${item.lineStart}-${item.lineEnd})` : ""}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="mt-1.5 text-xs text-amber-700">Không đủ bằng chứng để xác minh tiêu chí này.</p>}
                                    </div>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        <TextList title="Điểm mạnh" items={criterion.strengths} />
                                        <TextList title="Vấn đề / cải thiện" items={[...(Array.isArray(criterion.issues) ? criterion.issues : []), ...(Array.isArray(criterion.suggestions) ? criterion.suggestions : [])]} />
                                    </div>
                                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                                        <button type="button" disabled={!canGrade || stale || criterionConfidence < 0.65} title={criterionConfidence < 0.65 ? "Độ tin cậy thấp; hãy nhập điểm sau khi kiểm tra thủ công" : undefined} onClick={() => onApplyCriterion(code, Number(criterion.awardedPoints || 0), feedback)} className="rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                                            Chép vào bản nháp
                                        </button>
                                        <button type="button" onClick={() => setIgnored((current) => ({ ...current, [code]: true }))} className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600">
                                            Bỏ qua gợi ý
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {toText(critic.summary) && (
                        <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-950">
                            <strong>AI Critic:</strong> {toText(critic.summary)}
                        </div>
                    )}
                    {metadata.generatedAt && (
                        <p className="text-[10px] text-slate-400">
                            {toText(metadata.provider)} / {toText(metadata.model)} • prompt {toText(metadata.promptVersion)} • {new Date(String(metadata.generatedAt)).toLocaleString("vi-VN")}
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-slate-900">{value}</p></div>;
}

function TextList({ title, items }: { title: string; items: unknown }) {
    const values = Array.isArray(items) ? items.map(String).filter(Boolean) : [];
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</p>
            <ul className="mt-1 space-y-1 text-xs text-slate-600">
                {values.length ? values.map((item) => <li key={item}>• {item}</li>) : <li>Chưa có.</li>}
            </ul>
        </div>
    );
}
