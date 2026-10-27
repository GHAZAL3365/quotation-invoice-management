import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  itemCount,
  itemLabel,
  loading = false,
  onPageChange,
}) {
  const pageCount = Math.max(1, Number(totalPages) || 1);
  const currentPage = Math.min(Math.max(1, Number(page) || 1), pageCount);
  const totalItems = Math.max(0, Number(total) || 0);
  const firstItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const lastItem =
    totalItems > 0 ? Math.min(firstItem + itemCount - 1, totalItems) : 0;
  const summary =
    totalItems > 0
      ? `Showing ${firstItem}–${lastItem} of ${totalItems} ${itemLabel}`
      : `0 ${itemLabel}`;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text-secondary">{summary}</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-text-primary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <span className="min-w-24 text-center text-sm text-text-secondary">
          Page {currentPage} of {pageCount}
        </span>

        <button
          type="button"
          disabled={loading || currentPage >= pageCount}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-text-primary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
