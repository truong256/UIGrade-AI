import type { AssignmentItem, SubmitAction } from "@/app/ui/submit_assignment/type/submit_assignment.type";
import { AssignmentDetails } from "./AssignmentDetails";
import { AssignmentSelector } from "./AssignmentSelector";
import { SubmissionForm } from "./SubmissionForm";

type Props = {
    assignments: AssignmentItem[];
    selectedId: string;
    selectedAssignment: AssignmentItem | null;
    loading: boolean;
    files: File[];
    repositoryUrl: string;
    note: string;
    submitting: boolean;
    canSubmit: boolean;
    onSelectAssignment: (id: string) => void;
    onFilesChange: (files: FileList | File[]) => void;
    onRemoveFile: (index: number) => void;
    onRepositoryUrlChange: (value: string) => void;
    onNoteChange: (value: string) => void;
    onSubmit: (action: SubmitAction) => void;
};

export function AssignmentSubmitPanel({
                                          assignments,
                                          selectedId,
                                          selectedAssignment,
                                          loading,
                                          files,
                                          repositoryUrl,
                                          note,
                                          submitting,
                                          canSubmit,
                                          onSelectAssignment,
                                          onFilesChange,
                                          onRemoveFile,
                                          onRepositoryUrlChange,
                                          onNoteChange,
                                          onSubmit,
                                      }: Props) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <AssignmentSelector
                assignments={assignments}
                selectedId={selectedId}
                selectedAssignment={selectedAssignment}
                loading={loading}
                onSelect={onSelectAssignment}
            />

            {loading ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-slate-500">
                    Đang tải dữ liệu bài tập...
                </div>
            ) : selectedAssignment ? (
                <div className="space-y-6">
                    <AssignmentDetails assignment={selectedAssignment} />
                    <SubmissionForm
                        assignment={selectedAssignment}
                        files={files}
                        repositoryUrl={repositoryUrl}
                        note={note}
                        submitting={submitting}
                        canSubmit={canSubmit}
                        onFilesChange={onFilesChange}
                        onRemoveFile={onRemoveFile}
                        onRepositoryUrlChange={onRepositoryUrlChange}
                        onNoteChange={onNoteChange}
                        onSubmit={onSubmit}
                    />
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-slate-500">
                    Chưa có bài tập nào bạn có thể nộp ở thời điểm hiện tại.
                </div>
            )}
        </section>
    );
}
