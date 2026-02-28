'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { search as searchAPI } from '@/lib/api';
import { usePlayerStore, Song } from '@/store/playerStore';
import SongCard from '@/components/cards/SongCard';
import { CardGridSkeleton } from '@/components/skeletons/Skeletons';

const genres = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country', 'Folk', 'Indie', 'Metal', 'Blues'];
const genreColors = [
    'from-pink-500 to-rose-600',
    'from-red-500 to-orange-600',
    'from-yellow-500 to-amber-600',
    'from-blue-500 to-purple-600',
    'from-indigo-500 to-blue-600',
    'from-purple-500 to-pink-600',
    'from-teal-500 to-cyan-600',
    'from-orange-500 to-red-600',
    'from-green-500 to-teal-600',
    'from-violet-500 to-indigo-600',
    'from-gray-500 to-zinc-600',
    'from-cyan-500 to-blue-600',
];

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ songs: Song[]; artists: any[] } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults(null);
            return;
        }
        setLoading(true);
        try {
            const res = await searchAPI(q);
            setResults(res.data || { songs: [], artists: [] });
        } catch {
            setResults({ songs: [], artists: [] });
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => handleSearch(query), 400);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    return (
        <div className="p-6 lg:p-8">
            {/* Search Bar */}
            <div className="max-w-xl mb-8">
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-300" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="What do you want to listen to?"
                        className="w-full bg-dark-600 rounded-full py-3 pl-12 pr-10 text-white placeholder-dark-300
                       focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Results */}
            {query ? (
                <div>
                    <h2 className="text-2xl font-bold mb-5">
                        {loading ? 'Searching...' : `Results for "${query}"`}
                    </h2>

                    {loading ? (
                        <CardGridSkeleton />
                    ) : results ? (
                        <>
                            {/* Songs */}
                            {results.songs?.length > 0 && (
                                <section className="mb-8">
                                    <h3 className="text-lg font-semibold mb-4 text-dark-300">Songs</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                                        {results.songs.map((song, i) => (
                                            <SongCard key={song.id || i} song={song} songs={results.songs} index={i} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Artists */}
                            {results.artists?.length > 0 && (
                                <section className="mb-8">
                                    <h3 className="text-lg font-semibold mb-4 text-dark-300">Artists</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {results.artists.map((artist: any) => (
                                            <div key={artist.uid} className="card-spotify text-center">
                                                <div className="w-32 h-32 mx-auto rounded-full bg-dark-600 overflow-hidden mb-4">
                                                    {artist.photoURL ? (
                                                        <img src={artist.photoURL} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-3xl">🎤</div>
                                                    )}
                                                </div>
                                                <h4 className="font-bold">{artist.displayName}</h4>
                                                <p className="text-xs text-dark-300 mt-1">Artist</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {(results.songs?.length === 0 && results.artists?.length === 0) && (
                                <p className="text-dark-300 text-center py-12">No results found for &ldquo;{query}&rdquo;</p>
                            )}
                        </>
                    ) : null}
                </div>
            ) : (
                /* Browse Genres */
                <div>
                    <h2 className="text-2xl font-bold mb-5">Browse All</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {genres.map((genre, i) => (
                            <motion.button
                                key={genre}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => setQuery(genre)}
                                className={`bg-gradient-to-br ${genreColors[i]} rounded-xl p-6 text-left h-32
                           hover:scale-105 transition-transform duration-300 relative overflow-hidden`}
                            >
                                <span className="text-xl font-bold relative z-10">{genre}</span>
                                <span className="absolute -bottom-2 -right-4 text-6xl opacity-20 rotate-12">🎵</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
