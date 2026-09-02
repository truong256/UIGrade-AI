"use client";

import { ErrorAlert } from "@/components/my_results/ErrorAlert";
import { LoadingState } from "@/components/my_results/LoadingState";
import { ResultDetailPanel } from "@/components/my_results/ResultDetailPanel";
import { ResultsFilters } from "@/components/my_results/ResultsFilters";
import { ResultsHeader } from "@/components/my_results/ResultsHeader";
import { ResultsList } from "@/components/my_results/ResultsList";
import { StatsCards } from "@/components/my_results/StatsCards";
import { UnauthorizedState } from "@/components/my_results/UnauthorizedState";
import { useMyResults } from "./hook/use_my_results";

export default function MyResultsPage() {
    const {
        currentUser,
        loading,
        error,
        keyword,
        classFilter,
        statusFilter,
        selectedId,
        filteredItems,
        selectedItem,
        classOptions,
        stats,
        isTeacherView,
        canViewResults,
        setKeyword,
        setClassFilter,
        setStatusFilter,
        setSelectedId,
    } = useMyResults();

    if (loading) return <LoadingState />;
    if (!canViewResults) return <UnauthorizedState />;

    return (
        <div className="space-y-6">
            <ResultsHeader currentUser={currentUser} />
            <ErrorAlert message={error} />
            <StatsCards stats={stats} />

            <ResultsFilters
                keyword={keyword}
                classFilter={classFilter}
                statusFilter={statusFilter}
                classOptions={classOptions}
                onKeywordChange={setKeyword}
                onClassFilterChange={setClassFilter}
                onStatusFilterChange={setStatusFilter}
            />

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.4fr,0.95fr]">
                <ResultsList
                    items={filteredItems}
                    selectedId={selectedId}
                    isTeacherView={isTeacherView}
                    onSelect={setSelectedId}
                />
                <ResultDetailPanel item={selectedItem} />
            </div>
        </div>
    );
}
