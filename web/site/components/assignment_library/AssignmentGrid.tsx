import { AssignmentCard } from "./AssignmentCard";

type AssignmentItem = {
    title: string;
    subject: string;
    duration: string;
    status: string;
    statusClassName: string;
    gradientClassName: string;
    icon: string;
    iconColorClassName: string;
    iconBgClassName: string;
    classBadges: string[];
    classText: string;
    createdAt: string;
    actionIcon: string;
};

type Props = {
    items: AssignmentItem[];
};

export function AssignmentGrid({ items }: Props) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
                <AssignmentCard key={item.title} item={item} />
            ))}
        </div>
    );
}