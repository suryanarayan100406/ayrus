'use client';

import { useEffect, useState } from 'react';
import { Clock, Play, HeadphonesIcon } from 'lucide-react';
import { getRecentlyPlayed } from '@/lib/api';
import { usePlayerStore } from '@/store/playerStore';

// We inline minimal mapping logic or use types from store since api.ts doesn't export them
import { Song } from '@/store/playerStore';

export default function HistoryPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { playSong, currentSong, isPlaying, togglePlay } = usePlayerStore();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await getRecentlyPlayed();
                const data = response?.data || response;
                if (data && Array.isArray(data)) {
                    // Map mixed backend sources to frontend Song type
                    const mappedSongs: Song[] = data.map(track => {
                        return {
                            id: track.id || track.videoId || Math.random().toString(),
                            title: track.title || track.name || 'Unknown Title',
                            artistName: track.artistName || track.artist || 'Unknown Artist',
                            coverURL: track.coverURL || track.image || track.thumbnail || '',
                            audioURL: track.audioURL || track.audio || (track.videoId ? `youtube:${track.videoId}` : ''),
                            duration: track.duration || 0,
                            fileSize: 0,
                            artistId: track.artistId || '',
                            source: track.source || 'local',
                            playCount: track.playCount || 0,
                            genre: track.genre || ''
                        };
                    });
                    setSongs(mappedSongs);
                }
            } catch (err: any) {
                console.error("Failed to load history:", err);
                setError(err.message || 'Failed to load your listening history');
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const handlePlay = (song: Song, index: number) => {
        if (currentSong?.id === song.id) {
            togglePlay();
        } else {
            // Play from history
            playSong(song);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 pb-32 overflow-y-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Clock className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Listening History</h1>
                    <p className="text-dark-300">Your recently played tracks</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 mb-6">
                    {error}
                </div>
            )}

            {songs.length === 0 ? (
                <div className="text-center py-20">
                    <HeadphonesIcon className="w-16 h-16 mx-auto text-dark-300 mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">No listening history yet</h3>
                    <p className="text-dark-300">Tracks you play will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {songs.map((song, index) => {
                        const isCurrentSong = currentSong?.id === song.id;

                        return (
                            <div
                                key={`${song.id}-${index}`}
                                className="group bg-dark-800/40 hover:bg-dark-700/60 p-4 rounded-xl transition-all duration-300 
                                     hover:shadow-xl hover:-translate-y-1 cursor-pointer border border-white/5 hover:border-white/10"
                                onClick={() => handlePlay(song, index)}
                            >
                                <div className="relative aspect-square mb-4 rounded-lg overflow-hidden shadow-md">
                                    <img
                                        src={song.coverURL}
                                        alt={song.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {/* Play Button Overlay */}
                                    <div className={`absolute right-3 bottom-3 w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center shadow-xl
                                        transition-all duration-300 hover:scale-105 hover:bg-primary-400
                                        ${isCurrentSong && isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlay(song, index);
                                        }}>
                                        <Play className="w-6 h-6 text-black ml-1" fill="currentColor" />
                                    </div>

                                    {isCurrentSong && isPlaying && (
                                        <div className="absolute top-2 right-2 flex gap-1 items-end h-4 w-4 bg-black/60 p-1 rounded backdrop-blur-md">
                                            <div className="w-0.5 bg-primary-500 animate-[bounce_1s_infinite] h-full" />
                                            <div className="w-0.5 bg-primary-500 animate-[bounce_0.8s_infinite] h-3/4" />
                                            <div className="w-0.5 bg-primary-500 animate-[bounce_1.2s_infinite] h-1/2" />
                                        </div>
                                    )}
                                </div>
                                <h3 className={`font-semibold truncate mb-1 transition-colors ${isCurrentSong ? 'text-primary-500' : 'text-white'}`}>
                                    {song.title}
                                </h3>
                                <p className="text-sm text-dark-300 truncate">
                                    {song.artistName}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
