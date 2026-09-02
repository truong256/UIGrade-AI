type TabItem = {
    label: string;
    active?: boolean;
};

type Props = {
    items: TabItem[];
};

export function AssignmentTabs({ items }: Props) {
    return (
        <div className="mb-6 flex overflow-x-auto whitespace-nowrap border-b border-slate-200">
            {items.map((item) => (
                <button
                    key={item.label}
                    className={`px-5 py-2.5 text-xs transition ${
                        item.active
                            ? "border-b-2 border-sky-600 font-bold text-sky-700"
                            : "border-b-2 border-transparent font-medium text-slate-500 hover:text-slate-800"
                    }`}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}