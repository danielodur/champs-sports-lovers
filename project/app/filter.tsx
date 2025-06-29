import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { getLeaguesBySport, organizeLeaguesByAlphabet, getAllLeagueIds } from '@/services/leagueService';
import { useTheme } from '@/hooks/useTheme';

export default function FilterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { sport } = useLocalSearchParams<{ sport: string }>();
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<Record<string, number>>({});

  const sportLeagues = useMemo(() => {
    const leagueList = getLeaguesBySport(sport || 'football');
    return organizeLeaguesByAlphabet(leagueList);
  }, [sport]);

  const alphabet = useMemo(() => {
    return Object.keys(sportLeagues).sort();
  }, [sportLeagues]);

  const toggleLeague = (id: string) => {
    setSelectedLeagues(prev =>
      prev.includes(id)
        ? prev.filter(l => l !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allLeagueIds = getAllLeagueIds(sport || 'football');
    setSelectedLeagues(allLeagueIds);
  };

  const handleClearAll = () => {
    setSelectedLeagues([]);
  };

  const handleDone = () => {
    // Here you would typically save the selected leagues to your app's state
    router.back();
  };

  const scrollToLetter = (letter: string) => {
    const yOffset = sectionRefs.current[letter];
    if (yOffset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  const handleLayout = (letter: string, event: any) => {
    const layout = event.nativeEvent.layout;
    sectionRefs.current[letter] = layout.y;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Filter Leagues</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {alphabet.map(letter => (
          <View 
            key={letter} 
            style={styles.leagueSection}
            onLayout={(event) => handleLayout(letter, event)}
          >
            <Text style={[styles.letterHeader, { color: theme.colors.text }]}>{letter}</Text>
            <View style={styles.leagueGrid}>
              {sportLeagues[letter].map((league) => (
                <TouchableOpacity
                  key={league.id}
                  style={[
                    styles.leagueItem,
                    { backgroundColor: theme.colors.backgroundSecondary },
                    selectedLeagues.includes(league.id) && styles.selectedLeague
                  ]}
                  onPress={() => toggleLeague(league.id)}
                >
                  <Text style={[
                    styles.leagueText,
                    { color: theme.colors.text },
                    selectedLeagues.includes(league.id) && styles.selectedLeagueText
                  ]}>
                    {league.name}
                  </Text>
                  <Text style={[styles.countryText, { color: theme.colors.textSecondary }]}>
                    {league.country}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.alphabetContainer}>
        {alphabet.map(letter => (
          <Pressable
            key={letter}
            onPress={() => scrollToLetter(letter)}
            style={({ pressed }) => [
              styles.letterButton,
              pressed && styles.letterButtonPressed
            ]}
          >
            <Text style={[styles.alphabetText, { color: theme.colors.text }]}>{letter}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.bottomBar, { 
        backgroundColor: theme.colors.backgroundSecondary,
        borderTopColor: theme.colors.border
      }]}>
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
            onPress={handleClearAll}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
            onPress={handleSelectAll}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Select All</Text>
          </TouchableOpacity>
          
          <View style={styles.selectedContainer}>
            <Text style={[styles.selectedLabel, { color: theme.colors.textSecondary }]}>Selected</Text>
            <Text style={[styles.selectedNumber, { color: theme.colors.primary }]}>{selectedLeagues.length}</Text>
            <Text style={[styles.matchesText, { color: theme.colors.textSecondary }]}>leagues</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.doneButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  headerRight: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  leagueSection: {
    marginBottom: 24,
  },
  letterHeader: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  leagueGrid: {
    gap: 12,
  },
  leagueItem: {
    padding: 16,
    borderRadius: 12,
  },
  selectedLeague: {
    backgroundColor: '#EF5350',
  },
  leagueText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  selectedLeagueText: {
    color: '#FFFFFF',
  },
  countryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  alphabetContainer: {
    position: 'absolute',
    right: 8,
    top: 60,
    bottom: 90,
    width: 24,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  letterButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  letterButtonPressed: {
    backgroundColor: '#EF5350',
  },
  alphabetText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  bottomBar: {
    padding: 20,
    borderTopWidth: 1,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  selectedContainer: {
    alignItems: 'center',
  },
  selectedLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginBottom: 2,
  },
  selectedNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 2,
  },
  matchesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  doneButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
});