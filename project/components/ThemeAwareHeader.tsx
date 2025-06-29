import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

interface ThemeAwareHeaderProps {
  children: React.ReactNode;
}

export default function ThemeAwareHeader({ children }: ThemeAwareHeaderProps) {
  const theme = useTheme();

  return (
    <>
      <StatusBar 
        barStyle={theme.colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} 
        backgroundColor={theme.colors.backgroundSecondary} 
        translucent 
      />
      <View style={[
        styles.headerBackground, 
        { 
          backgroundColor: theme.colors.backgroundSecondary,
          shadowColor: theme.colors.background === '#FFFFFF' ? '#000000' : '#000000',
        }
      ]}>
        {/* Safe area for status bar */}
        <SafeAreaView edges={['top']} />
        
        {/* Header content */}
        <View style={styles.headerWrapper}>
          {children}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  headerWrapper: {
    paddingTop: 16,
  },
}); 