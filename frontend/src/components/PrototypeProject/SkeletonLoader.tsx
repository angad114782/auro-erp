export default function SkeletonLoader({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse flex items-center gap-4 p-4 border rounded bg-white"
        >
          <div className="w-10 h-10 bg-gray-200 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-2 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="w-12 h-8 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}
