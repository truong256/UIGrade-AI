
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { promises as fsp } from "fs";
import sharp from "sharp";
import Assignment from "@/models/Assignment.model";
import "@/lib/mongodb";

function publicUrlToPath(url: string) {
    if (url.startsWith("/")) {
        return path.join(process.cwd(), "public", url.replace(/^\//, ""));
    }

    return path.join(process.cwd(), "public", url);
}

function safeName(value: string) {
    return value.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const body = await request.json();

    const sourceImageUrl = String(body.sourceImageUrl || "").trim();
    const screenKey = safeName(String(body.screenKey || "").trim());
    const label = String(body.label || screenKey).trim();

    const crop = body.crop || {};
    const x = Math.round(Number(crop.x || 0));
    const y = Math.round(Number(crop.y || 0));
    const width = Math.round(Number(crop.width || 0));
    const height = Math.round(Number(crop.height || 0));

    if (!sourceImageUrl || !screenKey || width <= 0 || height <= 0) {
        return NextResponse.json(
            {
                error: "Thiếu sourceImageUrl, screenKey hoặc vùng crop không hợp lệ.",
            },
            { status: 400 }
        );
    }

    const inputPath = publicUrlToPath(sourceImageUrl);

    if (!fs.existsSync(inputPath)) {
        return NextResponse.json(
            {
                error: "Không tìm thấy ảnh đề tổng để crop.",
            },
            { status: 404 }
        );
    }

    const outputDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "assignments",
        "ui-baselines",
        id
    );

    await fsp.mkdir(outputDir, { recursive: true });

    const fileName = `${screenKey}.png`;
    const outputPath = path.join(outputDir, fileName);
    const outputUrl = `/uploads/assignments/ui-baselines/${id}/${fileName}`;

    await sharp(inputPath)
        .extract({
            left: x,
            top: y,
            width,
            height,
        })
        .png()
        .toFile(outputPath);

    const assignment = await Assignment.findById(id);

    if (!assignment) {
        return NextResponse.json(
            {
                error: "Không tìm thấy bài tập.",
            },
            { status: 404 }
        );
    }

    const uiScreens = Array.isArray(assignment.runnerConfig?.uiScreens)
        ? assignment.runnerConfig.uiScreens
        : [];

    const oldScreen = uiScreens.find((item: any) => item.screenKey === screenKey);
    const nextUiScreens = [
        ...uiScreens.filter((item: any) => item.screenKey !== screenKey),
        {
            screenKey,
            label,
            baselineUrl: outputUrl,
            threshold: Number(oldScreen?.threshold || 70),
        },
    ];

    assignment.runnerConfig = {
        ...(assignment.runnerConfig?.toObject?.() || assignment.runnerConfig || {}),
        uiScreens: nextUiScreens,
    };

    const attachments = Array.isArray(assignment.attachments)
        ? assignment.attachments
        : [];

    assignment.attachments = [
        ...attachments.filter((item: any) => item.originalName !== `${screenKey}.png`),
        {
            kind: "template",
            originalName: `${screenKey}.png`,
            storedName: `${screenKey}.png`,
            url: outputUrl,
            mimeType: "image/png",
            size: fs.statSync(outputPath).size,
        },
    ];

    await assignment.save();

    return NextResponse.json({
        ok: true,
        screenKey,
        label,
        baselineUrl: outputUrl,
    });
}