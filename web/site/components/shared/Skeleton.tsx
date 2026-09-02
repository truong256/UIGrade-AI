type SkeletonProps = {
    className?: string;
};

export function Skeleton({ className = "h-4 w-full" }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse rounded-xl bg-slate-100 ${className}`}
            aria-hidden="true"
        />
    );
}

export function CardSkeleton() {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs animate-pulse space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
        </div>
    );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-5 py-4">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}

export default Skeleton;
