"use client";

type FileUploadBoxProps = {
    selectedFile: File | null;
    onFileSelect: (file: File | null) => void;
    disabled?: boolean;
};

export default function FileUploadBox({
    selectedFile,
    onFileSelect,
    disabled = false,
}: FileUploadBoxProps) {
    return (
        <div>
            <label
                className={`block cursor-pointer rounded-2xl border-2 border-dashed px-4 py-8 text-center text-xs transition ${
                    disabled
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        : "border-blue-200 bg-blue-50/40 text-slate-600 hover:border-blue-400 hover:bg-blue-50/60"
                }`}
            >
                <span className="material-symbols-outlined mb-2 block text-4xl text-blue-600">
                    android
                </span>
                <span className="block font-bold text-[#172033] text-sm">
                    {selectedFile ? selectedFile.name : "Tải lên file APK hoặc ZIP mã nguồn"}
                </span>
                <span className="mt-1 block text-[11px] text-[#4A5568]">
                    Kéo thả file vào đây hoặc bấm để duyệt từ máy tính (Hỗ trợ .apk, .zip, tối đa 100MB)
                </span>
                <input
                    type="file"
                    accept=".apk,.zip,application/vnd.android.package-archive,application/zip"
                    disabled={disabled}
                    onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        onFileSelect(file);
                    }}
                    className="hidden"
                />
            </label>

            {selectedFile && (
                <div className="mt-2.5 flex items-center justify-between rounded-xl border border-blue-200/80 bg-blue-50 px-3.5 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-blue-600 text-[18px] shrink-0">check_circle</span>
                        <span className="text-xs font-semibold text-[#172033] truncate max-w-[200px] sm:max-w-xs">
                            {selectedFile.name}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                            ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => onFileSelect(null)}
                        className="text-red-600 hover:text-red-700 text-xs font-semibold ml-2 shrink-0"
                    >
                        Xóa
                    </button>
                </div>
            )}
        </div>
    );
}
