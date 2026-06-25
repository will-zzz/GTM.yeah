interface Props {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaginationBar({
  rangeStart,
  rangeEnd,
  total,
  page,
  totalPages,
  onPageChange,
}: Props) {
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-zinc-200 bg-zinc-50/80 text-xs text-zinc-500">
      <span>
        Showing {rangeStart}–{rangeEnd} of {total} entries
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-sm border border-zinc-200 bg-white px-2.5 py-1 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Prev
        </button>
        <span className="px-2 tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-sm border border-zinc-200 bg-white px-2.5 py-1 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
