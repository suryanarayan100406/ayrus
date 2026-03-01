'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { discoverJamendo } from '@/lib/api';
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

interface JamendoTrack {
    id: string;
    name: string;
    duration: number;
    artist_id: string;
    artist_name: string;
    album_name: string;
    album_image: string;
    audio: string;
    image: string;
}

function mapJamendoToSong(track: JamendoTrack): Song {
    return {
        id: `jamendo-${track.id}`,
        title: track.name,
        artistId: track.artist_id,
        artistName: track.artist_name,
        albumName: track.album_name,
        coverURL: track.image || track.album_image,
        audioURL: track.audio,
        source: 'jamendo',
        duration: track.duration,
        playCount: 0,
        genre: '',
    };
}

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Song[]>([]);
    const [loading, setLoading] = useState(false);
    const [browsing, setBrowsing] = useState(false);
    const [browseGenre, setBrowseGenre] = useState('');
    const [browseResults, setBrowseResults] = useState<Song[]>([]);

    const handleSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await discoverJamendo({ q, limit: 30 });
            if (res.data) {
                setResults(res.data.map(mapJamendoToSong));
            } else {
                setResults([]);
            }
        } catch {
            setResults([]);
        }
        setLoading(false);
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => handleSearch(query), 400);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    // Browse genre
    const handleBrowseGenre = async (genre: string) => {
        setBrowseGenre(genre);
        setBrowsing(true);
        try {
            const res = await discoverJamendo({ genre: genre.toLowerCase(), limit: 20 });
            if (res.data) {
                setBrowseResults(res.data.map(mapJamendoToSong));
            }
        } catch {
            setBrowseResults([]);
        }
        setBrowsing(false);
    };

    return (
        <div className="p-6 lg:p-8">
            {/* Search Bar */}
            <div className="max-w-xl mb-8">
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-300" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setBrowseGenre(''); }}
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

            {/* Search Results */}
            {query ? (
                <div>
                    <h2 className="text-2xl font-bold mb-5">
                        {loading ? 'Searching...' : `Results for "${query}"`}
                    </h2>

                    {loading ? (
                        <CardGridSkeleton />
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                            {results.map((song, i) => (
                                <SongCard key={song.id || i} song={song} songs={results} index={i} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-dark-300 text-center py-12">No results found for &ldquo;{query}&rdquo;</p>
                    )}
                </div>
            ) : browseGenre ? (
                /* Genre Results */
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <button onClick={() => setBrowseGenre('')} className="text-dark-300 hover:text-white">
                            ← Back
                        </button>
                        <h2 className="text-2xl font-bold">{browseGenre}</h2>
                    </div>
                    {browsing ? (
                        <CardGridSkeleton />
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                            {browseResults.map((song, i) => (
                                <SongCard key={song.id || i} song={song} songs={browseResults} index={i} />
                            ))}
                        </div>
                    )}
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
                                onClick={() => handleBrowseGenre(genre)}
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
