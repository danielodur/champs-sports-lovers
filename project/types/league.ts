export interface League {
  id: string;
  name: string;
  country: string;
}

// Enhanced interface for comprehensive competition data
export interface Competition extends League {
  type?: 'league' | 'cup' | 'international' | 'continental';
  tier?: number;
  logo?: string;
  startDate?: string;
  endDate?: string;
  participantCount?: number;
  currentSeason?: string;
  isActive?: boolean;
  apiId?: string;
}