import { useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, fetchMyResults } from "../type/my_results.api";
import type { CurrentUser, ResultItem } from "../type/my_results.type";
import { buildClassOptions, filterResults, getResultsStats } from "../type/my_results.utils";

export function useMyResults() {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [items, setItems] = useState<ResultItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [keyword, setKeyword] = useState("");
    const [classFilter, setClassFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedId, setSelectedId] = useState("");

    const isTeacherView = currentUser?.role === "teacher" || currentUser?.role === "admin";
    const canViewResults = !currentUser?.role || ["User", "admin", "teacher"].includes(currentUser.role);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const user = await fetchCurrentUser();
                setCurrentUser(user);

                if (user?.role !== "User") {
                    setItems([]);
                    setSelectedId("");
                    return;
                }

                const results = await fetchMyResults();
                setItems(results);
                setSelectedId(results[0]?._id || "");
            } catch (fetchError) {
                setError(
                    fetchError instanceof Error ? fetchError.message : "Không tải được kết quả bài tập"
                );
            } finally {
                setLoading(false);
            }
        };

        void loadData();
    }, []);

    const classOptions = useMemo(() => buildClassOptions(items), [items]);

    const filteredItems = useMemo(
        () => filterResults(items, keyword, classFilter, statusFilter),
        [items, keyword, classFilter, statusFilter]
    );

    useEffect(() => {
        if (!filteredItems.length) {
            setSelectedId("");
            return;
        }

        setSelectedId((previous) => {
            if (filteredItems.some((item) => item._id === previous)) return previous;
            return filteredItems[0]._id;
        });
    }, [filteredItems]);

    const selectedItem = useMemo(
        () => filteredItems.find((item) => item._id === selectedId) || null,
        [filteredItems, selectedId]
    );

    const stats = useMemo(() => getResultsStats(filteredItems), [filteredItems]);

    return {
        currentUser,
        loading,
        error,
        keyword,
        classFilter,
        statusFilter,
        selectedId,
        filteredItems,
        selectedItem,
        classOptions,
        stats,
        isTeacherView,
        canViewResults,
        setKeyword,
        setClassFilter,
        setStatusFilter,
        setSelectedId,
    };
}
