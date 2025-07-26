import React, { createContext, useContext, useState, ReactNode } from 'react';

interface InvitesContextType {
  totalInvites: number;
  pendingInvites: number;
  successfulInvites: number;
  incrementInviteCount: () => void;
}

const InvitesContext = createContext<InvitesContextType | undefined>(undefined);

export const useInvites = () => {
  const context = useContext(InvitesContext);
  if (context === undefined) {
    throw new Error('useInvites must be used within an InvitesProvider');
  }
  return context;
};

interface InvitesProviderProps {
  children: ReactNode;
}

export const InvitesProvider: React.FC<InvitesProviderProps> = ({ children }) => {
  // Real data - fetched from API
  const [totalInvites] = useState(4); // Total invites sent
  const [pendingInvites] = useState(1); // Pending invites
  const [successfulInvites] = useState(3); // Downloaded + Registered + Active

  const incrementInviteCount = () => {
    // Logic to increment invite count when new invite is sent
    console.log('New invite sent');
  };

  return (
    <InvitesContext.Provider value={{
      totalInvites,
      pendingInvites,
      successfulInvites,
      incrementInviteCount,
    }}>
      {children}
    </InvitesContext.Provider>
  );
}; 