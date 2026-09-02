import { useState, type FC, type Dispatch, type SetStateAction } from "react";

type SemesterFiltersProps = {
    selectedSemester?: string;
    onSelectSemester?: (semester: string) => void;
    value?: string;
    onChange?: Dispatch<SetStateAction<string>> | ((semester: string) => void);
    availableSemesters?: string[];
};

export const SemesterFilters: FC<SemesterFiltersProps> = ({
    selectedSemester,
    onSelectSemester,
    value,
    onChange,
    availableSemesters = ["Tất cả", "HK1", "HK2", "HK3"],
}) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const currentSemester = value !== undefined ? value : (selectedSemester || "Tất cả");
    const handleSelect = (sem: string) => {
        if (onChange) {
            (onChange as (val: string) => void)(sem);
        } else if (onSelectSemester) {
            onSelectSemester(sem);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="hidden sm:flex rounded-xl border border-slate-200/80 bg-white p-1 shadow-xs">
                {availableSemesters.map((sem) => {
                    const isSelected = currentSemester === sem;
                    return (
                        <button
                            key={sem}
                            type="button"
                            onClick={() => handleSelect(sem)}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                                isSelected
                                    ? "bg-blue-600 text-white shadow-xs font-bold"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            {sem}
                        </button>
                    );
                })}
            </div>

            {/* Mobile Dropdown */}
            <div className="relative sm:hidden">
                <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex h-10 items-center justify-between gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-xs"
                >
                    <span>Học kỳ: {currentSemester}</span>
                    <span className="material-symbols-outlined text-[18px]">
                        {dropdownOpen ? "expand_less" : "expand_more"}
                    </span>
                </button>

                {dropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-xl z-20 animate-in fade-in zoom-in-95 duration-100">
                        {availableSemesters.map((sem) => (
                            <button
                                key={sem}
                                type="button"
                                onClick={() => {
                                    handleSelect(sem);
                                    setDropdownOpen(false);
                                }}
                                className={`w-full text-left rounded-lg px-3 py-2 text-xs font-medium ${
                                    currentSemester === sem ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {sem}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SemesterFilters;