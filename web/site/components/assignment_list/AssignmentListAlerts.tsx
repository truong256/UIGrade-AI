"use client";

type AssignmentListAlertsProps = {
    error: string;
    success: string;
};

export default function AssignmentListAlerts({
                                                 error,
                                                 success,
                                             }: AssignmentListAlertsProps) {
    return (
        <>
            {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            ) : null}

            {success ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                </div>
            ) : null}
        </>
    );
}
