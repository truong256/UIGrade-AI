import Link from "next/link";

type AssignmentsHeaderData = {
  title: string;
  description: string;
};

type Props = {
  data: AssignmentsHeaderData;
};

export function AssignmentsHeader({ data }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 text-[28px]">assignment</span>
          {data.title}
        </h1>
        <p className="mt-1 text-xs text-slate-500">{data.description}</p>
      </div>

      <Link
        href="/ui/assignment_list"
        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Tạo bài tập mới
      </Link>
    </div>
  );
}