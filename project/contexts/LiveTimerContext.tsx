import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LiveTimerContextType {
  isBlinking: boolean;
  getCurrentMatchMinute: (matchStartTime: string, statusText: string) => number;
}

const LiveTimerContext = createContext<LiveTimerContextType | undefined>(undefined);

export function LiveTimerProvider({ children }: { children: ReactNode }) {
  const [isBlinking, setIsBlinking] = useState(false);

  // Global blinking timer - syncs across all live matches
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(prev => !prev);
    }, 1000); // Blink every second

    return () => clearInterval(blinkInterval);
  }, []);

  // Calculate realistic match minutes based on start time and current time
  const getCurrentMatchMinute = (matchStartTime: string, statusText: string): number => {
    try {
      // If the statusText already has a specific minute, extract it
      const statusMinute = parseInt(statusText.replace(/[^\d]/g, ''));
      if (statusMinute && statusMinute > 0) {
        return statusMinute;
      }

      // Calculate based on actual elapsed time since match start
      const matchStart = new Date(matchStartTime);
      const now = new Date();
      const elapsedMs = now.getTime() - matchStart.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

      // Ensure we have realistic football match minutes
      if (elapsedMinutes < 0) {
        // Match hasn't started yet
        return 1;
      } else if (elapsedMinutes <= 45) {
        // First half
        return Math.max(1, elapsedMinutes);
      } else if (elapsedMinutes <= 60) {
        // Half-time break (show 45' typically)
        return 45;
      } else if (elapsedMinutes <= 105) {
        // Second half (46-90 minutes)
        const secondHalfMinutes = elapsedMinutes - 15; // Account for 15-min break
        return Math.min(90, Math.max(46, secondHalfMinutes));
      } else {
        // Extra time
        const extraMinutes = elapsedMinutes - 105;
        return 90 + Math.min(30, extraMinutes); // Max 120 minutes total
      }
    } catch (error) {
      console.error('Error calculating match minute:', error);
      // Fallback to a random realistic minute
      return Math.floor(Math.random() * 80) + 10; // 10-89 minutes
    }
  };

  return (
    <LiveTimerContext.Provider value={{ isBlinking, getCurrentMatchMinute }}>
      {children}
    </LiveTimerContext.Provider>
  );
}

export function useLiveTimer() {
  const context = useContext(LiveTimerContext);
  if (context === undefined) {
    throw new Error('useLiveTimer must be used within a LiveTimerProvider');
  }
  return context;
} 