'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Music, Heart, Play, Trash2 } from 'lucide-react';
import { getPlaylists, getLikedSongs, createPlaylist } from '@/lib/api';
import { usePlayerStore, Song } from '@/store/playerStore';
import SongCard from '@/components/cards/SongCard';
import { CardGridSkeleton } from '@/components/skeletons/Skeletons';
import Link from 'next/link';

export default function LibraryPage() {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [likedSongs, setLikedSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const { playQueue } = usePlayerStore();

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [plRes, likedRes] = await Promise.allSettled([
                getPlaylists(),
                getLikedSongs(),
            ]);
            if (plRes.status === 'fulfilled') setPlaylists(plRes.value.data || []);
            if (likedRes.status === 'fulfilled') setLikedSongs(likedRes.value.data || []);
        } catch { }
        setLoading(false);
    }

    async function handleCreate() {
        if (!newName.trim()) return;
        try {
            await createPlaylist(newName);
            setNewName('');
            setShowCreate(false);
            fetchData();
        } catch { }
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Your Library</h1>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="btn-secondary px-4 py-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Playlist
                </button>
            </div>

            {/* Create Playlist Modal */}
            {showCreate && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="glass rounded-xl p-6 mb-6"
                >
                    <h3 className="font-semibold mb-3">New Playlist</h3>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Playlist name..."
                            className="input-field flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                        <button onClick={handleCreate} className="btn-primary px-6">
                            Create
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Liked Songs */}
            <section className="mb-10">
                <div
                    onClick={() => likedSongs.length && playQueue(likedSongs, 0)}
                    className="bg-gradient-to-br from-purple-700 to-blue-800 rounded-xl p-6 cursor-pointer
                   hover:brightness-110 transition-all duration-300 mb-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500
                          flex items-center justify-center">
                            <Heart className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold">Liked Songs</h2>
                            <p className="text-white/70">{likedSongs.length} songs</p>
                        </div>
                        <button className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center
                             hover:scale-110 transition-transform shadow-xl">
                            <Play className="w-5 h-5 text-black ml-0.5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Playlists */}
            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-5">Your Playlists</h2>
                {loading ? (
                    <CardGridSkeleton count={4} />
                ) : playlists.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {playlists.map((pl) => (
                            <Link
                                key={pl.id}
                                href={`/playlist/${pl.id}`}
                                className="card-spotify"
                            >
                                <div className="aspect-square rounded-md bg-gradient-to-br from-dark-500 to-dark-700
                              flex items-center justify-center mb-4">
                                    {pl.coverURL ? (
                                        <img src={pl.coverURL} alt="" className="w-full h-full object-cover rounded-md" />
                                    ) : (
                                        <Music className="w-12 h-12 text-dark-300" />
                                    )}
                                </div>
                                <h3 className="font-semibold text-sm truncate">{pl.name}</h3>
                                <p className="text-xs text-dark-300 mt-1">{pl.songIds?.length || 0} songs</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-dark-300">
                        <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No playlists yet. Create your first one!</p>
                    </div>
                )}
            </section>

            {/* Liked Songs Grid */}
            {likedSongs.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-5">Your Liked Songs</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {likedSongs.map((song, i) => (
                            <SongCard key={song.id || i} song={song} songs={likedSongs} index={i} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
