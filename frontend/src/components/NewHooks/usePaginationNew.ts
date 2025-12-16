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
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) end = 4;
    if (currentPage >= totalPages - 2) start = totalPages - 3;

    if (start > 2) pages.push("...");

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) pages.push("...");

    pages.push(totalPages);

    return pages;
  }, [totalPages, currentPage, maxVisiblePages]);

  return pageNumbers;
}
