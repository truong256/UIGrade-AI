import "@/models/Classroom.model";
import "@/models/User.model";
import Assignment from "@/models/Assignment.model";

const ASSIGNMENT_POPULATE = [
    {
        path: "classroomId",
        select: "name code semester academicYear",
    },
    {
        path: "teacherId",
        select: "name email studentCode",
    },
];

export const assignmentRepository = {
    create(data: Record<string, unknown>) {
        return Assignment.create(data);
    },

    findById(id: string) {
        return Assignment.findById(id)
            .populate(ASSIGNMENT_POPULATE)
            .lean();
    },

    findManyByClassroomIds(
        classroomIds: string[],
        options?: { includeDraft?: boolean }
    ) {
        const filter: Record<string, unknown> = {
            classroomId: { $in: classroomIds },
        };

        if (!options?.includeDraft) {
            filter.status = { $ne: "draft" };
        }

        return Assignment.find(filter)
            .populate(ASSIGNMENT_POPULATE)
            .sort({ createdAt: -1 })
            .lean();
    },

    findByTeacherId(teacherId: string) {
        return Assignment.find({ teacherId })
            .populate(ASSIGNMENT_POPULATE)
            .sort({ createdAt: -1 })
            .lean();
    },

    updateById(id: string, data: Record<string, unknown>) {
        return Assignment.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        })
            .populate(ASSIGNMENT_POPULATE)
            .lean();
    },

    deleteById(id: string) {
        return Assignment.findByIdAndDelete(id).lean();
    },
};