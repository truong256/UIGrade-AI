"use client";

import { Suspense } from "react";
import { GradingHeader } from "@/components/grading_detail/GradingHeader";
import { GradingSidebar } from "@/components/grading_detail/GradingSidebar";
import { StudentDetailPanel } from "@/components/grading_detail/StudentDetailPanel";
import { useGradingDetail } from "./hook/use_Grading_detail";

function GradingDetailContent() {
    const grading = useGradingDetail();

    return (
        <div className="flex flex-col gap-6">
            <GradingHeader
                assignment={grading.assignment}
                assignmentId={grading.assignmentId}
                assignmentOptions={grading.assignmentOptions}
                selectedSubmissionId={grading.selectedSubmissionId}
                grading={grading.grading}
                canGrade={grading.canGrade}
                aiLocked={grading.detail?.grade?.status === "published"}
                detailLoading={grading.detailLoading}
                error={grading.error}
                notice={grading.notice}
                onChangeAssignment={(nextId) => {
                    if (!nextId || nextId === grading.assignmentId) return;
                    grading.syncUrl(nextId, null, null);
                }}
                onGrade={() => void grading.handleGrade()}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <GradingSidebar
                    assignment={grading.assignment}
                    students={grading.students}
                    visibleStudents={grading.visibleStudents}
                    selectedStudentId={grading.selectedStudentId}
                    keyword={grading.keyword}
                    statusFilter={grading.statusFilter}
                    tab={grading.tab}
                    rubric={grading.rubric}
                    loading={grading.loading}
                    onKeywordChange={grading.setKeyword}
                    onStatusFilterChange={grading.setStatusFilter}
                    onTabChange={grading.setTab}
                    onSelectStudent={(student) =>
                        void grading.loadDetail(
                            grading.assignmentId,
                            student.studentId,
                            student.submissionId,
                            true
                        )
                    }
                />

                <StudentDetailPanel
                    selectedSidebar={grading.selectedSidebar}
                    selectedSubmissionId={grading.selectedSubmissionId}
                    detail={grading.detail}
                    history={grading.history}
                    selectedFile={grading.selectedFile}
                    loading={grading.loading}
                    detailLoading={grading.detailLoading}
                    maxScore={grading.maxScore}
                    canGrade={grading.canGrade}
                    rubric={grading.rubric}
                    manualScore={grading.manualScore}
                    criterionScores={grading.criterionScores}
                    criterionComments={grading.criterionComments}
                    totalScore={grading.totalScore}
                    teacherComment={grading.teacherComment}
                    saving={grading.saving}
                    publishing={grading.publishing}
                    onManualScoreChange={grading.setManualScore}
                    onCriterionScoreChange={(code, score) =>
                        grading.setCriterionScores((previous) => ({ ...previous, [code]: score }))
                    }
                    onCriterionCommentChange={(code, comment) =>
                        grading.setCriterionComments((previous) => ({ ...previous, [code]: comment }))
                    }
                    onTeacherCommentChange={grading.setTeacherComment}
                    onSaveDraft={() => void grading.handleSaveDraft()}
                    onPublish={() => void grading.handlePublish()}
                />
            </div>
        </div>
    );
}

export default function GradingDetailPage() {
    return (
        <Suspense
            fallback={
                <div className="p-6 text-slate-500">
                    Đang tải trang chấm bài...
                </div>
            }
        >
            <GradingDetailContent />
        </Suspense>
    );
}
