import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages = [];
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, page + 2);
  if (page <= 3) end = Math.min(5, totalPages);
  if (page >= totalPages - 2) start = Math.max(1, totalPages - 4);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {start > 1 && (
        <>
          <PageBtn n={1} current={page} onClick={onChange} />
          {start > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}

      {pages.map((n) => (
        <PageBtn key={n} n={n} current={page} onClick={onChange} />
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="px-2 text-gray-400">...</span>
          )}
          <PageBtn n={totalPages} current={page} onClick={onChange} />
        </>
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>

      <span className="ml-3 text-sm text-gray-400">{total} kết quả</span>
    </div>
  );
}

function PageBtn({ n, current, onClick }) {
  return (
    <button
      onClick={() => onClick(n)}
      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
        ${
          n === current
            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm"
            : "border border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
    >
      {n}
    </button>
  );
}
