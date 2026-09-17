// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { VisitBoundary } from "@/components/auth/VisitBoundary";

const inter = Inter({
    subsets: ["latin", "vietnamese"],
    variable: "--font-inter",
    display: "swap",
});

export const metadata: Metadata = {
    title: "UIGrade AI - Hệ Thống Chấm Điểm Giao Diện Tự Động",
    description: "Nền tảng chấm điểm và phân tích giao diện Android thông minh theo chuẩn Rubric",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" className={inter.variable}>
        <head>
            {/* Preconnect for faster Google Fonts / Material Symbols resolution */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
            />
        </head>
        <body className={`${inter.className} bg-[#F6F9FF] text-[#172033] antialiased selection:bg-blue-100 selection:text-blue-900`}>
            <VisitBoundary />
            {children}
        </body>
        </html>
    );
}
