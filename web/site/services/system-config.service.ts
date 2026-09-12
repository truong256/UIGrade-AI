import { createSupabaseServerClient } from "@/lib/supabase/server";

type AnyObject = Record<string, any>;

type PublicConfig = {
    judge: { serverUrl: string; apiKey: string; hasApiKey: boolean };
    limits: { maxRuntimeMs: number; maxMemoryMb: number };
    email: {
        enabled: boolean;
        smtpHost: string;
        smtpPort: number;
        secure: boolean;
        smtpUser: string;
        smtpPass: string;
        hasSmtpPass: boolean;
        senderName: string;
        senderEmail: string;
        notifyOnNewAssignment: boolean;
        notifyBeforeDue: boolean;
        reminderBeforeHours: number[];
        notifyAtDue: boolean;
        testReceiverEmail: string;
    };
    backup: { backupFrequency: string; cloudProvider: string };
    updatedAt?: string;
    createdAt?: string;
};

function asObject(value: unknown): AnyObject {
    return typeof value === "object" && value !== null ? (value as AnyObject) : {};
}

function toText(value: unknown, fallback = "") {
    if (typeof value === "string") return value.trim();
    if (value === null || value === undefined) return fallback;
    return String(value).trim();
}

function toNumberValue(value: unknown, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toBooleanValue(value: unknown, fallback: boolean) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes", "on"].includes(normalized)) return true;
        if (["false", "0", "no", "off"].includes(normalized)) return false;
    }
    if (typeof value === "number") return value > 0;
    return fallback;
}

function normalizeHours(value: unknown, fallback: number[]) {
    const rawValues = Array.isArray(value)
        ? value
        : typeof value === "string"
          ? value.split(",")
          : [];
    const next = rawValues
        .map((item) => Number(String(item).trim()))
        .filter((item) => Number.isFinite(item) && item > 0)
        .map((item) => Math.round(item));
    const unique = Array.from(new Set(next)).sort((a, b) => b - a);
    return unique.length ? unique : fallback;
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getDefaultConfig() {
    return {
        judge: { serverUrl: "https://judge.autograde.io/v1/api", apiKey: "" },
        limits: { maxRuntimeMs: 1000, maxMemoryMb: 256 },
        email: {
            enabled: false,
            smtpHost: "smtp.gmail.com",
            smtpPort: 587,
            secure: false,
            smtpUser: "",
            smtpPass: "",
            senderName: "AutoGrade",
            senderEmail: "",
            notifyOnNewAssignment: true,
            notifyBeforeDue: true,
            reminderBeforeHours: [24, 3],
            notifyAtDue: true,
            testReceiverEmail: "",
        },
        backup: { backupFrequency: "daily_0000", cloudProvider: "google_drive" },
    };
}

function normalizeInternalConfig(value: unknown, updatedAt?: string, createdAt?: string) {
    const doc = asObject(value);
    const defaults = getDefaultConfig();
    return {
        judge: {
            serverUrl: toText(doc.judge?.serverUrl, defaults.judge.serverUrl),
            apiKey: toText(doc.judge?.apiKey, defaults.judge.apiKey),
        },
        limits: {
            maxRuntimeMs: Math.max(100, toNumberValue(doc.limits?.maxRuntimeMs, defaults.limits.maxRuntimeMs)),
            maxMemoryMb: Math.max(64, toNumberValue(doc.limits?.maxMemoryMb, defaults.limits.maxMemoryMb)),
        },
        email: {
            enabled: toBooleanValue(doc.email?.enabled, defaults.email.enabled),
            smtpHost: toText(doc.email?.smtpHost, defaults.email.smtpHost),
            smtpPort: toNumberValue(doc.email?.smtpPort, defaults.email.smtpPort),
            secure: toBooleanValue(doc.email?.secure, defaults.email.secure),
            smtpUser: toText(doc.email?.smtpUser, defaults.email.smtpUser),
            smtpPass: toText(doc.email?.smtpPass, defaults.email.smtpPass),
            senderName: toText(doc.email?.senderName, defaults.email.senderName),
            senderEmail: toText(doc.email?.senderEmail, defaults.email.senderEmail).toLowerCase(),
            notifyOnNewAssignment: toBooleanValue(doc.email?.notifyOnNewAssignment, defaults.email.notifyOnNewAssignment),
            notifyBeforeDue: toBooleanValue(doc.email?.notifyBeforeDue, defaults.email.notifyBeforeDue),
            reminderBeforeHours: normalizeHours(doc.email?.reminderBeforeHours, defaults.email.reminderBeforeHours),
            notifyAtDue: toBooleanValue(doc.email?.notifyAtDue, defaults.email.notifyAtDue),
            testReceiverEmail: toText(doc.email?.testReceiverEmail, defaults.email.testReceiverEmail).toLowerCase(),
        },
        backup: {
            backupFrequency: toText(doc.backup?.backupFrequency, defaults.backup.backupFrequency),
            cloudProvider: toText(doc.backup?.cloudProvider, defaults.backup.cloudProvider),
        },
        updatedAt,
        createdAt,
    };
}

function toPublicConfig(doc: ReturnType<typeof normalizeInternalConfig>): PublicConfig {
    return {
        ...doc,
        judge: { ...doc.judge, apiKey: "", hasApiKey: Boolean(doc.judge.apiKey) },
        email: { ...doc.email, smtpPass: "", hasSmtpPass: Boolean(doc.email.smtpPass) },
    };
}

async function readConfigRow() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("system_configs")
        .select("value, created_at, updated_at")
        .eq("key", "default")
        .maybeSingle();
    if (error) throw new Error(`Không thể đọc cấu hình hệ thống: ${error.message}`);
    if (data) return data;

    const defaults = getDefaultConfig();
    const { data: created, error: createError } = await supabase
        .from("system_configs")
        .insert({ key: "default", value: defaults, description: "UIGrade AI Web system configuration" })
        .select("value, created_at, updated_at")
        .single();
    if (createError) throw new Error(`Không thể khởi tạo cấu hình hệ thống: ${createError.message}`);
    return created;
}

