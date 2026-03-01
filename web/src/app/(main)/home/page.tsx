'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, TrendingUp, Headphones, Music2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore, Song } from '@/store/playerStore';
import { discoverJamendo } from '@/lib/api';
import { getGreeting } from '@/lib/utils';
import SongCard from '@/components/cards/SongCard';
import { CardGridSkeleton } from '@/components/skeletons/Skeletons';

// Map Jamendo track format to our Song format
interface JamendoTrack {
    id: string;
    name: string;
    duration: number;
    artist_id: string;
    artist_name: string;
    album_name: string;
    album_image: string;
    audio: string;
    audiodownload: string;
    image: string;
    shareurl: string;
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

const GENRES = ['pop', 'rock', 'electronic', 'hiphop', 'jazz', 'classical', 'ambient', 'metal'];

export default function HomePage() {
    const { userProfile } = useAuthStore();
    const { playQueue } = usePlayerStore();
    const [trending, setTrending] = useState<Song[]>([]);
    const [genreTracks, setGenreTracks] = useState<Song[]>([]);
    const [chillTracks, setChillTracks] = useState<Song[]>([]);
    const [selectedGenre, setSelectedGenre] = useState('pop');
    const [loading, setLoading] = useState(true);
    const [genreLoading, setGenreLoading] = useState(false);

    // Fetch trending songs on mount
    useEffect(() => {
        async function fetchData() {
            try {
                const [trendingRes, chillRes] = await Promise.allSettled([
                    discoverJamendo({ limit: 20 }),
                    discoverJamendo({ genre: 'ambient', limit: 10 }),
                ]);

                if (trendingRes.status === 'fulfilled' && trendingRes.value.data) {
                    setTrending(trendingRes.value.data.map(mapJamendoToSong));
                }
                if (chillRes.status === 'fulfilled' && chillRes.value.data) {
                    setChillTracks(chillRes.value.data.map(mapJamendoToSong));
                }
            } catch { }
            setLoading(false);
        }
        fetchData();
    }, []);

    // Fetch genre tracks
    useEffect(() => {
        async function fetchGenre() {
            setGenreLoading(true);
            try {
                const res = await discoverJamendo({ genre: selectedGenre, limit: 12 });
                if (res.data) {
                    setGenreTracks(res.data.map(mapJamendoToSong));
                }
            } catch { }
            setGenreLoading(false);
        }
        fetchGenre();
    }, [selectedGenre]);

    const greeting = getGreeting();

    return (
        <div className="p-6 lg:p-8">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                    {greeting}, {userProfile?.displayName || 'there'}
                </h1>
                <p className="text-dark-300 text-lg">What do you want to listen to today?</p>
            </motion.div>

            {/* Quick Play - Top 6 trending */}
            {trending.length > 0 && (
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-10"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {trending.slice(0, 6).map((song, i) => (
                            <button
                                key={song.id || i}
                                onClick={() => playQueue(trending, i)}
                                className="flex items-center gap-4 bg-dark-600/50 hover:bg-dark-500/50 rounded-lg overflow-hidden
                           transition-all duration-300 group"
                            >
                                <div className="w-16 h-16 flex-shrink-0 bg-dark-600">
                                    {song.coverURL ? (
                                        <img src={song.coverURL} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">🎵</div>
                                    )}
                                </div>
                                <span className="font-semibold text-sm truncate flex-1 text-left">{song.title}</span>
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

            {/* Trending */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-10"
            >
                <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="w-5 h-5 text-primary-500" />
                    <h2 className="text-2xl font-bold">Trending Now</h2>
                </div>
                {loading ? (
                    <CardGridSkeleton />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {trending.slice(0, 12).map((song, i) => (
                            <SongCard key={song.id || i} song={song} songs={trending} index={i} />
                        ))}
                    </div>
                )}
            </motion.section>

            {/* Browse by Genre */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-10"
            >
                <div className="flex items-center gap-2 mb-5">
                    <Music2 className="w-5 h-5 text-purple-400" />
                    <h2 className="text-2xl font-bold">Browse by Genre</h2>
                </div>
                <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
                    {GENRES.map((genre) => (
                        <button
                            key={genre}
                            onClick={() => setSelectedGenre(genre)}
                            className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-all
                                ${selectedGenre === genre
                                    ? 'bg-primary-500 text-black'
                                    : 'bg-dark-600 text-dark-300 hover:text-white hover:bg-dark-500'
                                }`}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
                {genreLoading ? (
                    <CardGridSkeleton />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {genreTracks.map((song, i) => (
                            <SongCard key={song.id || i} song={song} songs={genreTracks} index={i} />
                        ))}
                    </div>
                )}
            </motion.section>

            {/* Chill & Ambient */}
            {chillTracks.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <Headphones className="w-5 h-5 text-blue-400" />
                        <h2 className="text-2xl font-bold">Chill & Ambient</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {chillTracks.map((song, i) => (
                            <SongCard key={song.id || i} song={song} songs={chillTracks} index={i} />
                        ))}
                    </div>
                </motion.section>
            )}
        </div>
    );
}
