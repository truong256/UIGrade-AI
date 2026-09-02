type TabItem = {
    label: string;
    active?: boolean;
};

type Props = {
    items: TabItem[];
};

export function AssignmentTabs({ items }: Props) {
    return (
        <div className="mb-6 flex overflow-x-auto whitespace-nowrap border-b border-slate-200/80">
            {items.map((item) => (
                <button
                    key={item.label}
                    className={`px-4 py-2.5 text-xs transition ${
                        item.active
                            ? "border-b-2 border-blue-600 font-bold text-blue-600"
                            : "border-b-2 border-transparent font-medium text-slate-500 hover:text-slate-800"
                    }`}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}