'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Music, Mic2, Shield, Check, X, Trash2, AlertCircle } from 'lucide-react';
import {
    adminGetDashboard, adminGetUsers, adminGetSongs, adminGetArtists,
    adminApproveSong, adminApproveArtist, adminDeleteSong, adminUpdateUserRole,
} from '@/lib/api';

export default function AdminDashboard() {
    const [tab, setTab] = useState<'overview' | 'users' | 'songs' | 'artists'>('overview');
    const [stats, setStats] = useState<any>({});
    const [users, setUsers] = useState<any[]>([]);
    const [songs, setSongs] = useState<any[]>([]);
    const [artists, setArtists] = useState<any[]>([]);

    useEffect(() => { fetchTab(); }, [tab]);

    async function fetchTab() {
        try {
            if (tab === 'overview') {
                const res = await adminGetDashboard();
                setStats(res.data || {});
            } else if (tab === 'users') {
                const res = await adminGetUsers();
                setUsers(res.data || []);
            } else if (tab === 'songs') {
                const res = await adminGetSongs();
                setSongs(res.data || []);
            } else if (tab === 'artists') {
                const res = await adminGetArtists();
                setArtists(res.data || []);
            }
        } catch { }
    }

    const tabs = [
        { key: 'overview', label: 'Overview', icon: Shield },
        { key: 'users', label: 'Users', icon: Users },
        { key: 'songs', label: 'Songs', icon: Music },
        { key: 'artists', label: 'Artists', icon: Mic2 },
    ];

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: 'from-blue-500 to-indigo-600' },
        { label: 'Total Songs', value: stats.totalSongs || 0, icon: Music, color: 'from-green-500 to-emerald-600' },
        { label: 'Artists', value: stats.totalArtists || 0, icon: Mic2, color: 'from-purple-500 to-pink-600' },
        { label: 'Pending Songs', value: stats.pendingSongs || 0, icon: AlertCircle, color: 'from-yellow-500 to-orange-600' },
    ];

    return (
        <div className="p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${tab === t.key ? 'bg-primary-500 text-black' : 'bg-dark-600 text-dark-300 hover:text-white'}`}
                    >
                        <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                ))}
            </div>

            {/* Overview */}
            {tab === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`bg-gradient-to-br ${s.color} rounded-xl p-6`}>
                            <s.icon className="w-8 h-8 text-white/80 mb-2" />
                            <p className="text-3xl font-bold">{s.value}</p>
                            <p className="text-white/70 text-sm">{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Users */}
            {tab === 'users' && (
                <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Email</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Name</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Role</th>
                                <th className="px-6 py-3 text-right text-sm font-medium text-dark-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u: any) => (
                                <tr key={u.uid} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="px-6 py-3 text-sm">{u.email}</td>
                                    <td className="px-6 py-3 text-sm">{u.displayName || '-'}</td>
                                    <td className="px-6 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                                u.role === 'artist' ? 'bg-purple-500/20 text-purple-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                            }`}>{u.role}</span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <select
                                            value={u.role}
                                            onChange={async (e) => {
                                                await adminUpdateUserRole(u.uid, e.target.value);
                                                fetchTab();
                                            }}
                                            className="bg-dark-600 text-sm rounded px-2 py-1 border border-dark-400"
                                        >
                                            <option value="user">User</option>
                                            <option value="artist">Artist</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Songs */}
            {tab === 'songs' && (
                <div className="glass rounded-xl overflow-hidden">
                    {songs.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-4 px-6 py-3 border-b border-white/5 hover:bg-white/5">
                            <div className="w-10 h-10 rounded bg-dark-600 overflow-hidden flex-shrink-0">
                                {s.coverURL ? <img src={s.coverURL} alt="" className="w-full h-full object-cover" /> :
                                    <div className="w-full h-full flex items-center justify-center">🎵</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{s.title}</p>
                                <p className="text-xs text-dark-300">{s.artistName}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${s.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                    s.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                                }`}>{s.status}</span>
                            <div className="flex gap-2">
                                {s.status !== 'approved' && (
                                    <button onClick={async () => { await adminApproveSong(s.id, 'approved'); fetchTab(); }}
                                        className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30">
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                                {s.status !== 'rejected' && (
                                    <button onClick={async () => { await adminApproveSong(s.id, 'rejected'); fetchTab(); }}
                                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={async () => { await adminDeleteSong(s.id); fetchTab(); }}
                                    className="p-1.5 rounded-lg bg-dark-500 text-dark-300 hover:text-red-400">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {songs.length === 0 && <p className="text-center py-8 text-dark-300">No songs</p>}
                </div>
            )}

            {/* Artists */}
            {tab === 'artists' && (
                <div className="glass rounded-xl overflow-hidden">
                    {artists.map((a: any) => (
                        <div key={a.uid} className="flex items-center gap-4 px-6 py-3 border-b border-white/5 hover:bg-white/5">
                            <div className="w-10 h-10 rounded-full bg-dark-600 overflow-hidden flex-shrink-0">
                                {a.photoURL ? <img src={a.photoURL} alt="" className="w-full h-full object-cover" /> :
                                    <div className="w-full h-full flex items-center justify-center">🎤</div>}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">{a.displayName}</p>
                                <p className="text-xs text-dark-300">{a.bio || 'No bio'}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${a.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                    a.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                                }`}>{a.status}</span>
                            <div className="flex gap-2">
                                {a.status !== 'approved' && (
                                    <button onClick={async () => { await adminApproveArtist(a.uid, 'approved'); fetchTab(); }}
                                        className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30">
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                                {a.status !== 'rejected' && (
                                    <button onClick={async () => { await adminApproveArtist(a.uid, 'rejected'); fetchTab(); }}
                                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {artists.length === 0 && <p className="text-center py-8 text-dark-300">No artist applications</p>}
                </div>
            )}
        </div>
    );
}
