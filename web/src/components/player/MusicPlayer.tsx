'use client';

import { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, ListMusic } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useUIStore } from '@/store/uiStore';
import { formatDuration, cn } from '@/lib/utils';

export default function MusicPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const {
        currentSong, isPlaying, isLoading, volume, progress, duration,
        shuffle, repeat, togglePlay, nextSong, prevSong,
        setVolume, setProgress, setDuration, toggleShuffle,
        toggleRepeat, setAudioRef,
    } = usePlayerStore();
    const { toggleQueue, toggleNowPlaying } = useUIStore();

    // Always register the audio ref so playSong can use it
    useEffect(() => {
        if (audioRef.current) {
            setAudioRef(audioRef.current);
            audioRef.current.volume = volume;
        }
    }, [setAudioRef]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => setProgress(audio.currentTime);
        const onLoadedMetadata = () => setDuration(audio.duration);
        const onEnded = () => {
            if (repeat === 'one') {
                audio.currentTime = 0;
                audio.play();
            } else {
                nextSong();
            }
        };
        const onError = () => {
            console.error('Audio error:', audio.error);
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
        };
    }, [setProgress, setDuration, nextSong, repeat]);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
        setProgress(time);
    };

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

    return (
        <>
            {/* Audio element is ALWAYS rendered so audioRef is available */}
            <audio ref={audioRef} />

            {currentSong && (
                <div className="fixed bottom-0 left-0 right-0 h-20 bg-dark-900 border-t border-white/5 z-50 px-4">
                    <div className="flex items-center h-full max-w-screen-2xl mx-auto">
                        {/* Song Info */}
                        <div
                            className="flex items-center gap-3 w-72 min-w-0 cursor-pointer hover:bg-white/5 p-2 -ml-2 rounded-lg transition-colors group"
                            onClick={toggleNowPlaying}
                        >
                            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-dark-600 relative">
                                {currentSong.coverURL ? (
                                    <img
                                        src={currentSong.coverURL}
                                        alt={currentSong.title}
                                        className={cn('w-full h-full object-cover', isPlaying && 'vinyl-spin')}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ListMusic className="w-6 h-6 text-dark-300" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate group-hover:text-primary-400 transition-colors">{currentSong.title}</p>
                                <p className="text-xs text-dark-300 truncate">{currentSong.artistName}</p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex-1 flex flex-col items-center gap-1">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={toggleShuffle}
                                    className={cn('btn-ghost', shuffle && 'text-primary-500')}
                                >
                                    <Shuffle className="w-4 h-4" />
                                </button>
                                <button onClick={prevSong} className="btn-ghost hover:text-white">
                                    <SkipBack className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={togglePlay}
                                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center
                           hover:scale-110 transition-transform"
                                >
                                    {isLoading ? (
                                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                    ) : isPlaying ? (
                                        <Pause className="w-5 h-5 text-black" />
                                    ) : (
                                        <Play className="w-5 h-5 text-black ml-0.5" />
                                    )}
                                </button>
                                <button onClick={nextSong} className="btn-ghost hover:text-white">
                                    <SkipForward className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={toggleRepeat}
                                    className={cn('btn-ghost', repeat !== 'off' && 'text-primary-500')}
                                >
                                    {repeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="flex items-center gap-2 w-full max-w-md">
                                <span className="text-xs text-dark-300 w-10 text-right">{formatDuration(progress)}</span>
                                <div className="flex-1 relative group">
                                    <input
                                        type="range"
                                        min={0}
                                        max={duration || 0}
                                        value={progress}
                                        onChange={handleSeek}
                                        className="w-full"
                                        style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}
                                    />
                                </div>
                                <span className="text-xs text-dark-300 w-10">{formatDuration(duration)}</span>
                            </div>
                        </div>

                        {/* Volume & Queue */}
                        <div className="flex items-center gap-3 w-48 justify-end">
                            <button onClick={toggleQueue} className="btn-ghost hover:text-white">
                                <ListMusic className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
                                className="btn-ghost hover:text-white"
                            >
                                {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                                className="w-20"
                                style={{ '--progress': `${volume * 100}%` } as React.CSSProperties}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
