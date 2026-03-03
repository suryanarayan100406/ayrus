'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Music2, Sparkles, Heart, Headphones, Zap, Youtube } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore, Song } from '@/store/playerStore';
import {
    discoverJamendo,
    discoverYouTube,
    discoverFeatured
} from '@/lib/api';
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
    const [featuredTracks, setFeaturedTracks] = useState<Song[]>([]);
    const [selectedGenre, setSelectedGenre] = useState('pop');
    const [loading, setLoading] = useState(true);
    const [genreLoading, setGenreLoading] = useState(false);

    useEffect(() => {
        async function fetchData() {
            // Pick a random YouTube query to keep trending fresh
            const ytQueries = ['trending music 2024 hits', 'global top songs', 'popular music hits', 'viral songs 2025', 'latest pop music', 'new english songs'];
            const randomYtQuery = ytQueries[Math.floor(Math.random() * ytQueries.length)];

            const results = await Promise.allSettled([
                discoverFeatured({ limit: 10 }),
                discoverJamendo({ limit: 30 }), // Fetch more to shuffle
                discoverYouTube({ q: randomYtQuery, limit: 15 }),
                discoverJamendo({ genre: 'electronic', limit: 20 }),
                discoverJamendo({ genre: 'ambient', limit: 20 }),
                discoverJamendo({ genre: 'pop', limit: 20 }),
            ]);

            const [featuredR, trendingR, ytR, energeticR, chillR, romanticR] = results;

            const shuffle = <T,>(arr: T[]): T[] => {
                return [...arr].sort(() => Math.random() - 0.5).slice(0, 10); // Return 10 random items
            };

            if (featuredR.status === 'fulfilled' && featuredR.value?.data)
                setFeaturedTracks(featuredR.value.data);
            if (trendingR.status === 'fulfilled' && trendingR.value?.data)
                setTrending(shuffle(trendingR.value.data as JamendoTrack[]).map(mapJamendo));
            if (ytR.status === 'fulfilled' && ytR.value?.data) {
                const data = Array.isArray(ytR.value.data) ? ytR.value.data : [];
                setYtMusic(data.map(mapYouTube));
            }
            if (energeticR.status === 'fulfilled' && energeticR.value?.data)
                setEnergetic(shuffle(energeticR.value.data as JamendoTrack[]).map(mapJamendo));
            if (chillR.status === 'fulfilled' && chillR.value?.data)
                setChill(shuffle(chillR.value.data as JamendoTrack[]).map(mapJamendo));
            if (romanticR.status === 'fulfilled' && romanticR.value?.data)
                setRomantic(shuffle(romanticR.value.data as JamendoTrack[]).map(mapJamendo));

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

    // Mix youtube and jamendo randomly for quick play
    const quickPlayPool = [...ytMusic.slice(0, 4), ...trending.slice(0, 4)];
    const quickPlay = [...quickPlayPool].sort(() => Math.random() - 0.5).slice(0, 6);

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

            {/* Featured Hero Carousel */}
            {featuredTracks.length > 0 && (
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="mb-12">
                    <div className="flex items-center gap-2 mb-5">
                        <Sparkles className="w-6 h-6 text-yellow-500" />
                        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Featured Qvox Exclusives</h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 lg:-mx-8 lg:px-8 snap-x">
                        {featuredTracks.map((song, i) => (
                            <button
                                key={song.id}
                                onClick={() => playQueue(featuredTracks, i)}
                                className="relative flex-shrink-0 w-72 md:w-96 rounded-2xl overflow-hidden group snap-start text-left focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <div className="aspect-[16/9] w-full bg-dark-600 relative">
                                    {song.coverURL ? (
                                        <img src={song.coverURL} alt={song.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">🎵</div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                </div>
                                <div className="absolute bottom-0 left-0 p-6 w-full">
                                    <span className="inline-block px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                                        Editor's Pick
                                    </span>
                                    <h3 className="text-2xl font-bold text-white mb-1 truncate">{song.title}</h3>
                                    <p className="text-white/80 text-sm truncate">{song.artistName}</p>
                                </div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-xl">
                                    <Play className="w-8 h-8 text-black ml-1" />
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.section>
            )}

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
