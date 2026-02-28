'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, BarChart3, Disc, Users, Play, Music, Plus } from 'lucide-react';
import { getArtistProfile, getArtistAnalytics, getArtistAlbums, uploadSong, createAlbum } from '@/lib/api';
import Link from 'next/link';

export default function ArtistDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [albums, setAlbums] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [showAlbum, setShowAlbum] = useState(false);
    const [albumTitle, setAlbumTitle] = useState('');
    const [uploadForm, setUploadForm] = useState({
        title: '', genre: '', albumId: '',
    });

    useEffect(() => {
        fetchAll();
    }, []);

    async function fetchAll() {
        try {
            const [p, a, al] = await Promise.allSettled([
                getArtistProfile(),
                getArtistAnalytics(),
                getArtistAlbums(),
            ]);
            if (p.status === 'fulfilled') setProfile(p.value.data);
            if (a.status === 'fulfilled') setAnalytics(a.value.data);
            if (al.status === 'fulfilled') setAlbums(al.value.data || []);
        } catch { }
    }

    async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setUploading(true);
        try {
            await uploadSong(form);
            setShowUpload(false);
            fetchAll();
        } catch { }
        setUploading(false);
    }

    async function handleCreateAlbum() {
        if (!albumTitle.trim()) return;
        try {
            await createAlbum({ title: albumTitle });
            setAlbumTitle('');
            setShowAlbum(false);
            fetchAll();
        } catch { }
    }

    const stats = [
        { label: 'Total Plays', value: analytics?.totalPlays || 0, icon: Play, color: 'from-green-500 to-emerald-600' },
        { label: 'Songs', value: analytics?.totalSongs || 0, icon: Music, color: 'from-blue-500 to-indigo-600' },
        { label: 'Followers', value: analytics?.followerCount || 0, icon: Users, color: 'from-purple-500 to-pink-600' },
        { label: 'Albums', value: albums.length, icon: Disc, color: 'from-orange-500 to-red-600' },
    ];

    return (
        <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Artist Studio</h1>
                    <p className="text-dark-300 mt-1">Welcome back, {profile?.displayName || 'Artist'}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowAlbum(true)} className="btn-secondary px-4 py-2">
                        <Plus className="w-4 h-4" /> New Album
                    </button>
                    <button onClick={() => setShowUpload(true)} className="btn-primary px-4 py-2">
                        <Upload className="w-4 h-4" /> Upload Song
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`bg-gradient-to-br ${stat.color} rounded-xl p-6`}
                    >
                        <stat.icon className="w-8 h-8 text-white/80 mb-2" />
                        <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                        <p className="text-white/70 text-sm">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold mb-4">Upload New Song</h3>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <input name="title" placeholder="Song title" required className="input-field" />
                        <input name="genre" placeholder="Genre (e.g., Pop, Rock)" className="input-field" />
                        <select name="albumId" className="input-field">
                            <option value="">No album</option>
                            {albums.map((a: any) => (
                                <option key={a.id} value={a.id}>{a.title}</option>
                            ))}
                        </select>
                        <div>
                            <label className="block text-sm text-dark-300 mb-1">Audio File (MP3/WAV, max 15MB)</label>
                            <input name="audio" type="file" accept=".mp3,.wav" required className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm text-dark-300 mb-1">Cover Image (optional)</label>
                            <input name="cover" type="file" accept="image/*" className="input-field" />
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" disabled={uploading} className="btn-primary">
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                            <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* Album Create */}
            {showAlbum && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold mb-4">Create New Album</h3>
                    <div className="flex gap-3">
                        <input value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)}
                            placeholder="Album title" className="input-field flex-1" />
                        <button onClick={handleCreateAlbum} className="btn-primary">Create</button>
                        <button onClick={() => setShowAlbum(false)} className="btn-secondary">Cancel</button>
                    </div>
                </motion.div>
            )}

            {/* Top Songs */}
            {analytics?.topSongs?.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary-500" /> Top Songs
                    </h2>
                    <div className="glass rounded-xl overflow-hidden">
                        {analytics.topSongs.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-3 hover:bg-white/5 transition-colors">
                                <span className="w-6 text-dark-300 text-sm text-right">{i + 1}</span>
                                <div className="w-10 h-10 rounded bg-dark-600 overflow-hidden">
                                    {item.song.coverURL ? (
                                        <img src={item.song.coverURL} alt="" className="w-full h-full object-cover" />
                                    ) : <div className="w-full h-full flex items-center justify-center">🎵</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{item.song.title}</p>
                                </div>
                                <span className="text-dark-300 text-sm">{item.playCount.toLocaleString()} plays</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
