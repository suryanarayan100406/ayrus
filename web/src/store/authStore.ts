import { create } from 'zustand';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    User,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { verifyToken } from '@/lib/api';

interface AuthState {
    user: User | null;
    userProfile: any | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
    setUserProfile: (profile: any) => void;
    initAuth: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    userProfile: null,
    loading: true,
    error: null,

    login: async (email, password) => {
        try {
            set({ loading: true, error: null });
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    signup: async (email, password, name) => {
        try {
            set({ loading: true, error: null });
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(cred.user);
            const token = await cred.user.getIdToken();
            await verifyToken(token);
        } catch (err: any) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    loginWithGoogle: async () => {
        try {
            set({ loading: true, error: null });
            const result = await signInWithPopup(auth, googleProvider);
            const token = await result.user.getIdToken();
            await verifyToken(token);
        } catch (err: any) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    logout: async () => {
        await signOut(auth);
        set({ user: null, userProfile: null });
    },

    clearError: () => set({ error: null }),

    setUserProfile: (profile) => set({ userProfile: profile }),

    initAuth: () => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const token = await user.getIdToken();
                    const res = await verifyToken(token);
                    set({ user, userProfile: res.data, loading: false });
                } catch {
                    set({ user, loading: false });
                }
            } else {
                set({ user: null, userProfile: null, loading: false });
            }
        });
        return unsubscribe;
    },
}));
