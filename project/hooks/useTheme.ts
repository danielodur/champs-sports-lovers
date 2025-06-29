import { useColorScheme } from 'react-native';
import { create } from 'zustand';

interface ThemeState {
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
}));

type Theme = {
  colors: {
    background: string;
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    border: string;
  };
};

const lightTheme: Theme = {
  colors: {
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
    text: '#121212',
    textSecondary: '#666666',
    primary: '#E53935',
    secondary: '#1E88E5',
    accent: '#FFB300',
    success: '#43A047',
    warning: '#FB8C00',
    error: '#E53935',
    border: '#E0E0E0',
  },
};

const darkTheme: Theme = {
  colors: {
    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    primary: '#EF5350',
    secondary: '#42A5F5',
    accent: '#FFD54F',
    success: '#66BB6A',
    warning: '#FFA726',
    error: '#EF5350',
    border: '#2A2A2A',
  },
};

function isDayTime(): boolean {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // Convert 6:55 AM and 6:55 PM to minutes for comparison
  const morningStart = 6 * 60 + 55; // 6:55 AM
  const eveningStart = 18 * 60 + 55; // 6:55 PM
  
  return totalMinutes >= morningStart && totalMinutes < eveningStart;
}

export function useTheme(): Theme {
  const systemColorScheme = useColorScheme();
  const { theme } = useThemeStore();
  
  if (theme === 'system') {
    return isDayTime() ? lightTheme : darkTheme;
  }
  
  return theme === 'light' ? lightTheme : darkTheme;
}

export function useThemeMode() {
  return useThemeStore((state) => ({
    theme: state.theme,
    setTheme: state.setTheme,
  }));
}