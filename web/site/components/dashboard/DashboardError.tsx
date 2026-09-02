type DashboardErrorProps = {
    error: string;
};

export default function DashboardError({ error }: DashboardErrorProps) {
    return (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
            <div className="flex items-start gap-3">
                <span className="material-symbols-outlined">error</span>
                <div>
                    <p className="font-semibold">Không tải được dashboard</p>
                    <p className="mt-1 text-sm">{error}</p>
                </div>
            </div>
        </div>
    );
}
