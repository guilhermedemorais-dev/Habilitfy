import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use shimmer effect instead of pulse */
  shimmer?: boolean;
}

function Skeleton({ className, shimmer = false, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-slate-200",
        shimmer ? "skeleton-shimmer" : "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

function SkeletonText({ className, shimmer = false, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "h-4 rounded bg-slate-200",
        shimmer ? "skeleton-shimmer" : "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

function SkeletonCircle({
  className,
  shimmer = false,
  size = "md",
  ...props
}: SkeletonProps & { size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-slate-200",
        sizes[size],
        shimmer ? "skeleton-shimmer" : "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

function SkeletonCard({ className, shimmer = false }: SkeletonProps) {
  return (
    <div className={cn("p-4 rounded-xl bg-white border border-slate-100 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <SkeletonCircle shimmer={shimmer} />
        <div className="flex-1 space-y-2">
          <SkeletonText shimmer={shimmer} className="w-3/4" />
          <SkeletonText shimmer={shimmer} className="w-1/2 h-3" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonText shimmer={shimmer} />
        <SkeletonText shimmer={shimmer} className="w-5/6" />
      </div>
    </div>
  )
}

function SkeletonList({
  count = 3,
  className,
  shimmer = false
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white">
          <SkeletonCircle size="sm" shimmer={shimmer} />
          <div className="flex-1 space-y-2">
            <SkeletonText shimmer={shimmer} className="w-3/4" />
            <SkeletonText shimmer={shimmer} className="w-1/2 h-3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCircle, SkeletonCard, SkeletonList }

