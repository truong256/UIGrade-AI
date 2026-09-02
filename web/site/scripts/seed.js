const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Tự động load .env.local nếu có
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const [key, ...rest] = trimmed.split("=");
            const val = rest.join("=").trim();
            if (!process.env[key.trim()]) {
                process.env[key.trim()] = val;
            }
        }
    }
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/uigrade";

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        studentCode: { type: String, unique: true, sparse: true },
        role: { type: String, enum: ["admin", "teacher", "User"], default: "User" },
        isActive: { type: Boolean, default: true },
        isVerified: { type: Boolean, default: true },
        avatar: { type: String, default: "" },
        notificationSettings: {
            emailAssignments: { type: Boolean, default: true },
            pushReminders: { type: Boolean, default: false },
        },
    },
    { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seed() {
    try {
        console.log("Connecting to MongoDB:", MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log("Connected successfully!");

        const defaultPassword = await bcrypt.hash("123456", 10);

        const sampleUsers = [
            {
                name: "Quản trị viên (Admin)",
                email: "admin@uigrade.edu.vn",
                password: defaultPassword,
                studentCode: "AD001",
                role: "admin",
                isActive: true,
                isVerified: true,
            },
            {
                name: "Giảng viên Nguyễn Văn A",
                email: "teacher@uigrade.edu.vn",
                password: defaultPassword,
                studentCode: "GV001",
                role: "teacher",
                isActive: true,
                isVerified: true,
            },
            {
                name: "Sinh viên Trần Văn B",
                email: "student@uigrade.edu.vn",
                password: defaultPassword,
                studentCode: "SV001",
                role: "User",
                isActive: true,
                isVerified: true,
            },
        ];

        for (const u of sampleUsers) {
            const existing = await User.findOne({ email: u.email });
            if (existing) {
                console.log(`Account ${u.email} already exists.`);
            } else {
                await User.create(u);
                console.log(`Created sample account: ${u.email} (${u.role})`);
            }
        }

        console.log("\n--- HOÀN TẤT KHỞI TẠO TÀI KHOẢN MẪU ---");
        console.log("1. Admin:   admin@uigrade.edu.vn   | Mật khẩu: 123456");
        console.log("2. Teacher: teacher@uigrade.edu.vn | Mật khẩu: 123456");
        console.log("3. Student: student@uigrade.edu.vn | Mật khẩu: 123456");
        process.exit(0);
    } catch (err) {
        console.error("Seed error:", err);
        process.exit(1);
    }
}

seed();
