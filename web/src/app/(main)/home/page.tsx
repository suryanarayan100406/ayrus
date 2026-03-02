'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Music2, Sparkles, Heart, Headphones, Zap, Youtube } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore, Song } from '@/store/playerStore';
import { discoverJamendo, discoverYouTube } from '@/lib/api';
import { getGreeting } from '@/lib/utils';
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
    duration: number; views: number; audioUrl?: string;
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
    // Clean up artist name (remove " - Topic" suffix from YouTube Music channels)
    const artist = t.artist?.replace(/ - Topic$/, '') || 'Unknown Artist';
    return {
        id: `yt-${t.videoId}`, title: t.title,
        artistId: '', artistName: artist,
        albumName: '', coverURL: t.thumbnail,
        audioURL: `youtube:${t.videoId}`, // Lazy-loaded by playerStore
        source: 'youtube', duration: t.duration,
        playCount: 0, genre: '',
    };
}

const GENRES = ['pop', 'rock', 'electronic', 'hiphop', 'jazz', 'classical', 'ambient', 'metal'];

export default function HomePage() {
    const { userProfile } = useAuthStore();
    const { playQueue } = usePlayerStore();
    const [trending, setTrending] = useState<Song[]>([]);
    const [ytMusic, setYtMusic] = useState<Song[]>([]);
    const [energetic, setEnergetic] = useState<Song[]>([]);
    const [chill, setChill] = useState<Song[]>([]);
    const [romantic, setRomantic] = useState<Song[]>([]);
    const [genreTracks, setGenreTracks] = useState<Song[]>([]);
    const [selectedGenre, setSelectedGenre] = useState('pop');
    const [loading, setLoading] = useState(true);
    const [genreLoading, setGenreLoading] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const results = await Promise.allSettled([
                discoverJamendo({ limit: 20 }),
                discoverYouTube({ q: 'trending music 2025 songs', limit: 15 }),
                discoverJamendo({ genre: 'electronic', limit: 10 }),
                discoverJamendo({ genre: 'ambient', limit: 10 }),
                discoverJamendo({ genre: 'pop', limit: 10 }),
            ]);

            const [trendingR, ytR, energeticR, chillR, romanticR] = results;

            if (trendingR.status === 'fulfilled' && trendingR.value?.data)
                setTrending(trendingR.value.data.map(mapJamendo));
            if (ytR.status === 'fulfilled' && ytR.value?.data) {
                const data = Array.isArray(ytR.value.data) ? ytR.value.data : [];
                setYtMusic(data.map(mapYouTube));
            }
            if (energeticR.status === 'fulfilled' && energeticR.value?.data)
                setEnergetic(energeticR.value.data.map(mapJamendo));
            if (chillR.status === 'fulfilled' && chillR.value?.data)
                setChill(chillR.value.data.map(mapJamendo));
            if (romanticR.status === 'fulfilled' && romanticR.value?.data)
                setRomantic(romanticR.value.data.map(mapJamendo));

            setLoading(false);
        }
        fetchData();
    }, []);

    useEffect(() => {
        async function fetchGenre() {
            setGenreLoading(true);
            try {
                // Fetch from both YouTube and Jamendo for genre
                const [jamRes, ytRes] = await Promise.allSettled([
                    discoverJamendo({ genre: selectedGenre, limit: 10 }),
                    discoverYouTube({ q: `${selectedGenre} songs music`, limit: 8 }),
                ]);
                const tracks: Song[] = [];
                if (ytRes.status === 'fulfilled' && Array.isArray(ytRes.value?.data))
                    tracks.push(...ytRes.value.data.map(mapYouTube));
                if (jamRes.status === 'fulfilled' && jamRes.value?.data)
                    tracks.push(...jamRes.value.data.map(mapJamendo));
                setGenreTracks(tracks);
            } catch { }
            setGenreLoading(false);
        }
        fetchGenre();
    }, [selectedGenre]);

    const greeting = getGreeting();
    const quickPlay = [...ytMusic.slice(0, 3), ...trending.slice(0, 3)];

    return (
        <div className="p-6 lg:p-8">
            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                    {greeting}, {userProfile?.displayName || 'there'}
                </h1>
                <p className="text-dark-300 text-lg">
                    Millions of songs from YouTube & Jamendo — all free
                </p>
            </motion.div>

            {/* Quick Play */}
            {quickPlay.length > 0 && (
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {quickPlay.map((song, i) => (
                            <button key={song.id} onClick={() => playQueue(quickPlay, i)}
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

            {/* 🎬 YouTube Music */}
            {ytMusic.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                        <Youtube className="w-5 h-5 text-red-500" />
                        <h2 className="text-2xl font-bold">YouTube Music</h2>
                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">Full Songs</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {ytMusic.map((song, i) => (
                            <SongCard key={song.id} song={song} songs={ytMusic} index={i} />
                        ))}
                    </div>
                </motion.section>
            )}

            {/* 🔥 Trending (Jamendo) */}
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

            {/* 🎸 Genre Browser */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                    <Music2 className="w-5 h-5 text-pink-400" />
                    <h2 className="text-2xl font-bold">Browse by Genre</h2>
                    <span className="text-xs text-dark-400">YouTube + Jamendo</span>
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

            {/* 💖 Pop */}
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
