import { AssignmentLibraryTopBar } from "@/components/assignment_library/AssignmentLibraryTopBar";
import { LibraryHeader } from "@/components/assignment_library/LibraryHeader";
import { SearchFilterBar } from "@/components/assignment_library/SearchFilterBar";
import { AssignmentTabs } from "@/components/assignment_library/AssignmentTabs";
import { AssignmentGrid } from "@/components/assignment_library/AssignmentGrid";
import { PaginationBar } from "@/components/assignment_library/PaginationBar";
import { AssignmentLibraryFooter } from "@/components/assignment_library/AssignmentLibraryFooter";

import {
    assignmentItems,
    filterData,
    libraryHeaderData,
    paginationData,
    tabItems,
} from "@/lib/assignment-library-data";

export default function AssignmentLibraryPage() {
    return (
        <div className="min-h-screen bg-[#f8f6f6] text-slate-900">
            <div className="flex min-h-screen flex-col">

                <main className="mx-auto w-full max-w-[1280px] px-6 py-8 lg:px-20">
                    <LibraryHeader data={libraryHeaderData} />
                    <SearchFilterBar data={filterData} />
                    <AssignmentTabs items={tabItems} />
                    <AssignmentGrid items={assignmentItems} />
                    <PaginationBar data={paginationData} />
                </main>

            </div>
        </div>
    );
}