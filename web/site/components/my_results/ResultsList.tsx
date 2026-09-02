import type { ResultItem } from "@/app/ui/my_results/type/my_results.type";
import { ResultCard } from "./ResultCard";

type ResultsListProps = {
    items: ResultItem[];
    selectedId: string;
    isTeacherView: boolean;
    onSelect: (id: string) => void;
};

export function ResultsList({ items, selectedId, isTeacherView, onSelect }: ResultsListProps) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: "560px", scrollbarGutter: "stable" }}>
                {items.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
                        Chưa có bài tập nào phù hợp với bộ lọc hiện tại.
                    </div>
                ) : (
                    items.map((item) => (
                        <ResultCard
                            key={item._id}
                            item={item}
                            active={item._id === selectedId}
                            isTeacherView={isTeacherView}
                            onSelect={onSelect}
                        />
                    ))
                )}
            </div>
        </section>
    );
}
