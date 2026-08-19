import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const start = pageSize ? (page - 1) * pageSize + 1 : undefined;
  const end = pageSize && totalItems ? Math.min(page * pageSize, totalItems) : undefined;

  return (
    <div className={`flex items-center justify-between gap-4 ${className ?? ""}`}>
      <p className="text-xs text-muted-foreground">
        {start != null && end != null && totalItems != null
          ? `${start}–${end} of ${totalItems}`
          : `Page ${page} of ${totalPages}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {totalPages <= 7 ? (
          Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ))
        ) : (
          <>
            {[1, 2].map((p) => (
              <Button key={p} variant={p === page ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => onPageChange(p)}>{p}</Button>
            ))}
            {page > 3 && <span className="px-1 text-xs text-muted-foreground">…</span>}
            {page > 2 && page < totalPages - 1 && (
              <Button variant="default" size="icon" className="h-8 w-8">{page}</Button>
            )}
            {page < totalPages - 2 && <span className="px-1 text-xs text-muted-foreground">…</span>}
            {[totalPages - 1, totalPages].filter((p) => p > 2).map((p) => (
              <Button key={p} variant={p === page ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => onPageChange(p)}>{p}</Button>
            ))}
          </>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
