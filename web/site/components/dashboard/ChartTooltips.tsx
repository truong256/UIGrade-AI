import { formatScore } from "@/app/ui/dashboard/type/dashboard.utils";

export function SubmissionTooltip({
                                      active,
                                      payload,
                                      label,
                                  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}) {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-xl border border-sky-100 bg-white px-3 py-2 shadow-lg shadow-sky-950/10">
            <p className="text-xs font-bold text-slate-900">{label}</p>
            <p className="mt-0.5 text-xs font-semibold text-sky-700">
                {payload[0].value} lượt nộp
            </p>
        </div>
    );
}

export function ScoreTooltip({
                                 active,
                                 payload,
                                 label,
                             }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}) {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-xl border border-sky-100 bg-white px-3 py-2 shadow-lg shadow-sky-950/10">
            <p className="text-xs font-bold text-slate-900">{label}</p>
            <p className="mt-0.5 text-xs font-semibold text-sky-700">
                Điểm TB: {formatScore(payload[0].value)}/10đ
            </p>
        </div>
    );
}
