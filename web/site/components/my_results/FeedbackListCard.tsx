type FeedbackListCardProps = {
    title: string;
    items: string[];
    emptyText: string;
    className: string;
};

export function FeedbackListCard({ title, items, emptyText, className }: FeedbackListCardProps) {
    return (
        <div className={`rounded-2xl border p-4 ${className}`}>
            <p className="text-xs font-bold uppercase tracking-wide">{title}</p>
            <ul className="mt-3 space-y-2 text-sm leading-6">
                {items.length ? items.map((entry) => <li key={entry}>• {entry}</li>) : <li>{emptyText}</li>}
            </ul>
        </div>
    );
}
