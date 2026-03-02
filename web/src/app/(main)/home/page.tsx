'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Music2, Sparkles, Heart, Headphones, Zap, Sun } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore, Song } from '@/store/playerStore';
import { discoverJamendo, discoverSpotify, discoverDeezer } from '@/lib/api';
import { getGreeting } from '@/lib/utils';
import SongCard from '@/components/cards/SongCard';
import { CardGridSkeleton } from '@/components/skeletons/Skeletons';

// Map any source track to our Song format
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
interface SpotifyTrack {
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
function mapSpotify(t: SpotifyTrack): Song | null {
    if (!t.preview_url) return null;
    return {
        id: `sp-${t.id}`, title: t.name,
        artistId: t.artists?.[0]?.id || '', artistName: t.artists?.map(a => a.name).join(', ') || '',
        albumName: t.album?.name || '', coverURL: t.album?.images?.[0]?.url || '',
        audioURL: t.preview_url, source: 'spotify',
        duration: Math.round(t.duration_ms / 1000), playCount: 0, genre: '',
    };
}

const GENRES = ['pop', 'rock', 'electronic', 'hiphop', 'jazz', 'classical', 'ambient', 'metal'];

export default function HomePage() {
    const { userProfile } = useAuthStore();
    const { playQueue } = usePlayerStore();
    const [trending, setTrending] = useState<Song[]>([]);
    const [energetic, setEnergetic] = useState<Song[]>([]);
    const [chill, setChill] = useState<Song[]>([]);
    const [romantic, setRomantic] = useState<Song[]>([]);
    const [spotifyTop, setSpotifyTop] = useState<Song[]>([]);
    const [deezerChart, setDeezerChart] = useState<Song[]>([]);
    const [genreTracks, setGenreTracks] = useState<Song[]>([]);
    const [selectedGenre, setSelectedGenre] = useState('pop');
    const [loading, setLoading] = useState(true);
    const [genreLoading, setGenreLoading] = useState(false);

    // Fetch from all sources on mount
    useEffect(() => {
        async function fetchData() {
            const results = await Promise.allSettled([
                discoverJamendo({ limit: 20 }),                    // trending
                discoverJamendo({ genre: 'electronic', limit: 10 }), // energetic
                discoverJamendo({ genre: 'ambient', limit: 10 }),    // chill
                discoverJamendo({ genre: 'pop', limit: 10 }),        // romantic/pop
                discoverSpotify({ limit: 25 }),                      // spotify (may return null)
                discoverDeezer({ limit: 25 }),                       // deezer (may be geo-blocked)
            ]);

            const [trendingR, energeticR, chillR, romanticR, spotifyR, deezerR] = results;

            if (trendingR.status === 'fulfilled' && trendingR.value?.data)
                setTrending(trendingR.value.data.map(mapJamendo));
            if (energeticR.status === 'fulfilled' && energeticR.value?.data)
                setEnergetic(energeticR.value.data.map(mapJamendo));
            if (chillR.status === 'fulfilled' && chillR.value?.data)
                setChill(chillR.value.data.map(mapJamendo));
            if (romanticR.status === 'fulfilled' && romanticR.value?.data)
                setRomantic(romanticR.value.data.map(mapJamendo));

            // Spotify (may have no preview URLs)
            if (spotifyR.status === 'fulfilled' && spotifyR.value?.data) {
                const data = spotifyR.value.data;
                const tracks = Array.isArray(data) ? data : data?.tracks?.items || [];
                const mapped = tracks.map(mapSpotify).filter(Boolean) as Song[];
                if (mapped.length > 0) setSpotifyTop(mapped);
            }
            // Deezer (may be geo-blocked)
            if (deezerR.status === 'fulfilled' && deezerR.value?.data) {
                const data = Array.isArray(deezerR.value.data) ? deezerR.value.data : [];
                if (data.length > 0) setDeezerChart(data.map(mapDeezer));
            }

            setLoading(false);
        }
        fetchData();
    }, []);

    // Genre browsing
    useEffect(() => {
        async function fetchGenre() {
            setGenreLoading(true);
            try {
                const res = await discoverJamendo({ genre: selectedGenre, limit: 12 });
                if (res.data) setGenreTracks(res.data.map(mapJamendo));
            } catch { }
            setGenreLoading(false);
        }
        fetchGenre();
    }, [selectedGenre]);

    const greeting = getGreeting();
    const quickPlay = trending.slice(0, 6);

    return (
        <div className="p-6 lg:p-8">
            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                    {greeting}, {userProfile?.displayName || 'there'}
                </h1>
                <p className="text-dark-300 text-lg">
                    Discover free music from 600,000+ tracks worldwide
                </p>
            </motion.div>

            {/* Quick Play Grid */}
            {quickPlay.length > 0 && (
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {quickPlay.map((song, i) => (
                            <button key={song.id} onClick={() => playQueue(trending, i)}
                                className="flex items-center gap-4 bg-dark-600/50 hover:bg-dark-500/50 rounded-lg overflow-hidden transition-all duration-300 group">
                                <div className="w-16 h-16 flex-shrink-0 bg-dark-600">
                                    {song.coverURL ? <img src={song.coverURL} alt="" className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center">🎵</div>}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <span className="font-semibold text-sm truncate block">{song.title}</span>
                                    <span className="text-xs text-dark-400 truncate block">{song.artistName}</span>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-4">
                                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center shadow-lg">
                                        <Play className="w-4 h-4 text-black ml-0.5" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.section>
            )}

            {/* Spotify Global Top (shows only if available) */}
            {spotifyTop.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                        <Sparkles className="w-5 h-5 text-green-400" />
                        <h2 className="text-2xl font-bold">Spotify Picks</h2>
                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">30s previews</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {spotifyTop.slice(0, 12).map((song, i) => (
                            <SongCard key={song.id} song={song} songs={spotifyTop} index={i} />
                        ))}
                    </div>
                </motion.section>
            )}

            {/* Deezer Charts (shows only if available / not geo-blocked) */}
            {deezerChart.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h2 className="text-2xl font-bold">Deezer Charts</h2>
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">30s previews</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {deezerChart.slice(0, 12).map((song, i) => (
                            <SongCard key={song.id} song={song} songs={deezerChart} index={i} />
                        ))}
                    </div>
                </motion.section>
            )}

            {/* 🔥 Trending */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="w-5 h-5 text-primary-500" />
                    <h2 className="text-2xl font-bold">Trending Now</h2>
                    <span className="text-xs bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full">Full Tracks</span>
                </div>
                {loading ? <CardGridSkeleton /> : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {trending.slice(0, 12).map((song, i) => (
                            <SongCard key={song.id} song={song} songs={trending} index={i} />
                        ))}
                    </div>
                )}
            </motion.section>

            {/* ⚡ Energetic */}
            {energetic.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <h2 className="text-2xl font-bold">Energetic & Electronic</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {energetic.map((song, i) => (
                            <SongCard key={song.id} song={song} songs={energetic} index={i} />
                        ))}
                    </div>
                </motion.section>
            )}

            {/* 🎸 Browse by Genre */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                    <Music2 className="w-5 h-5 text-pink-400" />
                    <h2 className="text-2xl font-bold">Browse by Genre</h2>
                </div>
                <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
                    {GENRES.map((genre) => (
                        <button key={genre} onClick={() => setSelectedGenre(genre)}
                            className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-all
                                ${selectedGenre === genre ? 'bg-primary-500 text-black' : 'bg-dark-600 text-dark-300 hover:text-white hover:bg-dark-500'}`}>
                            {genre}
                        </button>
                    ))}
                </div>
                {genreLoading ? <CardGridSkeleton /> : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {genreTracks.map((song, i) => (
                            <SongCard key={song.id} song={song} songs={genreTracks} index={i} />
                        ))}
                    </div>
                )}
            </motion.section>

            {/* 😌 Chill */}
            {chill.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                        <Headphones className="w-5 h-5 text-blue-400" />
                        <h2 className="text-2xl font-bold">Chill & Ambient</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {chill.map((song, i) => (
                            <SongCard key={song.id} song={song} songs={chill} index={i} />
                        ))}
                    </div>
                </motion.section>
            )}

            {/* 💖 Pop & Romantic */}
            {romantic.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                        <Heart className="w-5 h-5 text-rose-400" />
                        <h2 className="text-2xl font-bold">Pop Hits</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {romantic.map((song, i) => (
                            <SongCard key={song.id} song={song} songs={romantic} index={i} />
                        ))}
                    </div>
                </motion.section>
            )}
        </div>
    );
}
