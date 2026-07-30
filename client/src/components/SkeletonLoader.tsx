// ============ SKELETON LOADER COMPONENT ============

export function TableSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 p-4 bg-slate-100 rounded-lg animate-pulse">
          <div className="h-12 w-12 bg-slate-300 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-300 rounded w-3/4"></div>
            <div className="h-4 bg-slate-300 rounded w-1/2"></div>
          </div>
          <div className="h-12 w-24 bg-slate-300 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md animate-pulse space-y-4">
      <div className="h-6 bg-slate-300 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-300 rounded"></div>
        <div className="h-4 bg-slate-300 rounded w-5/6"></div>
        <div className="h-4 bg-slate-300 rounded w-4/6"></div>
      </div>
      <div className="h-10 bg-slate-300 rounded w-full"></div>
    </div>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-md animate-pulse space-y-4">
          <div className="h-40 bg-slate-300 rounded"></div>
          <div className="h-6 bg-slate-300 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-300 rounded"></div>
            <div className="h-4 bg-slate-300 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 bg-white p-8 rounded-lg">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-slate-300 rounded w-1/4"></div>
          <div className="h-10 bg-slate-300 rounded"></div>
        </div>
      ))}
      <div className="h-12 bg-slate-300 rounded w-full"></div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="min-h-[80vh] bg-slate-100 animate-pulse flex items-center">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="h-16 bg-slate-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-300 rounded"></div>
              <div className="h-4 bg-slate-300 rounded w-5/6"></div>
              <div className="h-4 bg-slate-300 rounded w-4/6"></div>
            </div>
            <div className="h-12 bg-slate-300 rounded w-1/2"></div>
          </div>
          <div className="h-96 bg-slate-300 rounded hidden lg:block"></div>
        </div>
      </div>
    </div>
  );
}
