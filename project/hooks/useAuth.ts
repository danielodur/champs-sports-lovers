import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  isLoggedIn: boolean;
  userInfo: {
    username: string;
    avatar?: string;
  } | null;
  setLoggedIn: (loggedIn: boolean, userInfo?: { username: string; avatar?: string }) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

const useAuth = create<AuthState>((set) => ({
  isLoggedIn: false,
  userInfo: null,
  setLoggedIn: (loggedIn, userInfo) => {
    set({ isLoggedIn: loggedIn, userInfo: userInfo || null });
    if (loggedIn && userInfo) {
      AsyncStorage.setItem('userAuth', JSON.stringify({ isLoggedIn: true, userInfo }));
    } else {
      AsyncStorage.removeItem('userAuth');
    }
  },
  logout: () => {
    set({ isLoggedIn: false, userInfo: null });
    AsyncStorage.removeItem('userAuth');
    console.log('User logged out successfully');
  },
  initializeAuth: async () => {
    try {
      const storedAuth = await AsyncStorage.getItem('userAuth');
      if (storedAuth) {
        const { isLoggedIn, userInfo } = JSON.parse(storedAuth);
        set({ isLoggedIn, userInfo });
      } else {
        // For initial app launch, ensure user starts logged out
        set({ isLoggedIn: false, userInfo: null });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Fallback to logged out state
      set({ isLoggedIn: false, userInfo: null });
    }
  },
}));

export default useAuth; 