import crypto from "crypto";
import SecurityLock from "@/models/SecurityLock.model";
import { connectDB } from "@/lib/mongodb";

export interface DistributedLockOptions {
    leaseMs?: number; // Lock validity duration before automatic expiry (default 8000ms)
    timeoutMs?: number; // Maximum time to wait for lock acquisition (default 6000ms)
    retryIntervalMs?: number; // Time between acquisition attempts (default 50ms)
}

export const ADMIN_MUTATION_LOCK_KEY = "admin_last_admin_invariant_lock";

/**
 * Execute a callback with a cross-instance distributed lock in MongoDB.
 *
 * Guarantees that even across multiple Node.js processes, container replicas,
 * or serverless instances, privileged administrative mutations (lock, delete, demote)
 * are strictly serialized at the shared database layer.
 *
 * Features:
 *  - Atomic CAS acquisition via findOneAndUpdate
 *  - Automatic lease expiry (prevents deadlock if a process crashes)
 *  - Owner verification on release (prevents releasing a lease taken by another worker)
 *  - Exponential backoff with jitter on acquisition contention
 */
export async function withDistributedAdminLock<T>(
    lockKey: string,
    callback: () => Promise<T>,
    options: DistributedLockOptions = {}
): Promise<T> {
    const { leaseMs = 8000, timeoutMs = 6000, retryIntervalMs = 50 } = options;
    const owner = `${process.pid || 1}_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    const startTime = Date.now();

    try {
        await connectDB();
    } catch {
        // If DB is unavailable, fail-secure immediately
        throw new Error("Không thể kết nối cơ sở dữ liệu để lấy khoá quản trị phân tán");
    }

    let acquired = false;
    let attempts = 0;

    while (!acquired) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + leaseMs);

        try {
            // Atomic conditional update / upsert
            // Lock is available if:
            //  a) isLocked is false, OR
            //  b) expiresAt is in the past (lease has expired)
            const result = await SecurityLock.findOneAndUpdate(
                {
                    _id: lockKey,
                    $or: [
                        { isLocked: false },
                        { expiresAt: { $lt: now } },
                        { isLocked: { $exists: false } },
                    ],
                },
                {
                    $set: {
                        _id: lockKey,
                        owner,
                        isLocked: true,
                        expiresAt,
                    },
                },
                {
                    upsert: true,
                    new: true,
                }
            ).lean();

            if (result && (result as any).owner === owner) {
                acquired = true;
                break;
            }
        } catch (err: any) {
            // Error code 11000 = duplicate key collision during concurrent upsert
            // This is expected when multiple workers race to insert the lock document.
            if (err.code !== 11000) {
                // Non-duplicate error -> log or handle
            }
        }

        if (Date.now() - startTime > timeoutMs) {
            throw new Error(`Timeout khi chờ khoá quản trị phân tán (${lockKey})`);
        }

        attempts++;
        // Add jitter to avoid thundering herd problem
        const jitter = Math.floor(Math.random() * 20);
        const delay = Math.min(retryIntervalMs * Math.pow(1.1, attempts), 200) + jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
        // Execute critical section inside distributed lock
        return await callback();
    } finally {
        // Atomically release lock ONLY if this owner still holds it
        try {
            await SecurityLock.updateOne(
                {
                    _id: lockKey,
                    owner,
                },
                {
                    $set: {
                        isLocked: false,
                        expiresAt: new Date(0),
                    },
                }
            );
        } catch {
            // Release failed -> lease will automatically expire after leaseMs
        }
    }
}
