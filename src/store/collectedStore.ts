import {create} from 'zustand';
import {persist, type StorageValue} from 'zustand/middleware';

interface CollectedState {
    collectedIds: Set<number>;
    toggleCollected: (id: number) => void;
    isCollected: (id: number) => boolean;
    collectedCount: () => number;
}

/**
 * Custom storage adapter that serializes Set<number> as a JSON array
 * and deserializes it back into a Set. This is needed because JSON.stringify
 * converts Set to {} by default.
 */
const collectedStorage = {
    getItem: (name: string): StorageValue<CollectedState> | null => {
        const raw = localStorage.getItem(name);
        if (!raw) return null;

        try {
            const parsed = JSON.parse(raw) as StorageValue<{
                collectedIds: number[];
            }>;
            return {
                ...parsed,
                state: {
                    ...parsed.state,
                    collectedIds: new Set(parsed.state.collectedIds),
                } as unknown as CollectedState,
            };
        } catch {
            return null;
        }
    },

    setItem: (name: string, value: StorageValue<CollectedState>): void => {
        const serializable = {
            ...value,
            state: {
                ...value.state,
                collectedIds: Array.from(value.state.collectedIds),
            },
        };
        localStorage.setItem(name, JSON.stringify(serializable));
    },

    removeItem: (name: string): void => {
        localStorage.removeItem(name);
    },
};

export const useCollectedStore = create<CollectedState>()(
    persist(
        (set, get) => ({
            collectedIds: new Set<number>(),

            toggleCollected: (id: number) => {
                set((state) => {
                    const next = new Set(state.collectedIds);
                    if (next.has(id)) {
                        next.delete(id);
                    } else {
                        next.add(id);
                    }
                    return {collectedIds: next};
                });
            },

            isCollected: (id: number) => {
                return get().collectedIds.has(id);
            },

            collectedCount: () => {
                return get().collectedIds.size;
            },
        }),
        {
            name: 'collected-artworks',
            storage: collectedStorage,
            // Only persist the collectedIds, not the action functions
            partialize: (state) => ({collectedIds: state.collectedIds}) as unknown as CollectedState,
        },
    ),
);
