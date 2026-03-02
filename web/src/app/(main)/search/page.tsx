'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search as SearchIcon, X, Music, Youtube } from 'lucide-react';
import { motion } from 'framer-motion';
import { discoverJamendo, discoverYouTube } from '@/lib/api';
import { usePlayerStore, Song } from '@/store/playerStore';
import SongCard from '@/components/cards/SongCard';
import { CardGridSkeleton } from '@/components/skeletons/Skeletons';

// ---- Mappers ----
interface JamendoTrack {
    id: string; name: string; duration: number; artist_id: string;
    artist_name: string; album_name: string; album_image: string;
    audio: string; image: string;
}
interface PipedTrack {
    videoId: string; title: string; artist: string; thumbnail: string;
    duration: number; views: number;
}

function mapJamendo(t: JamendoTrack): Song {
    return {
        id: `jam-${t.id}`, title: t.name, artistId: t.artist_id,
        artistName: t.artist_name, albumName: t.album_name,
        coverURL: t.image || t.album_image, audioURL: t.audio,
        source: 'jamendo', duration: t.duration, playCount: 0, genre: '',
    };
}
function mapYouTube(t: PipedTrack): Song {
    const artist = t.artist?.replace(/ - Topic$/, '') || 'Unknown Artist';
    return {
        id: `yt-${t.videoId}`, title: t.title,
        artistId: '', artistName: artist,
        albumName: '', coverURL: t.thumbnail,
        audioURL: `youtube:${t.videoId}`,
        source: 'youtube', duration: t.duration,
        playCount: 0, genre: '',
    };
}

const genres = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country', 'Folk', 'Indie', 'Metal', 'Blues'];
const genreColors = [
    'from-pink-500 to-rose-600', 'from-red-500 to-orange-600',
    'from-yellow-500 to-amber-600', 'from-blue-500 to-purple-600',
    'from-indigo-500 to-blue-600', 'from-purple-500 to-pink-600',
    'from-teal-500 to-cyan-600', 'from-orange-500 to-red-600',
    'from-green-500 to-teal-600', 'from-violet-500 to-indigo-600',
    'from-gray-500 to-zinc-600', 'from-cyan-500 to-blue-600',
];

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [ytResults, setYtResults] = useState<Song[]>([]);
    const [jamendoResults, setJamendoResults] = useState<Song[]>([]);
    const [loading, setLoading] = useState(false);
    const [browseGenre, setBrowseGenre] = useState('');
    const [browseResults, setBrowseResults] = useState<Song[]>([]);
    const [browsing, setBrowsing] = useState(false);

    // Track the latest search request ID to ignore stale responses
    const searchIdRef = useRef(0);

    // Search YouTube + Jamendo in parallel
    const handleSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setYtResults([]); setJamendoResults([]);
            return;
        }

        const currentSearchId = ++searchIdRef.current;
        setLoading(true);
        try {
            const [yt, jam] = await Promise.allSettled([
                // Reduced limit to 10 to speed up backend yt-dlp query
                discoverYouTube({ q, limit: 10 }),
                discoverJamendo({ q, limit: 10 }),
            ]);

            // If another search was fired while we were waiting, ignore these results
            if (searchIdRef.current !== currentSearchId) return;

            if (yt.status === 'fulfilled' && Array.isArray(yt.value?.data)) {
                setYtResults(yt.value.data.map(mapYouTube));
            } else {
                setYtResults([]);
            }
            if (jam.status === 'fulfilled' && jam.value?.data) {
                const tracks = Array.isArray(jam.value.data) ? jam.value.data : [];
                setJamendoResults(tracks.map(mapJamendo));
            } else {
                setJamendoResults([]);
            }
        } catch { }

        if (searchIdRef.current === currentSearchId) {
            setLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => handleSearch(query), 400);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    // Genre browse
    const handleBrowseGenre = async (genre: string) => {
        setBrowseGenre(genre);
        setBrowsing(true);
        try {
            const [yt, jam] = await Promise.allSettled([
                discoverYouTube({ q: `${genre} songs music`, limit: 12 }),
                discoverJamendo({ genre: genre.toLowerCase(), limit: 10 }),
            ]);
            const results: Song[] = [];
            if (yt.status === 'fulfilled' && Array.isArray(yt.value?.data))
                results.push(...yt.value.data.map(mapYouTube));
            if (jam.status === 'fulfilled' && Array.isArray(jam.value?.data))
                results.push(...jam.value.data.map(mapJamendo));
            setBrowseResults(results);
        } catch { setBrowseResults([]); }
        setBrowsing(false);
    };

    const hasResults = ytResults.length > 0 || jamendoResults.length > 0;

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
                        placeholder="Search any song — Ed Sheeran, BTS, Arijit Singh..."
                        className="w-full bg-dark-600 rounded-full py-3 pl-12 pr-10 text-white placeholder-dark-300
                       focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                    {query && (
                        <button onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {query ? (
                <div>
                    <h2 className="text-2xl font-bold mb-5">
                        {loading ? 'Searching...' : `Results for "${query}"`}
                    </h2>

                    {loading ? <CardGridSkeleton /> : hasResults ? (
                        <>
                            {/* YouTube results */}
                            {ytResults.length > 0 && (
                                <section className="mb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Youtube className="w-4 h-4 text-red-500" />
                                        <h3 className="text-lg font-semibold text-dark-300">YouTube Music</h3>
                                        <span className="text-xs text-dark-400">Full songs</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                                        {ytResults.map((song, i) => (
                                            <SongCard key={song.id} song={song} songs={ytResults} index={i} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Jamendo results */}
                            {jamendoResults.length > 0 && (
                                <section className="mb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Music className="w-4 h-4 text-primary-400" />
                                        <h3 className="text-lg font-semibold text-dark-300">Jamendo</h3>
                                        <span className="text-xs text-dark-400">Free licensed tracks</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                                        {jamendoResults.map((song, i) => (
                                            <SongCard key={song.id} song={song} songs={jamendoResults} index={i} />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    ) : (
                        <p className="text-dark-300 text-center py-12">No results found for &ldquo;{query}&rdquo;</p>
                    )}
                </div>
            ) : browseGenre ? (
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <button onClick={() => setBrowseGenre('')} className="text-dark-300 hover:text-white">← Back</button>
                        <h2 className="text-2xl font-bold">{browseGenre}</h2>
                    </div>
                    {browsing ? <CardGridSkeleton /> : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                            {browseResults.map((song, i) => (
                                <SongCard key={song.id} song={song} songs={browseResults} index={i} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
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
