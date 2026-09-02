import type {
    AssignmentItem,
    AttachmentItem,
    LatestSubmission,
    RubricCriterion,
} from "./assignment_list.type";


// Kiểu dữ liệu đại diện cho một object bất kỳ.
// Ví dụ: { title: "Bài tập 1", maxScore: 10 }
// Dùng để kiểm tra dữ liệu API trả về có phải object không.
type UnknownRecord = Record<string, unknown>;


// Hàm kiểm tra một giá trị có phải object hợp lệ không.
// Vì dữ liệu từ API có kiểu unknown nên cần kiểm tra trước khi truy cập thuộc tính.
//
// Ví dụ:
// isObject({ name: "A" }) => true
// isObject(null) => false
// isObject("abc") => false
function isObject(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null;
}


// Hàm chuyển một giá trị bất kỳ về dạng string.
// Nếu value là string thì giữ nguyên.
// Nếu value là null hoặc undefined thì trả về fallback.
// Nếu value là number/boolean thì ép sang string.
//
// Ví dụ:
// toText("abc") => "abc"
// toText(null) => ""
// toText(123) => "123"
function toText(value: unknown, fallback = ""): string {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return fallback;
    return String(value);
}


// Hàm chuyển một giá trị bất kỳ về number.
// Nếu không chuyển được sang số hợp lệ thì dùng fallback.
//
// Ví dụ:
// toNumberValue("10") => 10
// toNumberValue(5) => 5
// toNumberValue("abc", 0) => 0
function toNumberValue(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}


// Hàm chuẩn hóa dữ liệu file đính kèm từ API.
// Vì API có thể trả về thiếu field hoặc sai kiểu,
// hàm này đảm bảo kết quả luôn đúng theo type AttachmentItem.
//
// AttachmentItem gồm:
// - url: đường dẫn file
// - originalName: tên file gốc
// - kind: loại file, ví dụ resource/rubric/template
function normalizeAttachment(value: unknown): AttachmentItem {
    const item = isObject(value) ? value : {};

    return {
        url: toText(item.url),
        originalName: toText(item.originalName),
        kind: toText(item.kind, "resource"),
    };
}


// Hàm chuẩn hóa một tiêu chí rubric.
// Rubric là thang điểm/chấm điểm của bài tập.
//
// RubricCriterion gồm:
// - code: mã tiêu chí
// - title: tên tiêu chí
// - maxPoints: điểm tối đa
// - gradingSource: nguồn chấm, ví dụ manual/ai/test
function normalizeRubric(value: unknown): RubricCriterion {
    const item = isObject(value) ? value : {};

    return {
        code: toText(item.code),
        title: toText(item.title),
        maxPoints: toNumberValue(item.maxPoints, 0),
        gradingSource: toText(item.gradingSource, "manual"),
    };
}


// Hàm chuẩn hóa thông tin bài nộp gần nhất của sinh viên.
// Nếu dữ liệu không phải object thì trả về null.
// Dùng cho cột "Bài nộp gần nhất" trong bảng danh sách bài tập.
//
// LatestSubmission gồm:
// - _id: id bài nộp
// - attemptNo: lần nộp thứ mấy
// - status: trạng thái nộp
// - finalScore: điểm cuối cùng
// - gradeStatus: trạng thái chấm điểm
function normalizeLatestSubmission(value: unknown): LatestSubmission | null {
    if (!isObject(value)) {
        return null;
    }

    return {
        _id: toText(value._id),
        attemptNo: toNumberValue(value.attemptNo, 1),
        status: toText(value.status),
        finalScore:
            value.finalScore === null || value.finalScore === undefined
                ? null
                : toNumberValue(value.finalScore, 0),
        gradeStatus: toText(value.gradeStatus),
    };
}


