import mongoose, { Document, Model, Schema } from "mongoose";

/**
 * Canonical roles: "admin" | "lecturer" | "student"
 * Legacy aliases kept for backward compatibility:
 *   "teacher" → normalizes to "lecturer"
 *   "User"    → normalizes to "student"
 * Use normalizeRole() from lib/authorization.ts when reading role values.
 */
export type UserRole = "admin" | "lecturer" | "student" | "teacher" | "User";

export interface IUserNotificationSettings {
    emailAssignments: boolean;
    pushReminders: boolean;
}

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    studentCode?: string;
    role: UserRole;
    isActive: boolean;
    isVerified: boolean;
    avatar?: string;
    phone?: string;
    department?: string;
    cohort?: string;
    bio?: string;
    notificationSettings: IUserNotificationSettings;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSettingsSchema = new Schema<IUserNotificationSettings>(
    {
        emailAssignments: {
            type: Boolean,
            default: true,
        },
        pushReminders: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
);

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Tên là bắt buộc"],
            trim: true,
            minlength: [2, "Tên phải có ít nhất 2 ký tự"],
            maxlength: [50, "Tên không được vượt quá 50 ký tự"],
        },
        email: {
            type: String,
            required: [true, "Email là bắt buộc"],
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: [true, "Mật khẩu là bắt buộc"],
            minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
        },
        studentCode: {
            type: String,
            unique: true,
            required: [true, "Mã sinh viên là bắt buộc"],
            trim: true,
            uppercase: true,
            sparse: true,
        },
        role: {
            type: String,
            // Canonical values: admin, lecturer, student
            // Legacy aliases accepted: teacher (→ lecturer), User (→ student)
            enum: ["admin", "lecturer", "student", "teacher", "User"],
            default: "student",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isVerified: {
            type: Boolean,
            default: true,
        },
        avatar: {
            type: String,
            default: "",
            trim: true,
        },
        phone: {
            type: String,
            default: "",
            trim: true,
        },
        department: {
            type: String,
            default: "",
            trim: true,
        },
        cohort: {
            type: String,
            default: "",
            trim: true,
        },
        bio: {
            type: String,
            default: "",
            trim: true,
            maxlength: [300, "Giới thiệu không được vượt quá 300 ký tự"],
        },
        notificationSettings: {
            type: NotificationSettingsSchema,
            default: () => ({
                emailAssignments: true,
                pushReminders: false,
            }),
        },
        lastLoginAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ studentCode: 1 }, { unique: true, sparse: true });

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
