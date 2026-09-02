export default function DashboardLoading() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className="h-40 animate-pulse rounded-3xl bg-slate-200/70"
                />
            ))}
        </div>
    );
}
