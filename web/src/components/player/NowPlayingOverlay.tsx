'use client';

import { useEffect, useState } from 'react';
import {
    ChevronDown, Play, Pause, SkipBack, SkipForward,
    Shuffle, Repeat, Repeat1, Heart, Share2, ListMusic
} from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useUIStore } from '@/store/uiStore';
import { formatDuration, cn } from '@/lib/utils';
import { likeSong } from '@/lib/api';

export default function NowPlayingOverlay() {
    const {
        currentSong, isPlaying, progress, duration,
        shuffle, repeat, togglePlay, nextSong, prevSong,
        setProgress, toggleShuffle, toggleRepeat
    } = usePlayerStore();
    const { nowPlayingOpen, toggleNowPlaying } = useUIStore();

    const [isLiked, setIsLiked] = useState(false);
    const [isLiking, setIsLiking] = useState(false);

    // Prevent body scroll when open
    useEffect(() => {
        if (nowPlayingOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [nowPlayingOpen]);

    if (!nowPlayingOpen || !currentSong) return null;

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        setProgress(time);

        // Sync with audio element globally
        const audio = document.querySelector('audio');
        if (audio) {
            audio.currentTime = time;
        }
    };

    const handleLike = async () => {
        if (!currentSong?.id || isLiking) return;
        setIsLiking(true);
        try {
            await likeSong(currentSong.id);
            setIsLiked(!isLiked);
        } catch (error) {
            console.error("Failed to like song:", error);
        } finally {
            setIsLiking(false);
        }
    };

    return (
        <div
            className={`fixed inset-0 z-[100] bg-dark-900 flex flex-col transition-transform duration-500 ease-in-out ${nowPlayingOpen ? 'translate-y-0' : 'translate-y-full'
                }`}
        >
            {/* Background blur using coverURL */}
            {currentSong.coverURL && (
                <div
                    className="absolute inset-0 z-0 opacity-20 blur-3xl scale-125 saturate-150 transform transition-all duration-1000"
                    style={{
                        backgroundImage: `url(${currentSong.coverURL})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover'
                    }}
                />
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-dark-900/60 to-dark-950/90 z-0" />

            {/* Header */}
            <header className="relative z-10 p-6 flex items-center justify-between pointer-events-auto">
                <button
                    onClick={toggleNowPlaying}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
                >
                    <ChevronDown className="w-8 h-8" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-xs uppercase tracking-widest font-semibold text-dark-300">
                        Now Playing From
                    </span>
                    <span className="text-sm font-medium text-white truncate max-w-[200px]">
                        {currentSong.source === 'youtube' ? 'YouTube Music' :
                            currentSong.source === 'jamendo' ? 'Jamendo' :
                                currentSong.albumName || 'Library'}
                    </span>
                </div>
                <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-white">
                    <Share2 className="w-6 h-6" />
                </button>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 max-w-5xl mx-auto w-full">
                {/* Artwork */}
                <div className="w-full max-w-md aspect-square shadow-2xl rounded-xl overflow-hidden mb-12 sm:max-w-lg md:max-w-xl transition-all duration-500">
                    {currentSong.coverURL ? (
                        <img
                            src={currentSong.coverURL}
                            alt={currentSong.title}
                            className={cn('w-full h-full object-cover transition-transform duration-1000 scale-100',
                                isPlaying ? 'scale-105' : 'scale-100 opacity-80'
                            )}
                        />
                    ) : (
                        <div className="w-full h-full bg-dark-800 flex items-center justify-center">
                            <ListMusic className="w-32 h-32 text-dark-400" />
                        </div>
                    )}
                </div>

                {/* Track Info & Actions */}
                <div className="w-full max-w-2xl px-4 flex items-center justify-between mb-8">
                    <div className="flex flex-col min-w-0 pr-4">
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 truncate">
                            {currentSong.title}
                        </h1>
                        <p className="text-lg sm:text-xl text-dark-300 truncate">
                            {currentSong.artistName}
                        </p>
                    </div>
                    <button
                        onClick={handleLike}
                        disabled={isLiking}
                        className={cn(
                            "p-3 rounded-full transition-all duration-300",
                            isLiked ? "text-primary-500 hover:scale-110" : "text-dark-300 hover:text-white"
                        )}
                    >
                        <Heart className="w-8 h-8" fill={isLiked ? "currentColor" : "none"} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-2xl px-4 mb-8">
                    <div className="w-full h-2 bg-dark-700/50 rounded-full relative group cursor-pointer">
                        <div
                            className="absolute top-0 left-0 h-full bg-white group-hover:bg-primary-500 rounded-full transition-colors"
                            style={{ width: `${progressPercent}%` }}
                        />
                        {/* Hidden range input for seeking */}
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={progress}
                            onChange={handleSeek}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm text-dark-300 font-medium">
                        <span>{formatDuration(progress)}</span>
                        <span>{formatDuration(duration)}</span>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="w-full max-w-2xl px-4 flex items-center justify-between">
                    <button
                        onClick={toggleShuffle}
                        className={cn('p-3 rounded-full transition-colors', shuffle ? 'text-primary-500' : 'text-dark-300 hover:text-white')}
                    >
                        <Shuffle className="w-6 h-6" />
                    </button>

                    <button
                        onClick={prevSong}
                        className="p-3 rounded-full hover:bg-white/10 transition-colors text-white"
                    >
                        <SkipBack className="w-10 h-10 fill-current" />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                    >
                        {isPlaying ? (
                            <Pause className="w-10 h-10 text-black fill-current" />
                        ) : (
                            <Play className="w-10 h-10 text-black fill-current ml-2" />
                        )}
                    </button>

                    <button
                        onClick={nextSong}
                        className="p-3 rounded-full hover:bg-white/10 transition-colors text-white"
                    >
                        <SkipForward className="w-10 h-10 fill-current" />
                    </button>

                    <button
                        onClick={toggleRepeat}
                        className={cn('p-3 rounded-full transition-colors', repeat !== 'off' ? 'text-primary-500' : 'text-dark-300 hover:text-white')}
                    >
                        {repeat === 'one' ? <Repeat1 className="w-6 h-6" /> : <Repeat className="w-6 h-6" />}
                    </button>
                </div>
            </main>
        </div>
    );
}
