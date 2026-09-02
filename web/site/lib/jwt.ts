import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export type AuthPayload = {
    userId: string;
    email: string;
    role: string;
};

export async function verifyAuthToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as AuthPayload;
    } catch {
        return null;
    }
}