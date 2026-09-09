import jwt from "jsonwebtoken";

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT legacy chưa được cấu hình");
    }
    return secret;
}

export type TokenPayload = {
    userId: string;
    email: string;
    role: string;
    studentCode?: string;
};

export function signToken(payload: TokenPayload) {
    return jwt.sign(payload, getJwtSecret(), {
        expiresIn: "7d",
    });
}

export function verifyToken(token: string) {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
}

export const authCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
};
