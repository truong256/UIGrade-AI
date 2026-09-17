// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { redirect } from "next/navigation";

export default function LegacyCreateAssignmentPage() {
    redirect("/ui/create_assignment");
    return null;
}
