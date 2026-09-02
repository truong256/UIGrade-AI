import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
            />
        </head>
        <body className={`${inter.className} bg-[#F6F9FF] text-[#172033] antialiased selection:bg-blue-100 selection:text-blue-900`}>
            {children}
        </body>
        </html>
    );
}