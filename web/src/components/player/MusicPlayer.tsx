'use client';

import { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, ListMusic } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useUIStore } from '@/store/uiStore';
import { formatDuration, cn } from '@/lib/utils';
import { recordPlay } from '@/lib/api';

export default function MusicPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const {
        currentSong, isPlaying, volume, progress, duration,
        shuffle, repeat, togglePlay, nextSong, prevSong,
        setVolume, setProgress, setDuration, toggleShuffle,
        toggleRepeat, setAudioRef,
    } = usePlayerStore();
    const { toggleQueue } = useUIStore();

    useEffect(() => {
        if (audioRef.current) {
            setAudioRef(audioRef.current);
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

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
        };
    }, [setProgress, setDuration, nextSong, repeat]);

    // Record play after 5 seconds
    useEffect(() => {
        if (currentSong && progress >= 5) {
            recordPlay(currentSong.id).catch(() => { });
        }
    }, [currentSong?.id, progress >= 5]);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
        setProgress(time);
    };

    if (!currentSong) return null;

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

    return (
        <>
            <audio ref={audioRef} />
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-dark-900 border-t border-white/5 z-50 px-4">
                <div className="flex items-center h-full max-w-screen-2xl mx-auto">
                    {/* Song Info */}
                    <div className="flex items-center gap-3 w-72 min-w-0">
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-dark-600">
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
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{currentSong.title}</p>
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
                                {isPlaying ? (
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
        </>
    );
}
