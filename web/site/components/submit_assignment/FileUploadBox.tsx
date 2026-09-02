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
                        : "border-sky-200 bg-sky-50/40 text-slate-600 hover:border-sky-400 hover:bg-sky-50"
                }`}
            >
                <span className="material-symbols-outlined mb-2 block text-4xl text-sky-600">
                    android
                </span>
                <span className="block font-bold text-slate-800 text-sm">
                    {selectedFile ? selectedFile.name : "Tải lên file APK hoặc ZIP mã nguồn"}
                </span>
                <span className="mt-1 block text-[11px] text-slate-500">
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
                <div className="mt-2.5 flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sky-600 text-[18px]">check_circle</span>
                        <span className="text-xs font-semibold text-sky-950 truncate max-w-[200px] sm:max-w-xs">
                            {selectedFile.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                            ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => onFileSelect(null)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold"
                    >
                        Xóa
                    </button>
                </div>
            )}
        </div>
    );
}
