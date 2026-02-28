import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    theme: 'dark' | 'light';
    sidebarOpen: boolean;
    queueVisible: boolean;
    toggleTheme: () => void;
    toggleSidebar: () => void;
    toggleQueue: () => void;
    setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            theme: 'dark',
            sidebarOpen: true,
            queueVisible: false,

            toggleTheme: () =>
                set((state) => {
                    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
                    if (typeof document !== 'undefined') {
                        document.documentElement.classList.toggle('dark', newTheme === 'dark');
                    }
                    return { theme: newTheme };
                }),

            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

            toggleQueue: () => set((state) => ({ queueVisible: !state.queueVisible })),

            setSidebarOpen: (open) => set({ sidebarOpen: open }),
        }),
        {
            name: 'spotify-clone-ui',
            partialize: (state) => ({ theme: state.theme }),
        }
    )
);
