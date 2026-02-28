'use client';

import { Play } from 'lucide-react';
import { usePlayerStore, Song } from '@/store/playerStore';

interface SongCardProps {
    song: Song;
    songs?: Song[];
    index?: number;
}

export default function SongCard({ song, songs, index = 0 }: SongCardProps) {
    const { playSong, playQueue } = usePlayerStore();

    const handlePlay = () => {
        if (songs && songs.length > 0) {
            playQueue(songs, index);
        } else {
            playSong(song);
        }
    };

    return (
        <div onClick={handlePlay} className="card-spotify">
            <div className="relative mb-4">
                <div className="aspect-square rounded-md overflow-hidden bg-dark-600">
                    {song.coverURL ? (
                        <img
                            src={song.coverURL}
                            alt={song.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-500 to-dark-700">
                            <span className="text-4xl">🎵</span>
                        </div>
                    )}
                </div>
                <div className="play-button-overlay">
                    <button className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center
                           shadow-xl shadow-primary-500/25 hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 text-black ml-0.5" />
                    </button>
                </div>
            </div>
            <h3 className="font-semibold text-sm truncate">{song.title}</h3>
            <p className="text-xs text-dark-300 mt-1 truncate">{song.artistName}</p>
        </div>
    );
}
