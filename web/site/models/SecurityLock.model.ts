import mongoose, { Schema } from "mongoose";

export interface ISecurityLock {
    _id: string;
    owner: string;
    isLocked: boolean;
    expiresAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const SecurityLockSchema = new Schema<ISecurityLock>(
    {
        _id: { type: String, required: true },
        owner: { type: String, required: true },
        isLocked: { type: Boolean, required: true, default: false },
        expiresAt: { type: Date, required: true },
    },
    {
        timestamps: true,
        collection: "security_locks",
    }
);

// Optimize conditional lock queries
SecurityLockSchema.index({ _id: 1, expiresAt: 1, isLocked: 1 });

const SecurityLock =
    mongoose.models.SecurityLock ||
    mongoose.model<ISecurityLock>("SecurityLock", SecurityLockSchema);

export default SecurityLock;
