import { create } from 'zustand';
import { Game } from '@/types';

interface GameStore {
  likedGames: Set<string>;
  playedGames: Set<string>;
  selectedGame: Game | null;
  
  // Actions
  setLikedGames: (gameIds: string[]) => void;
  addLikedGame: (gameId: string) => void;
  removeLikedGame: (gameId: string) => void;
  toggleLike: (gameId: string) => void;
  
  setPlayedGames: (gameIds: string[]) => void;
  addPlayedGame: (gameId: string) => void;
  
  setSelectedGame: (game: Game | null) => void;
  
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  likedGames: new Set<string>(),
  playedGames: new Set<string>(),
  selectedGame: null,
  
  setLikedGames: (gameIds) => set({ likedGames: new Set(gameIds) }),
  
  addLikedGame: (gameId) => set((state) => {
    const newSet = new Set(state.likedGames);
    newSet.add(gameId);
    return { likedGames: newSet };
  }),
  
  removeLikedGame: (gameId) => set((state) => {
    const newSet = new Set(state.likedGames);
    newSet.delete(gameId);
    return { likedGames: newSet };
  }),
  
  toggleLike: (gameId) => set((state) => {
    const newSet = new Set(state.likedGames);
    if (newSet.has(gameId)) {
      newSet.delete(gameId);
    } else {
      newSet.add(gameId);
    }
    return { likedGames: newSet };
  }),
  
  setPlayedGames: (gameIds) => set({ playedGames: new Set(gameIds) }),
  
  addPlayedGame: (gameId) => set((state) => {
    const newSet = new Set(state.playedGames);
    newSet.add(gameId);
    return { playedGames: newSet };
  }),
  
  setSelectedGame: (game) => set({ selectedGame: game }),
  
  reset: () => set({ 
    likedGames: new Set(), 
    playedGames: new Set(),
    selectedGame: null 
  })
}));
