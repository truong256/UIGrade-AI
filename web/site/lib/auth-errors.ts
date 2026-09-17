// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

/**
 * lib/auth-errors.ts
 *
 * Centralized mapping of authentication error codes to user-friendly Vietnamese messages.
 * Prevents exposing raw technical error codes like "oauth_failed" or "education_email_required" on the UI.
 */

export type AuthAlert = {
    title?: string;
    message: string;
};

export function getAuthErrorMessage(
    errorCode: string | null | undefined,
    customMessage?: string | null
): AuthAlert | null {
    if (!errorCode) return null;

    switch (errorCode) {
        case "education_email_required":
            return {
                title: "Tài khoản không được hỗ trợ",
                message: "UIGrade AI chỉ hỗ trợ tài khoản giáo dục. Hãy đăng nhập tài khoản Gmail .edu.vn.",
            };
        case "account_inactive":
            return {
                title: "Tài khoản tạm khóa",
                message: "Tài khoản của bạn hiện đang bị khóa hoặc chưa được kích hoạt. Vui lòng liên hệ quản trị viên.",
            };
        case "oauth_failed":
            if (customMessage && !customMessage.includes("Không thể đăng nhập Google")) {
                return { message: customMessage };
            }
            return {
                message: "Hãy đăng nhập tài khoản Gmail .edu.vn",
            };
        case "recovery_failed":
            return {
                message: customMessage || "Liên kết khôi phục mật khẩu không hợp lệ hoặc đã hết hạn.",
            };
        case "profile_unavailable":
            return {
                message: "Không thể tải thông tin hồ sơ tài khoản. Vui lòng thử lại sau.",
            };
        case "profile_creation_failed":
            return {
                message: "Không thể khởi tạo hồ sơ người dùng. Vui lòng thử lại sau.",
            };
        default:
            return {
                message: customMessage || "Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại.",
            };
    }
}
