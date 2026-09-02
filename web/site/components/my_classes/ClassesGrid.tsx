"use client";

import { useState } from "react";
import { ClassCard } from "./ClassCard";
import { ClassDetailDialog } from "./ClassDetailDialog";
import { EditClassDialog } from "./EditClassDialog";
import { Classroom } from "@/app/ui/my_classes/type/classroom.type";

type UpdateClassPayload = {
    name: string;
    code: string;
    description?: string;
    semester: "HK1" | "HK2" | "HK3";
    academicYear: string;
    status: "active" | "archived";
};

type ClassesGridProps = {
    classes: Classroom[];
    loading: boolean;
    onDelete: (id: string) => void;
    onUpdate: (id: string, payload: UpdateClassPayload) => Promise<boolean>;
    onRefresh: () => Promise<void>;
    canManageClassUI: boolean;
};

export function ClassesGrid({
                                classes,
                                loading,
                                onDelete,
                                onUpdate,
                                onRefresh,
                                canManageClassUI,
                            }: ClassesGridProps) {
    const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
    const [openDetail, setOpenDetail] = useState(false);

    const [editingClass, setEditingClass] = useState<Classroom | null>(null);
    const [openEdit, setOpenEdit] = useState(false);

    const handleOpenDetail = (classroom: Classroom) => {
        setSelectedClass(classroom);
        setOpenDetail(true);
    };

    const handleCloseDetail = () => {
        setOpenDetail(false);
        setSelectedClass(null);
    };

    const handleOpenEdit = (classroom: Classroom) => {
        setEditingClass(classroom);
        setOpenEdit(true);
    };

    const handleCloseEdit = () => {
        setOpenEdit(false);
        setEditingClass(null);
    };

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                Đang tải danh sách lớp...
            </div>
        );
    }

    if (!classes.length) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                Chưa có lớp học nào.
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {classes.map((item) => (
                    <ClassCard
                        key={item._id}
                        classroom={item}
                        onDelete={onDelete}
                        onOpenDetail={handleOpenDetail}
                        onEdit={handleOpenEdit}
                        canManageClassUI={canManageClassUI}
                    />
                ))}
            </div>

            <ClassDetailDialog
                open={openDetail}
                classroom={selectedClass}
                onClose={handleCloseDetail}
                onStudentAdded={onRefresh}
            />

            <EditClassDialog
                open={openEdit}
                classroom={editingClass}
                onClose={handleCloseEdit}
                onSubmit={onUpdate}
            />
        </>
    );
}