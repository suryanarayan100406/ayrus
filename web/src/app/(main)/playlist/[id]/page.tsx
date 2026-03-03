'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Play, Share2, Lock, Globe, Trash2, Edit2, Loader2, Music } from 'lucide-react';
import { getPlaylist, deletePlaylist, updatePlaylist, removeSongFromPlaylist } from '@/lib/api';
import { usePlayerStore, Song } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import SongCard from '@/components/cards/SongCard';
import { CardGridSkeleton } from '@/components/skeletons/Skeletons';

export default function PlaylistPage() {
    const params = useParams();
    const id = params?.id as string;
    const { userProfile } = useAuthStore();
    const { playQueue } = usePlayerStore();

    const [playlist, setPlaylist] = useState<any>(null);
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');

    const isOwner = userProfile?.uid && playlist?.userId === userProfile.uid;

    useEffect(() => {
        if (id) fetchPlaylist();
    }, [id]);

    async function fetchPlaylist() {
        setLoading(true);
        setError('');
        try {
            const data = await getPlaylist(id);
            setPlaylist(data.playlist);
            setSongs(data.songs || []);
            setEditName(data.playlist.name);
        } catch (err: any) {
            setError(err.message || 'Failed to load playlist');
        }
        setLoading(false);
    }

    async function handleShare() {
        if (!playlist) return;
        const url = `${window.location.origin}/playlist/${id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function handleTogglePrivacy() {
        if (!isOwner) return;
        try {
            await updatePlaylist(id, { isPublic: !playlist.isPublic });
            setPlaylist({ ...playlist, isPublic: !playlist.isPublic });
        } catch (err) {
            alert('Failed to update privacy');
        }
    }

    async function handleSaveEdit() {
        if (!isOwner || !editName.trim()) return setIsEditing(false);
        try {
            await updatePlaylist(id, { name: editName });
            setPlaylist({ ...playlist, name: editName });
            setIsEditing(false);
        } catch (err) {
            alert('Failed to update name');
        }
    }

    async function handleRemoveSong(songId: string) {
        if (!isOwner) return;
        try {
            await removeSongFromPlaylist(id, songId);
            setSongs(songs.filter(s => s.id !== songId));
        } catch (err) {
            alert('Failed to remove song');
        }
    }

    if (loading) return <div className="p-8"><CardGridSkeleton count={8} /></div>;

    if (error) return (
        <div className="flex flex-col items-center justify-center p-20 text-center">
            <Lock className="w-16 h-16 text-dark-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-dark-300">{error}</p>
        </div>
    );

    if (!playlist) return null;

    return (
        <div className="p-6 lg:p-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-8 items-end mb-10">
                <div className="w-48 h-48 md:w-64 md:h-64 shadow-2xl rounded-xl bg-gradient-to-br from-dark-500 to-dark-700 flex items-center justify-center flex-shrink-0">
                    {playlist.coverURL ? (
                        <img src={playlist.coverURL} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                        <Music className="w-24 h-24 text-dark-300" />
                    )}
                </div>

                <div className="flex-1 w-full relative group">
                    <p className="text-sm font-semibold uppercase tracking-wider text-dark-200 mb-2">Playlist</p>

                    {isEditing ? (
                        <div className="flex items-center gap-3">
                            <input
                                autoFocus
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="bg-transparent text-5xl md:text-7xl font-black focus:outline-none border-b border-white/20 w-full"
                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                            />
                            <button onClick={handleSaveEdit} className="btn-secondary whitespace-nowrap">Save</button>
                        </div>
                    ) : (
                        <h1 className="text-5xl md:text-7xl font-black mb-4 truncate w-full cursor-pointer hover:underline" onClick={() => isOwner && setIsEditing(true)}>
                            {playlist.name}
                        </h1>
                    )}

                    <div className="flex items-center gap-4 text-sm text-dark-300 mt-4">
                        <p className="font-semibold text-white">Owner: {playlist.userId === userProfile?.uid ? 'You' : 'User'}</p>
                        <span>•</span>
                        <p>{songs.length} songs</p>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            {playlist.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            <span>{playlist.isPublic ? 'Public' : 'Private'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-6 mb-10">
                <button
                    onClick={() => songs.length && playQueue(songs, 0)}
                    disabled={!songs.length}
                    className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-xl"
                >
                    <Play className="w-6 h-6 text-black ml-1" />
                </button>

                <button
                    onClick={handleShare}
                    className="p-3 text-dark-200 hover:text-white transition-colors"
                >
                    {copied ? <p className="text-sm text-primary-400 font-medium">Copied Link!</p> : <Share2 className="w-6 h-6" />}
                </button>

                {isOwner && (
                    <button
                        onClick={handleTogglePrivacy}
                        className="px-4 py-2 rounded-full border border-white/10 hover:border-white/30 text-sm font-medium transition-colors ml-auto"
                    >
                        Make {playlist.isPublic ? 'Private' : 'Public'}
                    </button>
                )}
            </div>

            {/* Song List */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {songs.map((song, i) => (
                    <div key={song.id || i} className="relative group">
                        <SongCard song={song} songs={songs} index={i} />
                        {isOwner && (
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveSong(song.id!); }}
                                className="absolute top-2 right-2 p-2 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/80 hover:text-white transition-all z-10"
                                title="Remove from playlist"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}

                {songs.length === 0 && (
                    <div className="col-span-full py-20 text-center text-dark-300">
                        <Music className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <h3 className="text-xl font-semibold text-white mb-2">It's a bit empty here...</h3>
                        {isOwner ? (
                            <p>Go to Search or Home to find songs and add them to this playlist!</p>
                        ) : (
                            <p>This user hasn't added any songs to this playlist yet.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

