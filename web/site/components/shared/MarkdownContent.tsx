"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
    content?: string | null;
    className?: string;
};

export function MarkdownContent({
                                    content,
                                    className = "",
                                }: MarkdownContentProps) {
    if (!content?.trim()) {
        return <p className="text-sm text-slate-500">Chưa có nội dung.</p>;
    }

    return (
        <div
            className={[
                "max-w-none text-slate-700",
                "[&_p]:mb-3 [&_p]:leading-7",
                "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6",
                "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6",
                "[&_li]:mb-1",
                "[&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900",
                "[&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900",
                "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900",
                "[&_strong]:font-semibold [&_strong]:text-slate-900",
                "[&_code]:break-words [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.95em]",
                "[&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-slate-100",
                "[&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-4 [&_blockquote]:italic",
                className,
            ].join(" ")}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    table: ({ children }) => (
                        <div className="my-4 overflow-x-auto rounded-xl border border-slate-200">
                            <table className="min-w-full border-collapse text-sm">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-slate-50 text-slate-900">{children}</thead>
                    ),
                    th: ({ children }) => (
                        <th className="border border-slate-200 px-3 py-2 text-left font-semibold">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-slate-200 px-3 py-2 align-top">
                            {children}
                        </td>
                    ),
                    p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}