import { NextRequest, NextResponse } from "next/server";
import { getActorIdFromRequest } from "@/lib/current-user";
import {
    addStudentToClass,
    getStudentsInClass,
    joinClassByCode,
    removeStudentFromClass,
    updateStudentInClass,
} from "@/services/classroom_student.service";

function handleError(error: unknown) {
    const statusCode =
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        typeof (error as any).statusCode === "number"
            ? (error as any).statusCode
            : 500;

    const message =
        error instanceof Error ? error.message : "Đã có lỗi xảy ra";

    return NextResponse.json(
        {
            success: false,
            message,
        },
        {
            status: statusCode,
        }
    );
}

export async function joinClassController(request: NextRequest) {
    try {
        const actorId = await getActorIdFromRequest(request);
        const body = await request.json().catch(() => ({}));
        const data = await joinClassByCode(actorId, body);

        return NextResponse.json({
            success: true,
            ...data,
        });
    } catch (error) {
        return handleError(error);
    }
}

export async function getStudentsController(
    request: NextRequest,
    classroomId: string
) {
    try {
        const actorId = await getActorIdFromRequest(request);

        const mode = request.nextUrl.searchParams.get("mode");
        const status = request.nextUrl.searchParams.get("status");
        const keyword = request.nextUrl.searchParams.get("keyword");

        const data = await getStudentsInClass(actorId, classroomId, {
            mode,
            status,
            keyword,
        });

        return NextResponse.json({
            success: true,
            ...data,
        });
    } catch (error) {
        return handleError(error);
    }
}

export async function addStudentController(
    request: NextRequest,
    classroomId: string
) {
    try {
        const actorId = await getActorIdFromRequest(request);
        const body = await request.json().catch(() => ({}));
        const data = await addStudentToClass(actorId, classroomId, body);

        return NextResponse.json({
            success: true,
            ...data,
        });
    } catch (error) {
        return handleError(error);
    }
}

export async function updateStudentController(
    request: NextRequest,
    classroomId: string,
    studentId: string
) {
    try {
        const actorId = await getActorIdFromRequest(request);
        const body = await request.json().catch(() => ({}));

        const data = await updateStudentInClass(
            actorId,
            classroomId,
            studentId,
            body
        );

        return NextResponse.json({
            success: true,
            ...data,
        });
    } catch (error) {
        return handleError(error);
    }
}

export async function deleteStudentController(
    request: NextRequest,
    classroomId: string,
    studentId: string
) {
    try {
        const actorId = await getActorIdFromRequest(request);
        const data = await removeStudentFromClass(actorId, classroomId, studentId);

        return NextResponse.json({
            success: true,
            ...data,
        });
    } catch (error) {
        return handleError(error);
    }
}