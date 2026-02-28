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
    volume: 0.7,
    progress: 0,
    duration: 0,
    shuffle: false,
    repeat: 'off',
    audioRef: null,

    playSong: (song) => {
        const { audioRef } = get();
        set({
            currentSong: song,
            isPlaying: true,
            progress: 0,
        });
        if (audioRef) {
            audioRef.src = song.audioURL;
            audioRef.play().catch(() => { });
        }
    },

    playQueue: (songs, startIndex = 0) => {
        const song = songs[startIndex];
        const { audioRef } = get();
        set({
            queue: songs,
            queueIndex: startIndex,
            currentSong: song,
            isPlaying: true,
            progress: 0,
        });
        if (audioRef) {
            audioRef.src = song.audioURL;
            audioRef.play().catch(() => { });
        }
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

    nextSong: () => {
        const { queue, queueIndex, shuffle, repeat, audioRef } = get();
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
                set({ isPlaying: false });
                return;
            }
        }

        const nextSong = queue[nextIndex];
        set({
            currentSong: nextSong,
            queueIndex: nextIndex,
            isPlaying: true,
            progress: 0,
        });
        if (audioRef) {
            audioRef.src = nextSong.audioURL;
            audioRef.play().catch(() => { });
        }
    },

    prevSong: () => {
        const { queue, queueIndex, progress, audioRef } = get();
        if (progress > 3) {
            // Restart current song if more than 3 seconds in
            if (audioRef) {
                audioRef.currentTime = 0;
            }
            set({ progress: 0 });
            return;
        }

        const prevIndex = queueIndex - 1;
        if (prevIndex < 0) return;

        const prevSong = queue[prevIndex];
        set({
            currentSong: prevSong,
            queueIndex: prevIndex,
            isPlaying: true,
            progress: 0,
        });
        if (audioRef) {
            audioRef.src = prevSong.audioURL;
            audioRef.play().catch(() => { });
        }
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
