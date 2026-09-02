import SystemConfig from "@/models/SystemConfig.model";

type AnyObject = Record<string, any>;

type PublicConfig = {
    judge: {
        serverUrl: string;
        apiKey: string;
        hasApiKey: boolean;
    };
    limits: {
        maxRuntimeMs: number;
        maxMemoryMb: number;
    };
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
    backup: {
        backupFrequency: string;
        cloudProvider: string;
    };
    updatedAt?: Date | string;
    createdAt?: Date | string;
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
        key: "default",
        judge: {
            serverUrl: "https://judge.autograde.io/v1/api",
            apiKey: "",
        },
        limits: {
            maxRuntimeMs: 1000,
            maxMemoryMb: 256,
        },
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
        backup: {
            backupFrequency: "daily_0000",
            cloudProvider: "google_drive",
        },
    };
}

function toPublicConfig(doc: AnyObject): PublicConfig {
    const judge = asObject(doc.judge);
    const limits = asObject(doc.limits);
    const email = asObject(doc.email);
    const backup = asObject(doc.backup);

    return {
        judge: {
            serverUrl: toText(judge.serverUrl, "https://judge.autograde.io/v1/api"),
            apiKey: "",
            hasApiKey: Boolean(toText(judge.apiKey)),
        },
        limits: {
            maxRuntimeMs: Math.max(100, toNumberValue(limits.maxRuntimeMs, 1000)),
            maxMemoryMb: Math.max(64, toNumberValue(limits.maxMemoryMb, 256)),
        },
        email: {
            enabled: toBooleanValue(email.enabled, false),
            smtpHost: toText(email.smtpHost, "smtp.gmail.com"),
            smtpPort: toNumberValue(email.smtpPort, 587),
            secure: toBooleanValue(email.secure, false),
            smtpUser: toText(email.smtpUser),
            smtpPass: "",
            hasSmtpPass: Boolean(toText(email.smtpPass)),
            senderName: toText(email.senderName, "AutoGrade"),
            senderEmail: toText(email.senderEmail).toLowerCase(),
            notifyOnNewAssignment: toBooleanValue(email.notifyOnNewAssignment, true),
            notifyBeforeDue: toBooleanValue(email.notifyBeforeDue, true),
            reminderBeforeHours: normalizeHours(email.reminderBeforeHours, [24, 3]),
            notifyAtDue: toBooleanValue(email.notifyAtDue, true),
            testReceiverEmail: toText(email.testReceiverEmail).toLowerCase(),
        },
        backup: {
            backupFrequency: toText(backup.backupFrequency, "daily_0000"),
            cloudProvider: toText(backup.cloudProvider, "google_drive"),
        },
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
    };
}

async function ensureConfigDoc() {
    let doc = await SystemConfig.findOne({ key: "default" }).lean();

    if (!doc) {
        const created = await SystemConfig.create(getDefaultConfig());
        doc = created.toObject();
    }

    return asObject(doc);
}

