import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable, SectionList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Flame } from 'lucide-react-native';
import { fetchLeaguesBySport, getHotLeaguesFromData, organizeLeaguesByAlphabet } from '@/services/leagueApiService';
import { useTheme } from '@/hooks/useTheme';

interface League {
  id: string;
  name: string;
  country?: string;
  logo?: string;
  type?: string;
  apiId?: string;
}

export default function LeaguesFilterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { sport } = useLocalSearchParams<{ sport: string }>();
  const currentSport = (sport as string) || 'football';
  
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<Record<string, number>>({});

  // ✅ FETCH LEAGUES FROM API (100% API-DRIVEN with silent fallback)
  useEffect(() => {
    let isMounted = true;

    const loadLeagues = async () => {
      try {
        setLoading(true);
        
        // Silently fetch - will return API data or fallback to static data
        // No error messages shown to users
        const leagues = await fetchLeaguesBySport(currentSport);
        
        if (isMounted) {
          setAllLeagues(leagues);
        }
      } catch (err) {
        // Silent error handling - no console errors shown to users
        if (isMounted) {
          setAllLeagues([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLeagues();

    return () => {
      isMounted = false;
    };
  }, [currentSport]);

  // Get sport-specific leagues organized alphabetically
  const sportLeagues = useMemo(() => {
    return organizeLeaguesByAlphabet(allLeagues);
  }, [allLeagues]);

  // Get hot/featured leagues
  const hotLeagues = useMemo(() => {
    return getHotLeaguesFromData(allLeagues, currentSport);
  }, [allLeagues, currentSport]);

  const alphabet = useMemo(() => {
    const letters = Object.keys(sportLeagues).sort();
    return ['#', ...letters];
  }, [sportLeagues]);

  const toggleLeague = (id: string) => {
    setSelectedLeagues(prev =>
      prev.includes(id)
        ? prev.filter(l => l !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allLeagueIds = allLeagues.map(league => league.id);
    setSelectedLeagues(allLeagueIds);
  };

  const handleReverseSelection = () => {
    const allLeagueIds = allLeagues.map(league => league.id);
    const newSelection = allLeagueIds.filter(id => !selectedLeagues.includes(id));
    setSelectedLeagues(newSelection);
  };

  const handleDone = () => {
    // Save selected leagues and navigate back
    router.back();
  };

  const scrollToLetter = (letter: string) => {
    const yOffset = sectionRefs.current[letter];
    if (yOffset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  const handleLayout = (letter: string) => (event: any) => {
    const layout = event.nativeEvent.layout;
    // Store the Y position of this section relative to ScrollView content
    sectionRefs.current[letter] = layout.y;
  };

  // ✅ INVERTED LOGIC: selectedLeagues = HIDDEN leagues (red), unselected = VISIBLE leagues
  const hiddenCount = useMemo(() => {
    return selectedLeagues.length; // Hidden count = number of selected (red) leagues
  }, [selectedLeagues, currentSport]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Filter</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Grey line under header */}
      <View style={[styles.headerBorder, { backgroundColor: theme.colors.border }]} />

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF5350" />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading {currentSport} leagues...
          </Text>
        </View>
      )}

      {/* Content */}
      {!loading && (
        <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hot Competitions Section */}
        <View style={styles.hotSection} onLayout={handleLayout('#')}>
          <View style={styles.hotHeader}>
            <Flame size={16} color="#EF5350" fill="#EF5350" />
            <Text style={styles.hotTitle}>Hot Competitions</Text>
          </View>
          <View style={styles.hotGrid}>
            {hotLeagues.map((league) => (
              <TouchableOpacity
                key={league.id}
                style={[
                  styles.leagueCard,
                  selectedLeagues.includes(league.id) && styles.leagueCardSelected
                ]}
                onPress={() => toggleLeague(league.id)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.leagueCardText,
                  selectedLeagues.includes(league.id) && styles.leagueCardTextSelected
                ]}>
                  {league.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alphabetical Sections */}
        {alphabet.filter(letter => letter !== '#').map(letter => (
          sportLeagues[letter] && sportLeagues[letter].length > 0 ? (
            <View 
              key={letter} 
              style={styles.leagueSection}
              onLayout={handleLayout(letter)}
            >
              <Text style={[styles.letterHeader, { color: theme.colors.text }]}>{letter}</Text>
              <View style={styles.leagueGrid}>
                {sportLeagues[letter].map((league) => (
                  <TouchableOpacity
                    key={league.id}
                    style={[
                      styles.leagueCard,
                      selectedLeagues.includes(league.id) && styles.leagueCardSelected
                    ]}
                    onPress={() => toggleLeague(league.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.leagueCardText,
                      selectedLeagues.includes(league.id) && styles.leagueCardTextSelected
                    ]}>
                      {league.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        ))}

        {/* Bottom padding for scroll */}
        <View style={{ height: 200 }} />
      </ScrollView>
      )}

      {/* A-Z Alphabet Index */}
      {!loading && (
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
      )}

      {/* Bottom Action Bar */}
      {!loading && (
      <View style={[styles.bottomBar, { 
        backgroundColor: theme.colors.background,
        borderTopColor: theme.colors.border
      }]}>
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              { 
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border
              }
            ]}
            onPress={handleSelectAll}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Select All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton,
              { 
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border
              }
            ]}
            onPress={handleReverseSelection}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Reverse</Text>
          </TouchableOpacity>
          
          <View style={styles.hiddenInfo}>
            <Text style={[styles.hiddenLabel, { color: theme.colors.textSecondary }]}>Hidden</Text>
            <Text style={[styles.hiddenNumber, { color: theme.colors.primary }]}>{hiddenCount}</Text>
            <Text style={[styles.hiddenLabel, { color: theme.colors.textSecondary }]}>matches</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  headerRight: {
    width: 36,
  },
  headerBorder: {
    height: 1,
    width: '100%',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingLeft: 16,
    paddingRight: 32, // ✅ Extra right padding to prevent blocking alphabet index
    paddingTop: 16,
  },
  
  // Hot Section
  hotSection: {
    marginBottom: 24,
  },
  hotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hotTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF', // ✅ White text, only icon is red
    marginLeft: 6,
  },
  hotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  
  // League Section
  leagueSection: {
    marginBottom: 24,
  },
  letterHeader: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  leagueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  
  // League Card - Matching Chinese app design
  leagueCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1C1C1E', // Very dark black background (unselected)
    minWidth: 100,
  },
  leagueCardSelected: {
    backgroundColor: 'rgba(239, 83, 80, 0.15)', // Watery transparent red (selected)
  },
  leagueCardText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF', // White text (unselected)
    textAlign: 'center',
  },
  leagueCardTextSelected: {
    color: '#EF5350', // Red text (selected)
  },
  
  // A-Z Alphabet Index
  alphabetContainer: {
    position: 'absolute',
    right: 4,
    top: 100,
    bottom: 160,
    width: 20,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 8,
  },
  letterButton: {
    width: 20,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterButtonPressed: {
    backgroundColor: 'rgba(239, 83, 80, 0.2)',
    borderRadius: 10,
  },
  alphabetText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
  
  // Bottom Action Bar
  bottomBar: {
    paddingLeft: 16,
    paddingRight: 20, // ✅ Extra right padding to prevent Done button from touching edge
    paddingTop: 12,
    paddingBottom: 24, // ✅ Add bottom padding to prevent touching screen edge
    borderTopWidth: 1,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12, // ✅ Spacing between Select All and Reverse buttons
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  actionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  hiddenInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 80, // ✅ Ensure minimum width to prevent text wrapping
  },
  hiddenLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    flexShrink: 0, // ✅ Prevent text from shrinking and breaking
    textAlign: 'center',
  },
  hiddenNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginVertical: 2,
  },
  doneButton: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#EF5350',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
});
