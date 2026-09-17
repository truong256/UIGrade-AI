// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { SubmissionStatusBadge } from "@/components/shared/StatusBadge";

type ActivityStatusProps = {
    status: string;
};

export default function ActivityStatus({ status }: ActivityStatusProps) {
    return <SubmissionStatusBadge status={status} />;
}
