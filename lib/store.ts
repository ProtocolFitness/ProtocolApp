import { create } from "zustand";

interface AppStore {
  analyzingPostId: number | null;
  setAnalyzingPostId: (id: number | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  analyzingPostId: null,
  setAnalyzingPostId: (id) => set({ analyzingPostId: id }),
}));
