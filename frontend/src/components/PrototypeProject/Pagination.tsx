import React from "react";

export default function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
}) {
  if (pages <= 1) return null;

  const prev = () => onChange(Math.max(1, page - 1));
  const next = () => onChange(Math.min(pages, page + 1));

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prev}
        className="px-3 py-1 border rounded"
        disabled={page <= 1}
      >
        Previous
      </button>
      <div className="hidden sm:flex items-center gap-1">
        {Array.from({ length: Math.min(5, pages) }).map((_, i) => {
          const pn = i + 1;
          return (
            <button
              key={pn}
              onClick={() => onChange(pn)}
              className={`px-3 py-1 border rounded ${
                pn === page ? "bg-blue-500 text-white" : ""
              }`}
            >
              {pn}
            </button>
          );
        })}
      </div>
      <button
        onClick={next}
        className="px-3 py-1 border rounded"
        disabled={page >= pages}
      >
        Next
      </button>
    </div>
  );
}
