export default function EmptyState({
                                       title,
                                       description,
                                   }: {
    title: string;
    description: string;
}) {
    return (
        <div className="flex h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-slate-300">
                dashboard
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-800">{title}</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
        </div>
    );
}
