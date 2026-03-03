'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { User, Share2, Music, Users, Shield, Copy, Check } from 'lucide-react';
import { getPublicProfile } from '@/lib/api';
import { CardGridSkeleton } from '@/components/skeletons/Skeletons';
import Link from 'next/link';

export default function PublicProfilePage() {
    const params = useParams();
    const id = params?.id as string;

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (id) fetchProfile();
    }, [id]);

    async function fetchProfile() {
        setLoading(true);
        setError('');
        try {
            const data = await getPublicProfile(id);
            setProfile(data);
        } catch (err: any) {
            setError(err.message || 'User not found');
        }
        setLoading(false);
    }

    function handleShare() {
        const url = `${window.location.origin}/user/${id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (loading) return <div className="p-8"><CardGridSkeleton count={4} /></div>;

    if (error || !profile) return (
        <div className="flex flex-col items-center justify-center p-20 text-center">
            <User className="w-16 h-16 text-dark-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <p className="text-dark-300">{error || "This profile doesn't exist or is private."}</p>
        </div>
    );

    const isAdmin = profile.role === 'admin';
    const isArtist = profile.role === 'artist';

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-end mb-12">
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-dark-600 overflow-hidden flex items-center justify-center shadow-2xl flex-shrink-0 border-4 border-dark-800">
                    {profile.photoURL ? (
                        <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-24 h-24 text-dark-300" />
                    )}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <p className="text-sm font-semibold uppercase tracking-wider text-dark-200 mb-2">Profile</p>
                    <h1 className="text-5xl md:text-7xl font-black mb-4 truncate w-full flex items-center justify-center md:justify-start gap-4">
                        {profile.displayName || 'Anonymous User'}
                        {isAdmin && <Shield className="w-8 h-8 text-primary-500 flex-shrink-0" />}
                        {isArtist && <Music className="w-8 h-8 text-blue-400 flex-shrink-0" />}
                    </h1>

                    <div className="flex items-center justify-center md:justify-start gap-6 text-sm text-dark-200 mt-2 font-medium">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{profile.followersCount || 0} Following</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            <span>{profile.playlists?.length || 0} Public Playlists</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 hover:border-white hover:bg-white/5 transition-all text-sm font-semibold tracking-wide"
                >
                    {copied ? <Check className="w-4 h-4 text-primary-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Link Copied' : 'Share Profile'}
                </button>
            </div>

            {/* Public Playlists */}
            <section>
                <h2 className="text-2xl font-bold mb-6">Public Playlists</h2>
                {profile.playlists && profile.playlists.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {profile.playlists.map((pl: any) => (
                            <Link
                                key={pl.id}
                                href={`/playlist/${pl.id}`}
                                className="card-spotify group"
                            >
                                <div className="aspect-square rounded-md bg-gradient-to-br from-dark-500 to-dark-700 flex items-center justify-center mb-4 relative shadow-lg">
                                    {pl.coverURL ? (
                                        <img src={pl.coverURL} alt="" className="w-full h-full object-cover rounded-md" />
                                    ) : (
                                        <Music className="w-12 h-12 text-dark-300 group-hover:scale-110 transition-transform duration-500" />
                                    )}
                                </div>
                                <h3 className="font-semibold text-sm truncate">{pl.name}</h3>
                                <p className="text-xs text-dark-300 mt-1">{pl.songIds ? pl.songIds.length : 0} songs</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-dark-300 bg-dark-800 p-6 rounded-xl border border-white/5 flex items-center gap-3">
                        <Music className="w-5 h-5 opacity-50" />
                        This user hasn't created any public playlists yet.
                    </p>
                )}
            </section>
        </div>
    );
}
