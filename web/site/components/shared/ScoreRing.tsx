type ScoreRingProps = {
    score: number;
    maxScore?: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
};

export function getScoreColor(score: number, maxScore: number = 10) {
    const pct = maxScore > 0 ? score / maxScore : 0;
    if (pct >= 0.9) return { stroke: "#16A34A", text: "text-emerald-600", bg: "bg-emerald-50" };
    if (pct >= 0.7) return { stroke: "#2563EB", text: "text-blue-600", bg: "bg-blue-50" };
    if (pct >= 0.5) return { stroke: "#D97706", text: "text-amber-600", bg: "bg-amber-50" };
    return { stroke: "#DC2626", text: "text-red-600", bg: "bg-red-50" };
}

export function ScoreRing({
    score,
    maxScore = 10,
    size = 100,
    strokeWidth = 8,
    className = "",
}: ScoreRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(maxScore > 0 ? score / maxScore : 0, 0), 1);
    const strokeDashoffset = circumference - progress * circumference;

    const { stroke, text } = getScoreColor(score, maxScore);

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-slate-100 dark:text-slate-800"
                    fill="transparent"
                />
                {/* Progress */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold tracking-tight ${text}`}>
                    {score % 1 === 0 ? score : score.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-medium">/{maxScore}</span>
            </div>
        </div>
    );
}
