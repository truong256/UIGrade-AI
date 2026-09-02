import nodemailer from "nodemailer";
import { systemConfigService } from "@/services/system-config.service";

type SendMailInput = {
    to: string;
    subject: string;
    html: string;
    text?: string;
};

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function buildFromName(name: string, email: string) {
    if (!name) return email;
    return `"${name.replace(/\"/g, "")}" <${email}>`;
}

async function getMailerConfig(allowDisabled = false) {
    const config = await systemConfigService.getInternalConfig();

    if (!allowDisabled && !config.email.enabled) {
        throw new Error("Chức năng email đang tắt");
    }

    if (!config.email.smtpHost || !config.email.smtpUser || !config.email.smtpPass) {
        throw new Error("Cấu hình SMTP chưa đầy đủ");
    }

    if (!config.email.senderEmail) {
        throw new Error("Bạn chưa cấu hình email người gửi");
    }

    return config;
}

export const emailService = {
    async verifyTransport(options?: { allowDisabled?: boolean }) {
        const config = await getMailerConfig(Boolean(options?.allowDisabled));

        const transporter = nodemailer.createTransport({
            host: config.email.smtpHost,
            port: config.email.smtpPort,
            secure: config.email.secure,
            auth: {
                user: config.email.smtpUser,
                pass: config.email.smtpPass,
            },
        });

        await transporter.verify();
        return true;
    },

    async sendMail(input: SendMailInput, options?: { allowDisabled?: boolean }) {
        const config = await getMailerConfig(Boolean(options?.allowDisabled));

        const transporter = nodemailer.createTransport({
            host: config.email.smtpHost,
            port: config.email.smtpPort,
            secure: config.email.secure,
            auth: {
                user: config.email.smtpUser,
                pass: config.email.smtpPass,
            },
        });

        return transporter.sendMail({
            from: buildFromName(config.email.senderName, config.email.senderEmail),
            to: input.to,
            subject: input.subject,
            html: input.html,
            text: input.text,
        });
    },

    async sendTestEmail(to: string) {
        const now = new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date());

        const safeTo = escapeHtml(to);

        return this.sendMail(
            {
                to,
                subject: "[AutoGrade] Kiểm tra cấu hình email thành công",
                text: `Đây là email thử từ AutoGrade. Thời gian gửi: ${now}. Người nhận: ${to}`,
                html: `
                    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:640px;margin:0 auto;padding:24px">
                        <div style="border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;background:#ffffff">
                            <div style="padding:20px 24px;background:#fff7ed;border-bottom:1px solid #fed7aa">
                                <h2 style="margin:0;color:#c2410c">Kiểm tra cấu hình email</h2>
                                <p style="margin:8px 0 0;color:#7c2d12">Nếu bạn nhận được email này, phần thông báo email đã hoạt động.</p>
                            </div>
                            <div style="padding:24px">
                                <p style="margin-top:0">Xin chào,</p>
                                <p>Đây là email thử được gửi từ hệ thống <strong>AutoGrade</strong>.</p>
                                <ul style="padding-left:18px">
                                    <li>Người nhận: <strong>${safeTo}</strong></li>
                                    <li>Thời gian gửi: <strong>${escapeHtml(now)}</strong></li>
                                </ul>
                                <p style="margin-bottom:0">Bạn có thể quay lại trang cấu hình để tiếp tục lưu thiết lập hoặc chạy nhắc hạn nộp bài.</p>
                            </div>
                        </div>
                    </div>
                `,
            },
            { allowDisabled: true }
        );
    },
};
