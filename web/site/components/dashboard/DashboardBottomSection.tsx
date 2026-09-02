import type { DashboardData } from "@/app/ui/dashboard/type/dashboard.type";
import DashboardNotifications from "./DashboardNotifications";
import RecentActivitiesTable from "./RecentActivitiesTable";

type DashboardBottomSectionProps = {
    data: DashboardData;
};

export default function DashboardBottomSection({ data }: DashboardBottomSectionProps) {
    return (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <DashboardNotifications notifications={data.notifications} />
            <RecentActivitiesTable activities={data.recentActivities} />
        </section>
    );
}
