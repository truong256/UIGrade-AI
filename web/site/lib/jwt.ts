import { jwtVerify } from "jose";

export type AuthPayload = {
    userId: string;
    email: string;
    role: string;
};

export async function verifyAuthToken(token: string) {
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) return null;
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(token, secret);
        return payload as AuthPayload;
    } catch {
        return null;
    }
}
