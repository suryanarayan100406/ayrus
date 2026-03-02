import { create } from 'zustand';

export interface Song {
    id: string;
    title: string;
    artistId: string;
    artistName: string;
    albumId?: string;
    albumName?: string;
    coverURL: string;
    audioURL: string;
    source: string;
    duration: number;
    playCount: number;
    genre: string;
}

interface PlayerState {
    currentSong: Song | null;
    queue: Song[];
    queueIndex: number;
    isPlaying: boolean;
    isLoading: boolean;
    volume: number;
    progress: number;
    duration: number;
    shuffle: boolean;
    repeat: 'off' | 'all' | 'one';
    audioRef: HTMLAudioElement | null;

    playSong: (song: Song) => void;
    playQueue: (songs: Song[], startIndex?: number) => void;
    addToQueue: (song: Song) => void;
    removeFromQueue: (index: number) => void;
    togglePlay: () => void;
    pause: () => void;
    resume: () => void;
    nextSong: () => void;
    prevSong: () => void;
    setVolume: (volume: number) => void;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    setAudioRef: (ref: HTMLAudioElement) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentSong: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    isLoading: false,
    volume: 0.7,
    progress: 0,
    duration: 0,
    shuffle: false,
    repeat: 'off',
    audioRef: null,

    playSong: async (song) => {
        const { audioRef } = get();
        set({
            currentSong: song,
            isPlaying: true,
            isLoading: true,
            progress: 0,
        });

        let audioURL = song.audioURL;

        // YouTube tracks have lazy-loaded audio URLs
        if (audioURL.startsWith('youtube:')) {
            const videoId = audioURL.replace('youtube:', '');
            try {
                const { getYouTubeStream } = await import('@/lib/api');
                const res = await getYouTubeStream(videoId);
                if (res.data?.audioUrl) {
                    audioURL = res.data.audioUrl;
                    // Update the song object so it doesn't need to fetch again
                    song.audioURL = audioURL;
                    set({ currentSong: { ...song, audioURL } });
                } else {
                    console.error('No audio stream for YouTube video');
                    return;
                }
            } catch (e) {
                console.error('Failed to get YouTube audio:', e);
                set({ isLoading: false, isPlaying: false });
                return;
            }
        }

        if (audioRef) {
            audioRef.src = audioURL;
            audioRef.load();
            audioRef.play().then(() => {
                set({ isLoading: false });

                // --- Silent Prefetch for Next Song in Queue ---
                const { queue, queueIndex, shuffle } = get();
                if (queue.length > 0) {
                    let nextIndex: number;
                    if (shuffle) {
                        nextIndex = Math.floor(Math.random() * queue.length);
                    } else {
                        nextIndex = queueIndex + 1;
                    }

                    if (nextIndex < queue.length) {
                        const nextS = queue[nextIndex];
                        if (nextS && nextS.audioURL.startsWith('youtube:')) {
                            const vId = nextS.audioURL.replace('youtube:', '');
                            import('@/lib/api').then(api => {
                                // Calls backend to cache audio URL, but ignores result here
                                api.getYouTubeStream(vId).catch(() => { });
                            });
                        }
                    }
                }

            }).catch(e => {
                console.error("Audio play error", e);
                set({ isLoading: false, isPlaying: false });
            });
        }
    },

    playQueue: async (songs, startIndex = 0) => {
        const song = songs[startIndex];
        set({
            queue: songs,
            queueIndex: startIndex,
        });
        // Delegate to playSong which handles YouTube lazy loading
        get().playSong(song);
    },

    addToQueue: (song) => {
        set((state) => ({ queue: [...state.queue, song] }));
    },

    removeFromQueue: (index) => {
        set((state) => ({
            queue: state.queue.filter((_, i) => i !== index),
        }));
    },

    togglePlay: () => {
        const { isPlaying, audioRef } = get();
        if (isPlaying) {
            audioRef?.pause();
        } else {
            audioRef?.play().catch(() => { });
        }
        set({ isPlaying: !isPlaying });
    },

    pause: () => {
        get().audioRef?.pause();
        set({ isPlaying: false });
    },

    resume: () => {
        get().audioRef?.play().catch(() => { });
        set({ isPlaying: true });
    },

    nextSong: async () => {
        const { queue, queueIndex, shuffle, repeat, currentSong } = get();
        if (queue.length === 0) return;

        let nextIndex: number;
        if (shuffle) {
            nextIndex = Math.floor(Math.random() * queue.length);
        } else {
            nextIndex = queueIndex + 1;
        }

        if (nextIndex >= queue.length) {
            if (repeat === 'all') {
                nextIndex = 0;
            } else {
                // Auto-Play Feature: Fetch similar song when queue ends
                if (currentSong) {
                    try {
                        const { discoverSimilar } = await import('@/lib/api');
                        const res = await discoverSimilar({ artist: currentSong.artistName, title: currentSong.title, limit: 1 });
                        if (res.data && res.data.length > 0) {
                            const t = res.data[0];
                            const newSong: Song = {
                                id: `yt-${t.videoId}`, title: t.title,
                                artistId: '', artistName: t.artist?.replace(/ - Topic$/, '') || 'Unknown Artist',
                                albumName: '', coverURL: t.thumbnail,
                                audioURL: `youtube:${t.videoId}`,
                                source: 'youtube', duration: t.duration,
                                playCount: 0, genre: '',
                            };
                            get().addToQueue(newSong);
                            nextIndex = queue.length; // Play newly added song
                        } else {
                            set({ isPlaying: false });
                            return;
                        }
                    } catch (e) {
                        console.error('Auto-Play failed:', e);
                        set({ isPlaying: false });
                        return;
                    }
                } else {
                    set({ isPlaying: false });
                    return;
                }
            }
        }

        // Must fetch queue fresh in case auto-play added to it
        const latestQueue = get().queue;
        const nextSong = latestQueue[nextIndex];
        set({ queueIndex: nextIndex });
        get().playSong(nextSong);
    },

    prevSong: () => {
        const { queue, queueIndex, progress, audioRef } = get();
        if (progress > 3) {
            if (audioRef) {
                audioRef.currentTime = 0;
            }
            set({ progress: 0 });
            return;
        }

        const prevIndex = queueIndex - 1;
        if (prevIndex < 0) return;

        const prevSong = queue[prevIndex];
        set({ queueIndex: prevIndex });
        get().playSong(prevSong);
    },

    setVolume: (volume) => {
        const { audioRef } = get();
        if (audioRef) audioRef.volume = volume;
        set({ volume });
    },

    setProgress: (progress) => set({ progress }),
    setDuration: (duration) => set({ duration }),

    toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

    toggleRepeat: () =>
        set((state) => ({
            repeat: state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off',
        })),

    setAudioRef: (ref) => set({ audioRef: ref }),
}));
