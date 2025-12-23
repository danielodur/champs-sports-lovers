import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';

interface SimpleCountdownProps {
  matchDate: string;
  homeTeam: string;
  awayTeam: string;
}

export default function SimpleCountdown({ matchDate, homeTeam, awayTeam }: SimpleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const targetTime = new Date(matchDate).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

        setTimeLeft(`${days}d ${hours}h ${minutes}m`);

        // Show alert for matches within 1 hour
        if (difference <= 60 * 60 * 1000 && difference > 59 * 60 * 1000) {
          Alert.alert(
            '⏰ Match Starting Soon!',
            `${homeTeam} vs ${awayTeam} starts in less than an hour!`,
            [{ text: 'OK' }]
          );
        }
      } else {
        setTimeLeft('Match Started');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [matchDate, homeTeam, awayTeam]);

  return (
    <View style={{ padding: 10 }}>
      <Text style={{ color: '#FFF', textAlign: 'center' }}>
        {timeLeft && `⏱️ ${timeLeft} until kickoff`}
      </Text>
    </View>
  );
}