// Hàm quan trọng nhất trong file này.
// Dùng để chuẩn hóa toàn bộ dữ liệu bài tập lấy từ API.
//
// Lý do cần hàm này:
// API trả về dữ liệu có thể thiếu field, sai kiểu, hoặc classroom/teacher có dạng khác nhau.
// Hàm này giúp dữ liệu sau khi nhận về luôn có cấu trúc ổn định,
// tránh lỗi khi render giao diện.
export function normalizeAssignment(raw: unknown): AssignmentItem {
    // Kiểm tra dữ liệu raw có phải object không.
    // Nếu không phải object thì dùng object rỗng để tránh lỗi.
    const source = isObject(raw) ? raw : {};

    // classroom có thể được API trả về dưới tên classroom hoặc classroomId.
    // Vì vậy dùng toán tử ?? để lấy dữ liệu phù hợp.
    const classroomRaw = source.classroom ?? source.classroomId ?? null;

    // teacher cũng có thể được API trả về dưới tên teacher hoặc teacherId.
    const teacherRaw = source.teacher ?? source.teacherId ?? null;

    // Chuẩn hóa thông tin lớp học.
    // Nếu classroomRaw là object thì lấy _id, name, code.
    // Nếu không có thì classroom = null.
    const classroom = isObject(classroomRaw)
        ? {
            _id: toText(classroomRaw._id),
            name: toText(classroomRaw.name),
            code: toText(classroomRaw.code),
        }
        : null;

    // Chuẩn hóa thông tin giảng viên.
    // Nếu teacherRaw là object thì lấy _id, name, email.
    // Nếu không có thì teacher = null.
    const teacher = isObject(teacherRaw)
        ? {
            _id: toText(teacherRaw._id),
            name: toText(teacherRaw.name),
            email: toText(teacherRaw.email),
        }
        : null;

    // Trả về object AssignmentItem đã được chuẩn hóa đầy đủ.
    return {
        // ID bài tập.
        _id: toText(source._id),

        // Tên bài tập.
        title: toText(source.title),

        // Mô tả bài tập.
        description: toText(source.description),

        // Hạn nộp.
        // Chỉ nhận nếu dueAt là string, nếu không thì undefined.
        dueAt: typeof source.dueAt === "string" ? source.dueAt : undefined,

        // Ngày bắt đầu/giao bài.
        startAt: typeof source.startAt === "string" ? source.startAt : undefined,

        // Trạng thái thật trong database.
        // Chỉ chấp nhận 3 giá trị: draft, published, closed.
        // Nếu API trả về sai thì mặc định là published.
        status:
            source.status === "draft" ||
            source.status === "published" ||
            source.status === "closed"
                ? source.status
                : "published",

        // Trạng thái dùng để hiển thị ra giao diện.
        // Ưu tiên displayStatus nếu có.
        // Nếu không có thì dùng status.
        // Nếu cả hai đều sai thì mặc định là published.
        displayStatus:
            source.displayStatus === "draft" ||
            source.displayStatus === "published" ||
            source.displayStatus === "closed"
                ? source.displayStatus
                : source.status === "draft" ||
                source.status === "published" ||
                source.status === "closed"
                    ? source.status
                    : "published",

        // Điểm tối đa của bài tập.
        // Nếu API không trả về thì mặc định là 10.
        maxScore: toNumberValue(source.maxScore, 10),

        // Có cho phép nộp trễ hay không.
        allowLateSubmit: Boolean(source.allowLateSubmit),

        // Có cho phép nộp lại hay không.
        allowResubmit: Boolean(source.allowResubmit),

        // Phần trăm trừ điểm nếu nộp trễ.
        latePenaltyPercent: toNumberValue(source.latePenaltyPercent, 0),

        // Ngôn ngữ lập trình của bài tập.
        // Nếu không có thì mặc định là cpp.
        language: toText(source.language, "cpp"),

        // Rubric dạng text.
        rubricText: toText(source.rubricText),

        // Rubric dạng cấu trúc.
        // Nếu source.rubric là array thì chuẩn hóa từng tiêu chí.
        // Nếu không phải array thì trả về mảng rỗng.
        rubric: Array.isArray(source.rubric)
            ? source.rubric.map(normalizeRubric)
            : [],

        // Thông tin lớp học đã chuẩn hóa ở trên.
        classroom,

        // Thông tin giảng viên đã chuẩn hóa ở trên.
        teacher,

        // Danh sách file đính kèm.
        // Nếu attachments là array thì chuẩn hóa từng file.
        // Nếu không có thì trả về mảng rỗng.
        attachments: Array.isArray(source.attachments)
            ? source.attachments.map(normalizeAttachment)
            : [],

        // Ngày tạo bài tập.
        createdAt: typeof source.createdAt === "string" ? source.createdAt : undefined,

        // Bài nộp gần nhất của sinh viên.
        latestSubmission: normalizeLatestSubmission(source.latestSubmission),
    };
}


// Hàm format ngày để hiển thị ra giao diện.
// Input thường là chuỗi ISO Date từ database.
// Output dạng ngày Việt Nam: dd/mm/yyyy.
//
// Ví dụ:
// 2026-05-01T10:00:00.000Z => 01/05/2026
export function formatDate(value?: string) {
    // Nếu không có ngày thì hiển thị mặc định.
    if (!value) return "--/--/----";

    const date = new Date(value);

    // Nếu ngày không hợp lệ thì hiển thị mặc định.
    if (Number.isNaN(date.getTime())) return "--/--/----";

    // Format ngày theo chuẩn Việt Nam.
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}


// Hàm chuyển ngày từ API sang định dạng dùng cho input type="datetime-local".
//
// input datetime-local yêu cầu dạng:
// yyyy-MM-ddTHH:mm
//
// Ví dụ:
// 2026-05-01T10:30:00.000Z
// sẽ được chuyển thành:
// 2026-05-01T10:30
export function formatDateTimeInput(value?: string) {
    // Nếu không có dữ liệu thì trả về chuỗi rỗng để input không bị lỗi.
    if (!value) return "";

    const date = new Date(value);

    // Nếu ngày không hợp lệ thì trả về chuỗi rỗng.
    if (Number.isNaN(date.getTime())) return "";

    // Hàm thêm số 0 phía trước nếu số nhỏ hơn 10.
    // Ví dụ: 5 => "05"
    const pad = (n: number) => String(n).padStart(2, "0");

    // Trả về đúng format mà input datetime-local cần.
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}


// Hàm lấy chữ hiển thị cho trạng thái bài tập.
//
// draft     => Bản nháp
// closed    => Đã đóng
// published => Đang mở
export function getStatusLabel(status: AssignmentItem["displayStatus"]) {
    if (status === "draft") return "Bản nháp";
    if (status === "closed") return "Đã đóng";
    return "Đang mở";
}


// Hàm trả về class Tailwind CSS tương ứng với từng trạng thái.
// Dùng để đổi màu badge trạng thái trong bảng.
//
// draft:
// màu vàng/cam
//
// closed:
// màu xám
//
// published:
// màu xanh
export function getStatusClasses(status: AssignmentItem["displayStatus"]) {
    if (status === "draft") {
        return "bg-amber-50 text-amber-700 border-amber-200";
    }

    if (status === "closed") {
        return "bg-slate-100 text-slate-700 border-slate-200";
    }

    return "bg-green-50 text-green-700 border-green-200";
}