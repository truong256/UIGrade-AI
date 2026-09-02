"use client";

import { AlertMessages } from "@/components/submit_assignment/AlertMessages";
import { AssignmentSubmitPanel } from "@/components/submit_assignment/AssignmentSubmitPanel";
import { SubmitAssignmentHeader } from "@/components/submit_assignment/SubmitAssignmentHeader";
import { SubmitAssignmentSidebar } from "@/components/submit_assignment/SubmitAssignmentSidebar";
import { useSubmitAssignment } from "./hook/use_submit_assignment";

export default function SubmitAssignmentPage() {
    const submitAssignment = useSubmitAssignment();

    return (
        <div className="space-y-6">
            <SubmitAssignmentHeader />

            <AlertMessages
                error={submitAssignment.error}
                success={submitAssignment.success}
            />

            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                <AssignmentSubmitPanel
                    assignments={submitAssignment.assignments}
                    selectedId={submitAssignment.selectedId}
                    selectedAssignment={submitAssignment.selectedAssignment}
                    loading={submitAssignment.loading}
                    files={submitAssignment.files}
                    repositoryUrl={submitAssignment.repositoryUrl}
                    note={submitAssignment.note}
                    submitting={submitAssignment.submitting}
                    canSubmit={submitAssignment.canSubmit}
                    onSelectAssignment={submitAssignment.setSelectedId}
                    onFilesChange={submitAssignment.replaceFiles}
                    onRemoveFile={submitAssignment.removeSelectedFile}
                    onRepositoryUrlChange={submitAssignment.setRepositoryUrl}
                    onNoteChange={submitAssignment.setNote}
                    onSubmit={(action) => void submitAssignment.submitAssignment(action)}
                />

                <SubmitAssignmentSidebar assignment={submitAssignment.selectedAssignment} />
            </div>
        </div>
    );
}
