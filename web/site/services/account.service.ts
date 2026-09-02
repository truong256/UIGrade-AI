import type {
    ChangePasswordPayload,
    CurrentUser,
    EditProfilePayload,
    NotificationSettingsPayload,
} from "@/app/ui/account/type/account.types";

async function parseJsonSafe(response: Response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const response = await fetch(input, {
        cache: "no-store",
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
        },
    });

    const json = await parseJsonSafe(response);

    if (!response.ok) {
        throw new Error((json as { message?: string }).message || "Không thể xử lý yêu cầu");
    }

    return json as T;
}

export const accountService = {
    async getProfile() {
        return request<{ user: CurrentUser }>("/api/account/profile", {
            method: "GET",
        });
    },

    async updateProfile(payload: EditProfilePayload) {
        return request<{ message: string; user: CurrentUser }>("/api/account/profile", {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
    },

    async updatePreferences(payload: NotificationSettingsPayload) {
        return request<{ message: string; notificationSettings: NotificationSettingsPayload }>(
            "/api/account/preferences",
            {
                method: "PATCH",
                body: JSON.stringify(payload),
            }
        );
    },

    async changePassword(payload: ChangePasswordPayload) {
        return request<{ message: string }>("/api/account/password", {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
    },
};