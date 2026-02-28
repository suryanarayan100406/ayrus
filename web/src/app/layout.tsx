import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
    title: 'Ayrus Music - Stream Free Music',
    description: 'A modern music streaming platform with free Creative Commons music. Discover, stream, and create playlists.',
    keywords: 'music, streaming, free, creative commons, playlists',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body>{children}</body>
        </html>
    );
}
