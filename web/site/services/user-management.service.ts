import User, {IUser, UserRole} from "@/models/User.model";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

type UserStatusFilter = "all" | "active" | "locked";
type RoleFilter = "all" | UserRole;

type ListUssersParams = {
    keyword?: string;
    roles?: RoleFilter;
    status?: UserStatusFilter;
    page?: number;
    limit?: number;
};

type CreateUserPayload = {
    name?: string;
    email?: string;
    password?: string;
    studentCode?: string;
    roles?: UserRole;
    department?:string;
    cohort?: string;
}

type UpdateUsserPayload = {
    name?: string;
    email?: string;
    studentCode?: string;
    roles?: UserRole;
    department?: string;
    cohort?: string;
    isActive?: boolean;
    password?: string;
};

function normalizeText(value: unknown, fallback= ""){
    if (typeof value === "string") return value.trim();
    if (value=== null || value === undefined) return fallback;
    return String(value).trim();
}

function normalizeEmail(value: unknown){
    return normalizeText(value).toLowerCase();
}

function normalizeRole(value : unknown){
    if (value === "admin" || value === "teacher" || value === "User" ){
        return value;
    }
    return "User";
}

function normalizePage(value: unknown, fallback: number){
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.floor(parsed);
}
function isValidEmail(value: string){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeReExp(value: string) {
    let result = "";

    for (const char of value){
        if ("\\^$.*+?()[]{}|".includes(char)){
            result += char;
            continue;
        }
        result += char;
    }
    return result;
}

function toPublicUser(user: Partial<IUser> & Record<string, any>) {
    return {
        _id: String(user._id || ""),
        name: user.name || "",
        email: user.email || "",
        studentCode: user.studentCode || "",
        role: user.role || "User",
        department: user.department || "",
        cohort: user.cohort || "",
        isVerified: Boolean(user.isVerified),
        isActive: user.isActive !== false,
        lastLoginAt: user.lastLoginAt || null,
        createdAt: user.createdAt || null,
        updatedAt: user.updatedAt || null,
    };
}

export const userManagementService = {
    async listUsers(params : ListUssersParams ={}){
        const keyword = normalizeText(params.keyword);
        const role = (params.roles || "User") as RoleFilter;
        const status = (params.status || "all") as UserStatusFilter;
        const page = normalizePage(params.page,1);
        const limit = Math.min(20,Math.max(1,normalizePage(params.limit,10)));

        const query: Record<string, any> = {};

        if (role !== "all"){
            query.role = role;
        }
        if (status === "active") {
            query.isActive = true;
        }
        if (status === "locked") {
            query.isActive = false;
        }
        if (keyword){
            const regex = new RegExp(escapeReExp(keyword),"i");
            query.$or = [
                {name : regex},
                {email : regex},
                {studentCode : regex},
                {department : regex},
                {cohort : regex},
            ];
        }
        const skip = (page - 1) * limit;

        const [users,total,totalUsers,activeUsers, lockedUsers] = await Promise.all([
            User.find(query)
                .select("name email studentCode role department cohort isVerified isActive lastLoginAt createdAt updatedAt")
                .sort({ createdAt : -1, _id : -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query),
            User.countDocuments(),
            User.countDocuments({isActive: {$ne: false}}),
            User.countDocuments({isActive: false}),
        ]);

        return{
            stats:{
                total:totalUsers,
                active: activeUsers,
                locked: lockedUsers
            },
            filters: {
                keyword,
                role,
                status,
                page,
                limit,
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1,Math.ceil(total / limit)),
            },
            users: users.map((user) => toPublicUser(user as any)),
        };
    },
    async createUser(payload: CreateUserPayload) {
        const name = normalizeText(payload.name);
        const email = normalizeEmail(payload.email);
        const password = normalizeText(payload.password);
        const role = normalizeRole(payload.roles);
        const studentCode = normalizeText(payload.studentCode).toUpperCase();
        const department = normalizeText(payload.department);
        const cohort = normalizeText(payload.cohort);

        if (!name) throw new Error("Tên người dùng không được để trống");
        if (!email || !isValidEmail(email)) throw new Error("Email không hợp lệ");
        if (password.length < 6) throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
        if (role === "User" && !studentCode) throw new Error("Mã sinh viên là bắt buộc với tài khoản sinh viên");

        const existedEmail = await  User.findOne({email}).lean();

        if (existedEmail) throw new Error("Email đã tồn tại")
        if (studentCode){
            const existedStudentCode = await User.findOne({studentCode}).lean() ;
            if (existedStudentCode) throw new Error("mã sinh viên đã tồn tại")
        }

        const hashedPassword = await await  bcrypt.hash(password, 6);

        const created = await User.create({
            name,
            email,
            password: hashedPassword,
            studentCode: studentCode || undefined,
            role,
            department,
            cohort,
            isActive: true,
            isVerified : true,
        });

        return toPublicUser(created.toObject() as any);
    },

    async updateUser(id: string,payload: UpdateUsserPayload,actorId: string){
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("ID người dùng không hợp lệ");
        }
        const existingUser  = await User.findOne({_id:id}).lean();
        if (!existingUser ) {
            throw new Error("không tìm thấy người dùng")
        }

        const name = payload.name !== undefined ? normalizeText(payload.name) : undefined;
        const email = payload.email !== undefined ? normalizeEmail(payload.email) : undefined;
        const studentCode = payload.studentCode !== undefined ? normalizeText(payload.studentCode).toUpperCase() : undefined;
        const role = payload.roles !== undefined ? normalizeText(payload.roles) : undefined;
        const department = payload.department !== undefined ? normalizeText(payload.department) : undefined;
        const cohort = payload.cohort === undefined ? undefined : payload.cohort;
        const password = payload.password !== undefined ? normalizeText(payload.password ) : undefined;
        const nextIsActive= typeof payload.isActive === "boolean"? payload.isActive: undefined

        if (name!== undefined && !name) {
            throw new Error("tên không được bỏ trống")
        }
        if (email !== undefined) {
            if (!email || !isValidEmail(email)) {
                throw new Error("email không hợp lệ")
            }
            const existedEmail = await  User.findOne({email,_id:{$ne:id}},).lean();
            if (existedEmail){
                throw new Error("email đã tồn tại")
            }
        }
        if (studentCode !== undefined && studentCode) {
            if (studentCode.length < 10) {
                throw new Error("mã sinh viên phải từ 10 ký tự trở lên")
            }
            const existedStudentCode = await User.findOne({studentCode:studentCode, _id: {$ne:id}},).lean();
            if (existedStudentCode){
                throw new Error("mã sinh viên đã tồn tại")
            }
        }

        const finalRole = role ?? existingUser.role ?? "User";
        const finalStudentCode =
            studentCode !== undefined ? (studentCode || undefined) : existingUser.studentCode;

        if (finalRole === "User" && !finalStudentCode) {
            throw new Error("Mã sinh viên là bắt buộc với tài khoản sinh viên");
        }

        if (actorId && actorId=== id && payload.isActive == false){
            throw new Error("bạn không thẻ khóa chính mình");
        }
        if (typeof nextIsActive !== "boolean"){
            throw new Error("thiếu trạng thái cập nhập")
        }

        const updateData : Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        if (studentCode !== undefined) updateData.studentCode = studentCode || undefined;
        if (department !== undefined) updateData.department = department;
        if (cohort !== undefined) updateData.cohort = cohort;
        if (typeof nextIsActive === "boolean") updateData.isActive = nextIsActive;
        if (password !== undefined && password) {
            if (password.length < 6) {
                throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
            }
            updateData.password = await bcrypt.hash(password, 6);
        }
        const updated = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .select("name email studentCode role department cohort isVerified isActive lastLoginAt createdAt updatedAt")
            .lean();

        if (!updated){
            throw new Error("không tìm thấy người dùng");
        }

        return toPublicUser(updated as any)
    },

    async deleteUser(id: string,actorId?: string){
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("ID người dùng không hợp lệ")
        }

        if (actorId && actorId=== id){
            throw new Error("bạn không thể xóa chính mình")
        }

        const deleted = await User.findByIdAndDelete(id).lean();
        if (!deleted){
            throw new Error("không tìm thấy người dùng để xóa");
        }
        return{deleted:id}
    }

}