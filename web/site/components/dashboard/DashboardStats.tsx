import StatCard, { type StatCardProps } from "./StatCard";

type DashboardStatsProps = {
    statCards: StatCardProps[];
};

export default function DashboardStats({ statCards }: DashboardStatsProps) {
    return (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item) => (
                <StatCard key={item.title} {...item} />
            ))}
        </section>
    );
}
