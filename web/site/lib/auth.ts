import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    throw new Error("Thiếu JWT_SECRET trong file .env.local");
}

export type TokenPayload = {
    userId: string;
    email: string;
    role: string;
    studentCode?: string;
};

export function signToken(payload: TokenPayload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: "7d",
    });
}

export function verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export const authCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
};