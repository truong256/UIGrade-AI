import type { Database, Json } from "@/types/database.types";

type BaseTables = Database["public"]["Tables"];
type BaseProfile = BaseTables["profiles"];

type ProfileWithCohort = {
    Row: BaseProfile["Row"] & { cohort: string | null };
    Insert: BaseProfile["Insert"] & { cohort?: string | null };
    Update: BaseProfile["Update"] & { cohort?: string | null };
    Relationships: BaseProfile["Relationships"];
};

type EmailNotificationLogTable = {
    Row: {
        id: string;
        unique_key: string;
        type: string;
        assignment_id: string;
        student_id: string;
        email: string;
        meta: Json;
        sent_at: string;
    };
    Insert: {
        id?: string;
        unique_key: string;
        type: string;
        assignment_id: string;
        student_id: string;
        email: string;
        meta?: Json;
        sent_at?: string;
    };
    Update: {
        id?: string;
        unique_key?: string;
        type?: string;
        assignment_id?: string;
        student_id?: string;
        email?: string;
        meta?: Json;
        sent_at?: string;
    };
    Relationships: [];
};

type RuntimeTables = Omit<BaseTables, "profiles"> & {
    profiles: ProfileWithCohort;
    email_notification_logs: EmailNotificationLogTable;
};

export type RuntimeDatabase = Omit<Database, "public"> & {
    public: Omit<Database["public"], "Tables"> & {
        Tables: RuntimeTables;
    };
};
