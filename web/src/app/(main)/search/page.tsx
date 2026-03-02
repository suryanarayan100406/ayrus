'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, X, Globe, Music, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { discoverJamendo, discoverDeezer, discoverSpotify } from '@/lib/api';
import { usePlayerStore, Song } from '@/store/playerStore';
import SongCard from '@/components/cards/SongCard';
import { CardGridSkeleton } from '@/components/skeletons/Skeletons';

// ---- Mappers ----
interface JamendoTrack {
    id: string; name: string; duration: number; artist_id: string;
    artist_name: string; album_name: string; album_image: string;
    audio: string; image: string;
}
interface DeezerTrack {
    id: number; title: string; duration: number; preview: string;
    artist: { id: number; name: string };
    album: { id: number; title: string; cover_medium: string; cover_xl: string };
}
interface SpotifyTrackData {
    id: string; name: string; duration_ms: number; preview_url: string;
    album: { name: string; images: { url: string }[] };
    artists: { id: string; name: string }[];
}

function mapJamendo(t: JamendoTrack): Song {
    return {
        id: `jam-${t.id}`, title: t.name, artistId: t.artist_id,
        artistName: t.artist_name, albumName: t.album_name,
        coverURL: t.image || t.album_image, audioURL: t.audio,
        source: 'jamendo', duration: t.duration, playCount: 0, genre: '',
    };
}
function mapDeezer(t: DeezerTrack): Song {
    return {
        id: `dz-${t.id}`, title: t.title, artistId: String(t.artist.id),
        artistName: t.artist.name, albumName: t.album.title,
        coverURL: t.album.cover_xl || t.album.cover_medium,
        audioURL: t.preview, source: 'deezer',
        duration: t.duration, playCount: 0, genre: '',
    };
}
function mapSpotify(t: SpotifyTrackData): Song | null {
    if (!t.preview_url) return null;
    return {
        id: `sp-${t.id}`, title: t.name,
        artistId: t.artists[0]?.id || '', artistName: t.artists.map(a => a.name).join(', '),
        albumName: t.album.name, coverURL: t.album.images[0]?.url || '',
        audioURL: t.preview_url, source: 'spotify',
        duration: Math.round(t.duration_ms / 1000), playCount: 0, genre: '',
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
    const [deezerResults, setDeezerResults] = useState<Song[]>([]);
    const [jamendoResults, setJamendoResults] = useState<Song[]>([]);
    const [spotifyResults, setSpotifyResults] = useState<Song[]>([]);
    const [loading, setLoading] = useState(false);
    const [browseGenre, setBrowseGenre] = useState('');
    const [browseResults, setBrowseResults] = useState<Song[]>([]);
    const [browsing, setBrowsing] = useState(false);

    // Search ALL sources in parallel
    const handleSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setDeezerResults([]); setJamendoResults([]); setSpotifyResults([]);
            return;
        }
        setLoading(true);
        try {
            const [dz, jam, sp] = await Promise.allSettled([
                discoverDeezer({ q, limit: 15 }),
                discoverJamendo({ q, limit: 15 }),
                discoverSpotify({ q, limit: 15 }),
            ]);

            if (dz.status === 'fulfilled' && dz.value.data) {
                const tracks = Array.isArray(dz.value.data) ? dz.value.data : [];
                setDeezerResults(tracks.map(mapDeezer));
            }
            if (jam.status === 'fulfilled' && jam.value.data) {
                const tracks = Array.isArray(jam.value.data) ? jam.value.data : [];
                setJamendoResults(tracks.map(mapJamendo));
            }
            if (sp.status === 'fulfilled' && sp.value.data) {
                // Spotify returns { tracks: { items: [] } } format
                const spData = sp.value.data;
                const items = spData?.tracks?.items || [];
                setSpotifyResults(items.map(mapSpotify).filter(Boolean) as Song[]);
            }
        } catch { }
        setLoading(false);
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
            const [dz, jam] = await Promise.allSettled([
                discoverDeezer({ q: genre, limit: 15 }),
                discoverJamendo({ genre: genre.toLowerCase(), limit: 15 }),
            ]);
            const results: Song[] = [];
            if (dz.status === 'fulfilled' && Array.isArray(dz.value.data)) {
                results.push(...dz.value.data.map(mapDeezer));
            }
            if (jam.status === 'fulfilled' && Array.isArray(jam.value.data)) {
                results.push(...jam.value.data.map(mapJamendo));
            }
            setBrowseResults(results);
        } catch { setBrowseResults([]); }
        setBrowsing(false);
    };

    const allResults = [...deezerResults, ...spotifyResults, ...jamendoResults];
    const hasResults = allResults.length > 0;

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
                        placeholder="Search millions of songs across Deezer, Spotify & Jamendo..."
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
                        {loading ? 'Searching all sources...' : `Results for "${query}"`}
                    </h2>

                    {loading ? <CardGridSkeleton /> : hasResults ? (
                        <>
                            {/* Deezer results */}
                            {deezerResults.length > 0 && (
                                <section className="mb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Globe className="w-4 h-4 text-purple-400" />
                                        <h3 className="text-lg font-semibold text-dark-300">Deezer</h3>
                                        <span className="text-xs text-dark-400">30s previews</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                                        {deezerResults.map((song, i) => (
                                            <SongCard key={song.id} song={song} songs={deezerResults} index={i} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Spotify results */}
                            {spotifyResults.length > 0 && (
                                <section className="mb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Radio className="w-4 h-4 text-green-400" />
                                        <h3 className="text-lg font-semibold text-dark-300">Spotify</h3>
                                        <span className="text-xs text-dark-400">30s previews</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                                        {spotifyResults.map((song, i) => (
                                            <SongCard key={song.id} song={song} songs={spotifyResults} index={i} />
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
                                        <span className="text-xs text-dark-400">Full tracks</span>
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
