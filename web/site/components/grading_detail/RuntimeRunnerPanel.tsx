import type { AnyObj } from "@/app/ui/grading_detail/type/grading_detail.type";
import { toText } from "@/app/ui/grading_detail/type/grading_detail.unit";

type Props = {
    detail: AnyObj | null;
};

function statusLabel(status: string) {
    if (status === "passed") return "Chạy được";
    if (status === "build_failed") return "Build thất bại";
    if (status === "install_failed") return "Không cài được APK";
    if (status === "launch_failed") return "Không mở được app";
    if (status === "screenshot_failed") return "Không chụp được giao diện";
    if (status === "comparison_failed") return "Không so sánh được giao diện";
    if (status === "project_invalid") return "Project không hợp lệ";
    if (status === "apk_missing") return "Không tìm thấy APK";
    return "Chưa chạy runtime";
}

function statusClass(status: string) {
    if (status === "passed") {
        return "border-green-200 bg-green-50 text-green-700";
    }

    if (
        status === "build_failed" ||
        status === "install_failed" ||
        status === "launch_failed" ||
        status === "screenshot_failed" ||
        status === "project_invalid" ||
        status === "apk_missing"
    ) {
        return "border-rose-200 bg-rose-50 text-rose-700";
    }

    return "border-slate-200 bg-slate-50 text-slate-600";
}

export function RuntimeRunnerPanel({ detail }: Props) {
    const runner = detail?.autoGrade?.runnerEvidence;

    if (!runner) {
        return (
            <section className="rounded-3xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-bold text-slate-900">Kết quả chạy Android thật</h3>

                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    Chưa có kết quả runner runtime.
                </div>
            </section>
        );
    }

    const runtimeStatus = toText(runner.runtimeStatus, "not_run");
    const screenshots = Array.isArray(runner.screenshots) ? runner.screenshots : [];
    const logs = Array.isArray(runner.logs) ? runner.logs : [];
    const comparison = runner.visualComparison;
    const comparisons = Array.isArray(runner.visualComparisons)
        ? runner.visualComparisons
        : comparison
            ? [comparison]
            : [];

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">
                        Kết quả chạy Android thật
                    </h3>

                    {runner.rawSummary && (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            {toText(runner.rawSummary)}
                        </p>
                    )}
                </div>

                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(runtimeStatus)}`}>
                    {statusLabel(runtimeStatus)}
                </span>
            </div>

            {runtimeStatus !== "passed" && runtimeStatus !== "not_run" && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                    {runtimeStatus === "screenshot_failed"
                        ? "App đã chạy được, nhưng kịch bản UI/testTag hoặc bước chụp giao diện bị lỗi. Giáo viên cần xem log bên dưới để biết testTag nào đang thiếu."
                        : "Bài của sinh viên chưa chạy được. Giáo viên cần xem log bên dưới để biết lỗi build, lỗi cài APK hoặc lỗi mở app."}
                </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Build</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                        {runner.buildPassed === true ? "Thành công" : runner.buildPassed === false ? "Thất bại" : "Chưa có"}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Chạy app</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                        {[
                            "screenshot_failed",
                            "comparison_failed",
                            "passed",
                        ].includes(runtimeStatus)
                            ? "Chạy được"
                            : runner.testPassed === true
                                ? "Chạy được"
                                : runner.testPassed === false
                                    ? "Không chạy được"
                                    : "Chưa có"}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Độ giống UI</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                        {runtimeStatus === "passed" &&
                        runner.visualSimilarity !== null &&
                        runner.visualSimilarity !== undefined
                            ? `${runner.visualSimilarity}%`
                            : "Chưa so sánh"}
                    </p>
                </div>
            </div>

            {screenshots.length > 0 && (
                <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-slate-900">
                        <span>Giao diện thật sinh ra từ bài sinh viên</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {screenshots.length} ảnh
            </span>
                    </summary>

                    <div className="mt-4 max-h-[620px] overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {screenshots.map((shot: AnyObj, index: number) => (
                                <div
                                    key={`${toText(shot.url)}-${index}`}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                                >
                                    <p className="mb-2 text-sm font-semibold text-slate-700">
                                        {toText(shot.label, "Screenshot")}
                                    </p>

                                    {shot.url ? (
                                        <img
                                            src={toText(shot.url)}
                                            alt={toText(shot.label, "Screenshot")}
                                            className="h-[430px] w-full rounded-xl border border-slate-200 bg-white object-contain"
                                        />
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                                            Không có URL ảnh.
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </details>
            )}

            {comparisons.length > 0 && (
                <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-slate-900">
                        <span>So sánh với giao diện chuẩn của giáo viên</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {comparisons.length} màn hình
            </span>
                    </summary>

                    <div className="mt-4 max-h-[680px] overflow-y-auto pr-2">
                        <div className="space-y-4">
                            {comparisons.map((item: AnyObj, index: number) => (
                                <div
                                    key={`${toText(item.screenKey, "screen")}-${index}`}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-bold text-slate-900">
                                                {toText(item.label, toText(item.screenKey, `Màn hình ${index + 1}`))}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-600">
                                                Độ giống:{" "}
                                                <span className="font-bold text-slate-900">
                                        {item.similarity ?? "--"}%
                                    </span>
                                            </p>
                                        </div>
                                    </div>

                                    {item.message && (
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {toText(item.message)}
                                        </p>
                                    )}

                                    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
                                        {item.baselineUrl && (
                                            <ImageBox title="Ảnh chuẩn giáo viên" url={toText(item.baselineUrl)} />
                                        )}

                                        {item.studentUrl && (
                                            <ImageBox title="Ảnh sinh viên" url={toText(item.studentUrl)} />
                                        )}

                                        {item.diffUrl && (
                                            <ImageBox title="Ảnh khác biệt" url={toText(item.diffUrl)} />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </details>
            )}

            {logs.length > 0 && (
                <details className="mt-5 rounded-2xl border border-slate-200 p-4">
                    <summary className="cursor-pointer text-sm font-bold text-slate-800">
                        Xem log kỹ thuật
                    </summary>

                    <div className="mt-4 space-y-4">
                        {logs.map((log: AnyObj, index: number) => (
                            <div key={`${toText(log.label)}-${index}`}>
                                <p className="mb-2 text-sm font-semibold text-slate-700">
                                    {toText(log.label, "Log")}
                                </p>

                                <pre className="max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                                    {toText(log.content)}
                                </pre>
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </section>
    );
}

function ImageBox({ title, url }: { title: string; url: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-700">{title}</p>

            <img
                src={url}
                alt={title}
                className="w-full rounded-xl border border-slate-200"
            />
        </div>
    );
}