export const systemConfigService = {
    async getInternalConfig() {
        const doc = await ensureConfigDoc();
        const defaults = getDefaultConfig();

        return {
            key: "default",
            judge: {
                serverUrl: toText(doc.judge?.serverUrl, defaults.judge.serverUrl),
                apiKey: toText(doc.judge?.apiKey, defaults.judge.apiKey),
            },
            limits: {
                maxRuntimeMs: Math.max(
                    100,
                    toNumberValue(doc.limits?.maxRuntimeMs, defaults.limits.maxRuntimeMs)
                ),
                maxMemoryMb: Math.max(
                    64,
                    toNumberValue(doc.limits?.maxMemoryMb, defaults.limits.maxMemoryMb)
                ),
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
                notifyOnNewAssignment: toBooleanValue(
                    doc.email?.notifyOnNewAssignment,
                    defaults.email.notifyOnNewAssignment
                ),
                notifyBeforeDue: toBooleanValue(
                    doc.email?.notifyBeforeDue,
                    defaults.email.notifyBeforeDue
                ),
                reminderBeforeHours: normalizeHours(
                    doc.email?.reminderBeforeHours,
                    defaults.email.reminderBeforeHours
                ),
                notifyAtDue: toBooleanValue(doc.email?.notifyAtDue, defaults.email.notifyAtDue),
                testReceiverEmail: toText(doc.email?.testReceiverEmail, defaults.email.testReceiverEmail).toLowerCase(),
            },
            backup: {
                backupFrequency: toText(
                    doc.backup?.backupFrequency,
                    defaults.backup.backupFrequency
                ),
                cloudProvider: toText(doc.backup?.cloudProvider, defaults.backup.cloudProvider),
            },
            updatedAt: doc.updatedAt,
            createdAt: doc.createdAt,
        };
    },

    async getPublicConfig() {
        const doc = await ensureConfigDoc();
        return toPublicConfig(doc);
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
                apiKey: toText(judge.apiKey)
                    ? toText(judge.apiKey)
                    : current.judge.apiKey,
            },
            limits: {
                maxRuntimeMs: Math.max(
                    100,
                    toNumberValue(limits.maxRuntimeMs, current.limits.maxRuntimeMs)
                ),
                maxMemoryMb: Math.max(
                    64,
                    toNumberValue(limits.maxMemoryMb, current.limits.maxMemoryMb)
                ),
            },
            email: {
                enabled: toBooleanValue(email.enabled, current.email.enabled),
                smtpHost: toText(email.smtpHost, current.email.smtpHost),
                smtpPort: Math.min(
                    65535,
                    Math.max(1, toNumberValue(email.smtpPort, current.email.smtpPort))
                ),
                secure: toBooleanValue(email.secure, current.email.secure),
                smtpUser: toText(email.smtpUser, current.email.smtpUser).toLowerCase(),
                smtpPass: toText(email.smtpPass)
                    ? toText(email.smtpPass)
                    : current.email.smtpPass,
                senderName: toText(email.senderName, current.email.senderName),
                senderEmail: toText(email.senderEmail, current.email.senderEmail).toLowerCase(),
                notifyOnNewAssignment: toBooleanValue(
                    email.notifyOnNewAssignment,
                    current.email.notifyOnNewAssignment
                ),
                notifyBeforeDue: toBooleanValue(
                    email.notifyBeforeDue,
                    current.email.notifyBeforeDue
                ),
                reminderBeforeHours: normalizeHours(
                    email.reminderBeforeHours,
                    current.email.reminderBeforeHours
                ),
                notifyAtDue: toBooleanValue(
                    email.notifyAtDue,
                    current.email.notifyAtDue
                ),
                testReceiverEmail: toText(
                    email.testReceiverEmail,
                    current.email.testReceiverEmail
                ).toLowerCase(),
            },
            backup: {
                backupFrequency: toText(
                    backup.backupFrequency,
                    current.backup.backupFrequency
                ),
                cloudProvider: toText(
                    backup.cloudProvider,
                    current.backup.cloudProvider
                ),
            },
        };

        if (!next.judge.serverUrl) {
            throw new Error("URL server chấm bài không được để trống");
        }

        if (next.email.enabled) {
            if (!next.email.smtpHost) {
                throw new Error("SMTP host không được để trống khi bật email");
            }

            if (!next.email.smtpUser) {
                throw new Error("SMTP username không được để trống khi bật email");
            }

            if (!next.email.smtpPass) {
                throw new Error("Bạn cần nhập App Password SMTP để gửi email");
            }

            if (!next.email.senderEmail || !isValidEmail(next.email.senderEmail)) {
                throw new Error("Email người gửi không hợp lệ");
            }
        }

        if (next.email.testReceiverEmail && !isValidEmail(next.email.testReceiverEmail)) {
            throw new Error("Email nhận thử không hợp lệ");
        }

        const updated = await SystemConfig.findOneAndUpdate(
            { key: "default" },
            {
                $set: {
                    key: "default",
                    ...next,
                },
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
            }
        ).lean();

        return toPublicConfig(asObject(updated));
    },
};
