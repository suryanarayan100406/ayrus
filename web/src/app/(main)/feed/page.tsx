'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Music } from 'lucide-react';
import { discoverFeed } from '@/lib/api';
import { usePlayerStore, Song } from '@/store/playerStore';
import SongCard from '@/components/cards/SongCard';
import { CardGridSkeleton } from '@/components/skeletons/Skeletons';
import { useAuthStore } from '@/store/authStore';

interface PipedTrack {
    videoId: string; title: string; artist: string; thumbnail: string;
    duration: number; views: number; audioUrl?: string;
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

export default function FeedPage() {
    const { userProfile } = useAuthStore();
    const { playQueue } = usePlayerStore();
    const [feedTracks, setFeedTracks] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFeed() {
            try {
                const res = await discoverFeed({ limit: 30 });
                if (res.data && Array.isArray(res.data)) {
                    setFeedTracks(res.data.map(mapYouTube));
                }
            } catch (error) {
                console.error("Failed to fetch custom feed", error);
            } finally {
                setLoading(false);
            }
        }

        fetchFeed();
    }, []);

    return (
        <div className="p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-8 h-8 text-primary-500" />
                    <h1 className="text-3xl lg:text-4xl font-bold">Your Custom Feed</h1>
                </div>
                <p className="text-dark-300 text-lg">
                    {userProfile ? `Curated especially for ${userProfile.displayName || 'you'} based on your recent listening history.` : 'Personalized recommendations based on what you play.'}
                </p>
            </motion.div>

            {loading ? (
                <CardGridSkeleton />
            ) : feedTracks.length > 0 ? (
                <div>
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => playQueue(feedTracks, 0)}
                            className="bg-primary-500 text-black px-6 py-2.5 rounded-full font-bold hover:scale-105 transition-transform"
                        >
                            Play Feed
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {feedTracks.map((song, idx) => (
                            <SongCard key={`${song.id}-${idx}`} song={song} songs={feedTracks} index={idx} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-dark-600/30 rounded-xl border border-white/5">
                    <Music className="w-16 h-16 text-dark-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Nothing here yet</h2>
                    <p className="text-dark-300">
                        Start listening to some songs, and we'll build a custom feed for you!
                    </p>
                </div>
            )}
        </div>
    );
}
