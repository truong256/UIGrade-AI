import type { DashboardData } from "@/app/ui/dashboard/type/dashboard.type";
import AverageScoreByClassChart from "./AverageScoreByClassChart";
import SubmissionsByDayChart from "./SubmissionsByDayChart";

type DashboardChartsProps = {
    data: DashboardData;
};

export default function DashboardCharts({ data }: DashboardChartsProps) {
    return (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SubmissionsByDayChart
                rangeDays={data.rangeDays}
                data={data.charts.submissionsByDay}
            />

            <AverageScoreByClassChart data={data.charts.averageScoreByClass} />
        </section>
    );
}
