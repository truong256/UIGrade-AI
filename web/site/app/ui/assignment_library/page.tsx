import { LibraryHeader } from "@/components/assignment_library/LibraryHeader";
import { SearchFilterBar } from "@/components/assignment_library/SearchFilterBar";
import { AssignmentTabs } from "@/components/assignment_library/AssignmentTabs";
import { AssignmentGrid } from "@/components/assignment_library/AssignmentGrid";
import { PaginationBar } from "@/components/assignment_library/PaginationBar";

import {
    assignmentItems,
    filterData,
    libraryHeaderData,
    paginationData,
    tabItems,
} from "@/lib/assignment-library-data";

export default function AssignmentLibraryPage() {
    return (
        <div className="space-y-6">
            <LibraryHeader data={libraryHeaderData} />
            <SearchFilterBar data={filterData} />
            <AssignmentTabs items={tabItems} />
            <AssignmentGrid items={assignmentItems} />
            <PaginationBar data={paginationData} />
        </div>
    );
}