'use client';

export default function SongCardSkeleton() {
    return (
        <div className="bg-dark-700 rounded-lg p-4">
            <div className="aspect-square rounded-md skeleton mb-4" />
            <div className="h-4 skeleton rounded w-3/4 mb-2" />
            <div className="h-3 skeleton rounded w-1/2" />
        </div>
    );
}

export function SongRowSkeleton() {
    return (
        <div className="flex items-center gap-4 px-4 py-2">
            <div className="w-10 h-10 skeleton rounded" />
            <div className="flex-1">
                <div className="h-4 skeleton rounded w-1/3 mb-1" />
                <div className="h-3 skeleton rounded w-1/4" />
            </div>
        </div>
    );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <SongCardSkeleton key={i} />
            ))}
        </div>
    );
}
