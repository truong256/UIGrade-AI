import type { AssignmentItem } from "@/app/ui/submit_assignment/type/submit_assignment.type";
import { AttachmentCard } from "./AttachmentCard";
import { DeadlineCard } from "./DeadlineCard";
import { LatestSubmissionCard } from "./LatestSubmissionCard";

export function SubmitAssignmentSidebar({ assignment }: { assignment: AssignmentItem | null }) {
    return (
        <div className="space-y-6">
            <DeadlineCard assignment={assignment} />
            <AttachmentCard assignment={assignment} />
            <LatestSubmissionCard assignment={assignment} />
        </div>
    );
}
