import { redirect } from "next/navigation";

export default function LegacyCreateAssignmentPage() {
    redirect("/ui/create_assignment");
    return null;
}
