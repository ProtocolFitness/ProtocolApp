import { create } from 'zustand';
import { today } from '../utils/dateUtils';

interface AppState {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedDate: today(),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
