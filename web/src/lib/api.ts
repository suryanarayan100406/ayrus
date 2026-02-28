import { auth } from './firebase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

async function getAuthHeaders(): Promise<HeadersInit> {
    const user = auth.currentUser;
    if (!user) return {};
    const token = await user.getIdToken();
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers },
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'API request failed');
    }
    return data;
}

// Auth
export const verifyToken = (token: string) =>
    apiFetch('/auth/verify-token', { method: 'POST', body: JSON.stringify({ token }) });

// Users
export const getCurrentUser = () => apiFetch('/users/me');
export const updateProfile = (data: { displayName?: string; photoURL?: string }) =>
    apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(data) });
export const getLikedSongs = () => apiFetch('/users/me/liked-songs');

// Songs
export const getSongs = (params?: { limit?: number; genre?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch(`/songs?${qs}`);
};
export const getSong = (id: string) => apiFetch(`/songs/${id}`);
export const streamSong = (id: string) => apiFetch(`/songs/${id}/stream`);
export const recordPlay = (id: string) => apiFetch(`/songs/${id}/play`, { method: 'POST' });
export const likeSong = (id: string) => apiFetch(`/songs/${id}/like`, { method: 'POST' });

// Playlists
export const getPlaylists = () => apiFetch('/playlists');
export const getPlaylist = (id: string) => apiFetch(`/playlists/${id}`);
export const createPlaylist = (name: string, isPublic = false) =>
    apiFetch('/playlists', { method: 'POST', body: JSON.stringify({ name, isPublic }) });
export const updatePlaylist = (id: string, data: any) =>
    apiFetch(`/playlists/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePlaylist = (id: string) =>
    apiFetch(`/playlists/${id}`, { method: 'DELETE' });
export const addSongToPlaylist = (playlistId: string, songId: string) =>
    apiFetch(`/playlists/${playlistId}/songs`, { method: 'POST', body: JSON.stringify({ songId }) });
export const removeSongFromPlaylist = (playlistId: string, songId: string) =>
    apiFetch(`/playlists/${playlistId}/songs/${songId}`, { method: 'DELETE' });

// Artists
export const getArtist = (id: string) => apiFetch(`/artists/${id}`);
export const followArtist = (id: string) => apiFetch(`/artists/${id}/follow`, { method: 'POST' });
export const registerArtist = (data: { displayName: string; bio?: string }) =>
    apiFetch('/artist/register', { method: 'POST', body: JSON.stringify(data) });

// Artist panel
export const getArtistProfile = () => apiFetch('/artist/profile');
export const updateArtistProfile = (data: any) =>
    apiFetch('/artist/profile', { method: 'PUT', body: JSON.stringify(data) });
export const getArtistAnalytics = () => apiFetch('/artist/analytics');
export const getArtistAlbums = () => apiFetch('/artist/albums');
export const createAlbum = (data: { title: string; year?: number }) =>
    apiFetch('/artist/albums', { method: 'POST', body: JSON.stringify(data) });

// Upload
export const uploadSong = async (formData: FormData) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();
    const res = await fetch(`${API_BASE}/artist/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    return res.json();
};

// Search
export const search = (q: string) => apiFetch(`/search?q=${encodeURIComponent(q)}`);

// Recommendations
export const getRecommendations = (limit = 20) => apiFetch(`/recommendations?limit=${limit}`);

// Recently played
export const getRecentlyPlayed = () => apiFetch('/recently-played');

// Music discovery
export const discoverJamendo = (params?: { q?: string; genre?: string; limit?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch(`/discover/jamendo?${qs}`);
};
export const discoverFMA = (params?: { q?: string; limit?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch(`/discover/fma?${qs}`);
};
export const discoverArchive = (params?: { q?: string; limit?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch(`/discover/archive?${qs}`);
};

// Admin
export const adminGetDashboard = () => apiFetch('/admin/dashboard');
export const adminGetUsers = () => apiFetch('/admin/users');
export const adminGetSongs = (status?: string) =>
    apiFetch(`/admin/songs${status ? `?status=${status}` : ''}`);
export const adminGetArtists = (status?: string) =>
    apiFetch(`/admin/artists${status ? `?status=${status}` : ''}`);
export const adminApproveSong = (id: string, status: string) =>
    apiFetch(`/admin/songs/${id}/approve`, { method: 'PUT', body: JSON.stringify({ status }) });
export const adminApproveArtist = (id: string, status: string) =>
    apiFetch(`/admin/artists/${id}/approve`, { method: 'PUT', body: JSON.stringify({ status }) });
export const adminUpdateUserRole = (id: string, role: string) =>
    apiFetch(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
export const adminDeleteSong = (id: string) =>
    apiFetch(`/admin/songs/${id}`, { method: 'DELETE' });
