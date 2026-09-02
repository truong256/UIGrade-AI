import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownBlock({
                                  content,
                                  variant = "default",
                              }: {
    content?: string;
    variant?: "default" | "rubric";
}) {
    if (!content?.trim()) {
        return <p className="text-xs text-slate-400">Chưa có nội dung.</p>;
    }

    const tableBorder =
        variant === "rubric" ? "border-blue-200" : "border-slate-200";
    const tableHead =
        variant === "rubric" ? "bg-blue-100/70 text-blue-900" : "bg-slate-100 text-slate-900";

    return (
        <div
            className={[
                "max-w-none break-words text-xs leading-6 text-slate-700",
                "[&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-slate-900",
                "[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-900",
                "[&_h3]:mb-1.5 [&_h3]:mt-2.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-900",
                "[&_p]:mb-2 [&_p]:whitespace-pre-wrap",
                "[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5",
                "[&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5",
                "[&_li]:mb-1 [&_li]:break-words",
                "[&_strong]:font-semibold [&_strong]:text-slate-900",
                "[&_code]:break-words [&_code]:rounded [&_code]:bg-blue-50 [&_code]:text-blue-700 [&_code]:px-1.5 [&_code]:py-0.5",
                "[&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-slate-100",
                "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600",
            ].join(" ")}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    table: ({ children }) => (
                        <div className={`my-3 overflow-x-auto rounded-xl border ${tableBorder}`}>
                            <table className="min-w-full border-collapse text-xs">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => <thead className={tableHead}>{children}</thead>,
                    th: ({ children }) => (
                        <th className={`border px-3 py-2 text-left font-semibold ${tableBorder}`}>
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className={`border px-3 py-2 align-top ${tableBorder}`}>
                            {children}
                        </td>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
