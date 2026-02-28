'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';
import MusicPlayer from '@/components/player/MusicPlayer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, initAuth } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = initAuth();
        return unsubscribe;
    }, [initAuth]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-800 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                    <p className="text-dark-300">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="h-screen flex flex-col bg-dark-800">
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto pb-24 bg-gradient-dark rounded-tl-xl">
                    {children}
                </main>
            </div>
            <MusicPlayer />
        </div>
    );
}
