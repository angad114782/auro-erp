import { useMemo } from "react";

interface UsePaginationProps {
  totalPages: number;
  currentPage: number;
  maxVisiblePages?: number;
}

export function usePagination({
  totalPages,
  currentPage,
  maxVisiblePages = 5,
}: UsePaginationProps) {
  return useMemo(() => {
    const pages: (number | "...")[] = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const half = Math.floor(maxVisiblePages / 2);

    let start = Math.max(2, currentPage - half);
    let end = Math.min(totalPages - 1, currentPage + half);

    if (currentPage <= half + 1) {
      start = 2;
      end = maxVisiblePages;
    }

    if (currentPage >= totalPages - half) {
      start = totalPages - maxVisiblePages + 1;
      end = totalPages - 1;
    }

    pages.push(1);

    if (start > 2) pages.push("...");

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) pages.push("...");

    pages.push(totalPages);

    return pages;
  }, [totalPages, currentPage, maxVisiblePages]);
}
