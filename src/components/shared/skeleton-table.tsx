import { Skeleton } from "@/components/ui/skeleton";

type SkeletonTableProps = {
  rows?: number;
  columns?: number;
};

export function SkeletonTable({ rows = 6, columns = 5 }: SkeletonTableProps) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-72" />
      <div className="overflow-hidden rounded-md border">
        <div className="grid grid-cols-1 gap-3 border-b px-4 py-3 sm:grid-cols-5">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-24" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-1 gap-3 border-b px-4 py-3 last:border-b-0 sm:grid-cols-5"
          >
            {Array.from({ length: columns }).map((__, cellIndex) => (
              <Skeleton key={`${rowIndex}-${cellIndex}`} className="h-4 w-28" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
