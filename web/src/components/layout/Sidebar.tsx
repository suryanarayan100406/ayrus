'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, PlusCircle, Heart, Music, Mic2, Shield, LogOut, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const mainLinks = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/library', label: 'Your Library', icon: Library },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { userProfile, logout } = useAuthStore();
    const { theme, toggleTheme, sidebarOpen } = useUIStore();

    const role = userProfile?.role;

    return (
        <aside className={cn(
            'flex flex-col h-full bg-dark-900 transition-all duration-300',
            sidebarOpen ? 'w-64' : 'w-20'
        )}>
            {/* Logo */}
            <div className="p-6">
                <Link href="/home" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                        <Music className="w-5 h-5 text-black" />
                    </div>
                    {sidebarOpen && <span className="text-xl font-bold">Ayrus</span>}
                </Link>
            </div>

            {/* Main Navigation */}
            <nav className="px-3 space-y-1">
                {mainLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            'nav-link',
                            pathname === link.href && 'active'
                        )}
                    >
                        <link.icon className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span>{link.label}</span>}
                    </Link>
                ))}
            </nav>

            {/* Divider */}
            <div className="mx-3 my-4 h-px bg-white/10" />

            {/* Quick Actions */}
            <div className="px-3 space-y-1">
                <Link href="/library" className="nav-link">
                    <PlusCircle className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span>Create Playlist</span>}
                </Link>
                <Link href="/library" className="nav-link">
                    <Heart className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span>Liked Songs</span>}
                </Link>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Role-specific links */}
            {(role === 'artist' || role === 'admin') && (
                <div className="px-3 space-y-1 mb-2">
                    <div className="mx-1 mb-2 h-px bg-white/10" />
                    {(role === 'artist' || role === 'admin') && (
                        <Link href="/artist-dashboard" className={cn('nav-link', pathname?.startsWith('/artist') && 'active')}>
                            <Mic2 className="w-5 h-5 flex-shrink-0" />
                            {sidebarOpen && <span>Artist Studio</span>}
                        </Link>
                    )}
                    {role === 'admin' && (
                        <Link href="/admin-dashboard" className={cn('nav-link', pathname?.startsWith('/admin') && 'active')}>
                            <Shield className="w-5 h-5 flex-shrink-0" />
                            {sidebarOpen && <span>Admin Panel</span>}
                        </Link>
                    )}
                </div>
            )}

            {/* Bottom Actions */}
            <div className="p-3 space-y-1 border-t border-white/5">
                <button onClick={toggleTheme} className="nav-link w-full">
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5 flex-shrink-0" />
                    ) : (
                        <Moon className="w-5 h-5 flex-shrink-0" />
                    )}
                    {sidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>
                <button onClick={logout} className="nav-link w-full text-red-400 hover:text-red-300">
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span>Log Out</span>}
                </button>
            </div>
        </aside>
    );
}
