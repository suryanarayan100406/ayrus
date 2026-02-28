'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Music, Headphones, Radio, Mic2, Play, ChevronDown } from 'lucide-react';
import { useEffect, useRef } from 'react';

const features = [
    { icon: Music, title: 'Unlimited Streaming', desc: 'Access thousands of free Creative Commons tracks' },
    { icon: Headphones, title: 'High Quality', desc: 'Crystal clear audio streaming with no interruptions' },
    { icon: Radio, title: 'Discover', desc: 'Explore music from Jamendo, Internet Archive & more' },
    { icon: Mic2, title: 'Artist Platform', desc: 'Upload, share, and grow your audience for free' },
];

const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-dark-900 overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center">
                {/* Animated gradient background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-dark-900 to-dark-900" />
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" />
                    <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
                </div>

                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
                    {/* Logo */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500 mb-8"
                    >
                        <Music className="w-10 h-10 text-black" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-6xl md:text-8xl font-black mb-6 tracking-tight"
                    >
                        <span className="text-gradient">Ayrus</span>
                        <span className="text-white"> Music</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-xl md:text-2xl text-dark-300 mb-10 max-w-2xl mx-auto leading-relaxed"
                    >
                        Stream unlimited free music. Discover independent artists.
                        Create playlists. No credit card needed.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Link href="/signup" className="btn-primary text-lg px-10 py-4">
                            <Play className="w-5 h-5" />
                            Start Listening Free
                        </Link>
                        <Link href="/login" className="btn-secondary text-lg px-10 py-4">
                            Sign In
                        </Link>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2"
                    >
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <ChevronDown className="w-8 h-8 text-dark-300" />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-32 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.h2
                        {...fadeInUp}
                        viewport={{ once: true }}
                        whileInView="animate"
                        initial="initial"
                        className="text-4xl md:text-5xl font-bold text-center mb-16"
                    >
                        Everything you need.{' '}
                        <span className="text-gradient">Completely free.</span>
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className="glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 group cursor-pointer"
                            >
                                <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center mb-6 group-hover:bg-primary-500/30 transition-colors">
                                    <feature.icon className="w-7 h-7 text-primary-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-dark-300 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="glass rounded-3xl p-12 text-center">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { num: '500K+', label: 'Free Tracks' },
                                { num: '100%', label: 'Free Forever' },
                                { num: '0', label: 'Credit Card Required' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.15 }}
                                >
                                    <div className="text-5xl font-black text-gradient mb-2">{stat.num}</div>
                                    <div className="text-lg text-dark-300">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto"
                >
                    <h2 className="text-4xl md:text-6xl font-black mb-6">
                        Ready to <span className="text-gradient">start listening</span>?
                    </h2>
                    <p className="text-xl text-dark-300 mb-10">
                        Join thousands of music lovers. No ads, no premium, just music.
                    </p>
                    <Link href="/signup" className="btn-primary text-xl px-12 py-5">
                        <Music className="w-6 h-6" />
                        Get Started Free
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8 px-4 text-center text-dark-400 text-sm">
                <p>© 2026 Ayrus Music. Powered by Creative Commons music.</p>
            </footer>
        </div>
    );
}
