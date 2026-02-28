'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore, Song } from '@/store/playerStore';
import { getSongs, getRecommendations, getRecentlyPlayed } from '@/lib/api';
import { getGreeting } from '@/lib/utils';
import SongCard from '@/components/cards/SongCard';
import { CardGridSkeleton } from '@/components/skeletons/Skeletons';

export default function HomePage() {
    const { userProfile } = useAuthStore();
    const { playQueue } = usePlayerStore();
    const [trending, setTrending] = useState<Song[]>([]);
    const [recommended, setRecommended] = useState<Song[]>([]);
    const [recent, setRecent] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [trendingRes, recommendedRes, recentRes] = await Promise.allSettled([
                    getSongs({ limit: 12 }),
                    getRecommendations(12),
                    getRecentlyPlayed(),
                ]);

                if (trendingRes.status === 'fulfilled') setTrending(trendingRes.value.data || []);
                if (recommendedRes.status === 'fulfilled') setRecommended(recommendedRes.value.data || []);
                if (recentRes.status === 'fulfilled') setRecent(recentRes.value.data || []);
            } catch { }
            setLoading(false);
        }
        fetchData();
    }, []);

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

            {/* Quick Play Cards */}
            {recent.length > 0 && (
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-10"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {recent.slice(0, 6).map((song, i) => (
                            <button
                                key={song.id || i}
                                onClick={() => playQueue(recent, i)}
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
                        {trending.map((song, i) => (
                            <SongCard key={song.id || i} song={song} songs={trending} index={i} />
                        ))}
                    </div>
                )}
            </motion.section>

            {/* Recommended */}
            {recommended.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <h2 className="text-2xl font-bold">Made For You</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {recommended.map((song, i) => (
                            <SongCard key={song.id || i} song={song} songs={recommended} index={i} />
                        ))}
                    </div>
                </motion.section>
            )}

            {/* Recently Played */}
            {recent.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <Clock className="w-5 h-5 text-dark-300" />
                        <h2 className="text-2xl font-bold">Recently Played</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {recent.map((song, i) => (
                            <SongCard key={song.id || i} song={song} songs={recent} index={i} />
                        ))}
                    </div>
                </motion.section>
            )}
        </div>
    );
}
