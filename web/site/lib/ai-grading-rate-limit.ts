const active = new Set<string>();
const completedAt = new Map<string, number>();

export class AiGenerationRateLimitError extends Error {
    constructor(readonly retryAfterSeconds: number, message = "Vui lòng chờ trước khi tạo lại gợi ý AI.") {
        super(message);
        this.name = "AiGenerationRateLimitError";
    }
}

export function beginAiGeneration(key: string, cooldownMs = 20_000) {
    if (active.has(key)) {
        throw new AiGenerationRateLimitError(5, "Một lượt phân tích AI cho bài nộp này đang chạy.");
    }
    const last = completedAt.get(key) || 0;
    const remaining = cooldownMs - (Date.now() - last);
    if (remaining > 0) {
        throw new AiGenerationRateLimitError(Math.ceil(remaining / 1000));
    }
    active.add(key);
    let released = false;
    return (successful: boolean) => {
        if (released) return;
        released = true;
        active.delete(key);
        if (successful) completedAt.set(key, Date.now());
    };
}

export function resetAiGenerationRateLimitForTests() {
    active.clear();
    completedAt.clear();
}
