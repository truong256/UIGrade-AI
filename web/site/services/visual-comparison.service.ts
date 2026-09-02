import fs from "fs";
import path from "path";
import { promises as fsp } from "fs";
import sharp from "sharp";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import type { VisualComparisonResult } from "@/lib/grading-contract";

function publicUrlToAbsolutePath(url?: string | null) {
    const value = String(url || "").trim();
    if (!value) return null;

    if (value.startsWith("/")) {
        return path.join(process.cwd(), "public", value.replace(/^\//, ""));
    }

    return path.join(process.cwd(), "public", value);
}

async function normalizePng(
    inputPath: string,
    outputPath: string,
    width = 390,
    height = 844
) {
    await sharp(inputPath)
        .resize(width, height, {
            // Dùng fill để hai ảnh cùng kích thước thật, tránh tạo nhiều nền trắng giả.
            fit: "fill",
        })
        .png()
        .toFile(outputPath);
}

function isWhiteLikePixel(data: Buffer, index: number) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const a = data[index + 3];

    if (a < 20) return true;

    // Chỉ bỏ qua vùng gần như trắng tuyệt đối.
    return r >= 248 && g >= 248 && b >= 248;
}

function isContentPixel(data: Buffer, index: number) {
    return !isWhiteLikePixel(data, index);
}

function isDifferentPixel(
    baselineData: Buffer,
    studentData: Buffer,
    index: number
) {
    const dr = Math.abs(baselineData[index] - studentData[index]);
    const dg = Math.abs(baselineData[index + 1] - studentData[index + 1]);
    const db = Math.abs(baselineData[index + 2] - studentData[index + 2]);

    const avgDiff = (dr + dg + db) / 3;

    // Ngưỡng thấp hơn để chấm nghiêm hơn.
    return avgDiff > 18;
}

function calculateStrictUiSimilarity(input: {
    baselinePng: PNG;
    studentPng: PNG;
    width: number;
    height: number;
}) {
    const { baselinePng, studentPng, width, height } = input;

    let comparedPixels = 0;
    let diffPixels = 0;

    let baselineContentPixels = 0;
    let studentContentPixels = 0;

    const totalPixels = width * height;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (width * y + x) * 4;

            const baselineHasContent = isContentPixel(baselinePng.data, index);
            const studentHasContent = isContentPixel(studentPng.data, index);

            if (baselineHasContent) baselineContentPixels++;
            if (studentHasContent) studentContentPixels++;

            // Không so vùng cả hai đều gần như trắng.
            if (!baselineHasContent && !studentHasContent) {
                continue;
            }

            comparedPixels++;

            if (isDifferentPixel(baselinePng.data, studentPng.data, index)) {
                diffPixels++;
            }
        }
    }

    // Nếu vì lý do nào đó ảnh quá ít nội dung, fallback về toàn ảnh.
    if (comparedPixels < totalPixels * 0.03) {
        comparedPixels = totalPixels;
    }

    const rawDiffPercent = (diffPixels / comparedPixels) * 100;

    // Phạt thêm nếu lượng nội dung giữa ảnh chuẩn và ảnh sinh viên lệch nhau nhiều.
    const contentGapPercent =
        (Math.abs(baselineContentPixels - studentContentPixels) /
            Math.max(1, comparedPixels)) *
        100;

    const finalDiffPercent = Math.min(
        100,
        rawDiffPercent + contentGapPercent * 0.35
    );

    const similarity = Math.max(0, 100 - finalDiffPercent);

    return {
        similarity,
        diffPercent: finalDiffPercent,
        rawDiffPercent,
        contentGapPercent,
        comparedPixels,
        totalPixels,
    };
}

export async function compareStudentScreenshotWithBaseline(input: {
    studentScreenshotPath: string;
    studentScreenshotUrl?: string;
    baselineUrl?: string | null;
    outputDir: string;
}): Promise<VisualComparisonResult | null> {
    const baselinePath = publicUrlToAbsolutePath(input.baselineUrl);

    if (!baselinePath || !fs.existsSync(baselinePath)) {
        return null;
    }

    await fsp.mkdir(input.outputDir, { recursive: true });

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const normalizedStudentPath = path.join(
        input.outputDir,
        `${id}-student-normalized.png`
    );
    const normalizedBaselinePath = path.join(
        input.outputDir,
        `${id}-baseline-normalized.png`
    );
    const diffPath = path.join(input.outputDir, `${id}-diff.png`);

    const width = 390;
    const height = 844;

    await normalizePng(input.studentScreenshotPath, normalizedStudentPath, width, height);
    await normalizePng(baselinePath, normalizedBaselinePath, width, height);

    const studentPng = PNG.sync.read(await fsp.readFile(normalizedStudentPath));
    const baselinePng = PNG.sync.read(await fsp.readFile(normalizedBaselinePath));

    const diff = new PNG({ width, height });

    // Ảnh diff vẫn dùng pixelmatch để giáo viên nhìn trực quan.
    pixelmatch(
        baselinePng.data,
        studentPng.data,
        diff.data,
        width,
        height,
        {
            threshold: 0.05,
            includeAA: false,
            diffColor: [255, 0, 0],
            diffColorAlt: [255, 0, 0],
        }
    );

    await fsp.writeFile(diffPath, PNG.sync.write(diff));

    const strictScore = calculateStrictUiSimilarity({
        baselinePng,
        studentPng,
        width,
        height,
    });

    const similarity = Math.round(strictScore.similarity * 100) / 100;
    const diffPercent = Math.round(strictScore.diffPercent * 100) / 100;

    const diffFileName = path.basename(diffPath);

    return {
        similarity,
        diffPercent,
        baselineUrl: input.baselineUrl || "",
        studentUrl: input.studentScreenshotUrl || "",
        diffUrl: `/uploads/runner-artifacts/${diffFileName}`,
        message:
            similarity >= 90
                ? "Giao diện sinh viên rất giống ảnh chuẩn."
                : similarity >= 75
                    ? "Giao diện sinh viên giống một phần ảnh chuẩn, giáo viên nên xem ảnh khác biệt."
                    : similarity >= 55
                        ? "Giao diện sinh viên khác khá nhiều so với ảnh chuẩn."
                        : "Giao diện sinh viên khác nhiều so với ảnh chuẩn.",
    };
}