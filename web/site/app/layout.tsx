import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
    subsets: ["latin", "vietnamese"],
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
        <html lang="vi">
        <head>
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
            />
        </head>
        <body className={`${publicSans.className} bg-[#F0F9FF] text-[#0F172A] antialiased selection:bg-sky-200 selection:text-sky-900`}>
        {children}
        </body>
        </html>
    );
}