export const systemConfigService = {
    async getInternalConfig() {
        const row = await readConfigRow();
        return normalizeInternalConfig(row.value, row.updated_at, row.created_at);
    },

    async getPublicConfig() {
        return toPublicConfig(await this.getInternalConfig());
    },

    async updateConfig(payload: unknown) {
        const current = await this.getInternalConfig();
        const body = asObject(payload);
        const judge = asObject(body.judge);
        const limits = asObject(body.limits);
        const email = asObject(body.email);
        const backup = asObject(body.backup);

        const next = {
            judge: {
                serverUrl: toText(judge.serverUrl, current.judge.serverUrl),
                apiKey: toText(judge.apiKey) || current.judge.apiKey,
            },
            limits: {
                maxRuntimeMs: Math.max(100, toNumberValue(limits.maxRuntimeMs, current.limits.maxRuntimeMs)),
                maxMemoryMb: Math.max(64, toNumberValue(limits.maxMemoryMb, current.limits.maxMemoryMb)),
            },
            email: {
                enabled: toBooleanValue(email.enabled, current.email.enabled),
                smtpHost: toText(email.smtpHost, current.email.smtpHost),
                smtpPort: Math.min(65535, Math.max(1, toNumberValue(email.smtpPort, current.email.smtpPort))),
                secure: toBooleanValue(email.secure, current.email.secure),
                smtpUser: toText(email.smtpUser, current.email.smtpUser).toLowerCase(),
                smtpPass: toText(email.smtpPass) || current.email.smtpPass,
                senderName: toText(email.senderName, current.email.senderName),
                senderEmail: toText(email.senderEmail, current.email.senderEmail).toLowerCase(),
                notifyOnNewAssignment: toBooleanValue(email.notifyOnNewAssignment, current.email.notifyOnNewAssignment),
                notifyBeforeDue: toBooleanValue(email.notifyBeforeDue, current.email.notifyBeforeDue),
                reminderBeforeHours: normalizeHours(email.reminderBeforeHours, current.email.reminderBeforeHours),
                notifyAtDue: toBooleanValue(email.notifyAtDue, current.email.notifyAtDue),
                testReceiverEmail: toText(email.testReceiverEmail, current.email.testReceiverEmail).toLowerCase(),
            },
            backup: {
                backupFrequency: toText(backup.backupFrequency, current.backup.backupFrequency),
                cloudProvider: toText(backup.cloudProvider, current.backup.cloudProvider),
            },
        };

        if (!next.judge.serverUrl) throw new Error("URL server chấm bài không được để trống");
        if (next.email.enabled) {
            if (!next.email.smtpHost) throw new Error("SMTP host không được để trống khi bật email");
            if (!next.email.smtpUser) throw new Error("SMTP username không được để trống khi bật email");
            if (!next.email.smtpPass) throw new Error("Bạn cần nhập App Password SMTP để gửi email");
            if (!next.email.senderEmail || !isValidEmail(next.email.senderEmail)) {
                throw new Error("Email người gửi không hợp lệ");
            }
        }
        if (next.email.testReceiverEmail && !isValidEmail(next.email.testReceiverEmail)) {
            throw new Error("Email nhận thử không hợp lệ");
        }

        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from("system_configs")
            .upsert(
                {
                    key: "default",
                    value: next,
                    description: "UIGrade AI Web system configuration",
                    updated_by: user?.id ?? null,
                },
                { onConflict: "key" }
            )
            .select("value, created_at, updated_at")
            .single();
        if (error) throw new Error(`Không thể lưu cấu hình hệ thống: ${error.message}`);
        return toPublicConfig(normalizeInternalConfig(data.value, data.updated_at, data.created_at));
    },
};
