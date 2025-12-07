import { create } from 'zustand';
import { Profile } from '@/types';

interface UserStore {
  profile: Profile | null;
  userId: string | null;
  isLoading: boolean;
  
  // Actions
  setProfile: (profile: Profile | null) => void;
  setUserId: (userId: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  updateCoins: (coins: number) => void;
  updatePlusStatus: (isPlus: boolean) => void;
  incrementFollowers: () => void;
  decrementFollowers: () => void;
  incrementFollowing: () => void;
  decrementFollowing: () => void;
  reset: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  userId: null,
  isLoading: false,
  
  setProfile: (profile) => set({ profile }),
  setUserId: (userId) => set({ userId }),
  setIsLoading: (isLoading) => set({ isLoading }),
  
  updateCoins: (coins) => set((state) => ({
    profile: state.profile ? { ...state.profile, coins } : null
  })),
  
  updatePlusStatus: (isPlus) => set((state) => ({
    profile: state.profile ? { ...state.profile, is_plus_member: isPlus } : null
  })),
  
  incrementFollowers: () => set((state) => ({
    profile: state.profile ? { 
      ...state.profile, 
      followers_count: state.profile.followers_count + 1 
    } : null
  })),
  
  decrementFollowers: () => set((state) => ({
    profile: state.profile ? { 
      ...state.profile, 
      followers_count: Math.max(0, state.profile.followers_count - 1)
    } : null
  })),
  
  incrementFollowing: () => set((state) => ({
    profile: state.profile ? { 
      ...state.profile, 
      following_count: state.profile.following_count + 1 
    } : null
  })),
  
  decrementFollowing: () => set((state) => ({
    profile: state.profile ? { 
      ...state.profile, 
      following_count: Math.max(0, state.profile.following_count - 1)
    } : null
  })),
  
  reset: () => set({ profile: null, userId: null, isLoading: false })
}));
