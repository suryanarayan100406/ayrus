'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Mic2, Save, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { updateProfile, registerArtist } from '@/lib/api';

export default function ProfilePage() {
    const { userProfile, setUserProfile } = useAuthStore();
    const [name, setName] = useState(userProfile?.displayName || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [artistName, setArtistName] = useState('');
    const [artistBio, setArtistBio] = useState('');
    const [artistSubmitting, setArtistSubmitting] = useState(false);
    const [artistSubmitted, setArtistSubmitted] = useState(false);

    async function handleSave() {
        setSaving(true);
        try {
            await updateProfile({ displayName: name });
            setUserProfile({ ...userProfile, displayName: name });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch { }
        setSaving(false);
    }

    async function handleArtistRegister() {
        if (!artistName.trim()) return;
        setArtistSubmitting(true);
        try {
            await registerArtist({ displayName: artistName, bio: artistBio });
            setArtistSubmitted(true);
        } catch { }
        setArtistSubmitting(false);
    }

    return (
        <div className="p-6 lg:p-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Profile</h1>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-full bg-dark-600 overflow-hidden flex items-center justify-center">
                    {userProfile?.photoURL ? (
                        <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-12 h-12 text-dark-300" />
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-bold">{userProfile?.displayName || 'User'}</h2>
                    <p className="text-dark-300">{userProfile?.email}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-1 rounded-full bg-primary-500/20 text-primary-400">
                        {userProfile?.role || 'user'}
                    </span>
                </div>
            </div>

            {/* Edit Name */}
            <motion.section className="glass rounded-xl p-6 mb-6">
                <h3 className="font-semibold mb-4">Edit Profile</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-dark-300 mb-1">Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field"
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary"
                    >
                        {saved ? <><Check className="w-4 h-4" /> Saved!</> :
                            saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                </div>
            </motion.section>

            {/* Become Artist */}
            {userProfile?.role === 'user' && !artistSubmitted && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Mic2 className="w-6 h-6 text-purple-400" />
                        <h3 className="font-semibold">Become an Artist</h3>
                    </div>
                    <p className="text-dark-300 text-sm mb-4">
                        Register as an artist to upload your music and grow your audience.
                    </p>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={artistName}
                            onChange={(e) => setArtistName(e.target.value)}
                            placeholder="Artist/Stage name"
                            className="input-field"
                        />
                        <textarea
                            value={artistBio}
                            onChange={(e) => setArtistBio(e.target.value)}
                            placeholder="Short bio (optional)"
                            rows={3}
                            className="input-field resize-none"
                        />
                        <button
                            onClick={handleArtistRegister}
                            disabled={artistSubmitting || !artistName.trim()}
                            className="btn-primary bg-purple-600 hover:bg-purple-500"
                        >
                            {artistSubmitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </motion.section>
            )}

            {artistSubmitted && (
                <div className="glass rounded-xl p-6 border border-green-500/20">
                    <div className="flex items-center gap-3 text-green-400">
                        <Check className="w-6 h-6" />
                        <p className="font-semibold">Application submitted! An admin will review it shortly.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
