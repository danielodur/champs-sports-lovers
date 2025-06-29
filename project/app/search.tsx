import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function SearchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const getSuggestions = useCallback((query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const allSuggestions = [
      'Premier League',
      'La Liga',
      'Champions League',
      'Manchester United',
      'Real Madrid',
      'Bayern Munich',
      'Lionel Messi',
      'Cristiano Ronaldo',
      'Arsenal vs Bayern',
      'UEFA Champions League',
      'World Cup 2026',
      'AFCON 2024',
      'Uganda Premier League',
      'Serie A',
      'Bundesliga',
      'PSG vs Barcelona',
      'Liverpool FC',
      'Manchester City',
    ];

    const filtered = allSuggestions.filter(item =>
      item.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(filtered);
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    getSuggestions(text);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
  };

  const hotSearches = [
    { id: '1', label: 'Uganda Premier League', rank: 1 },
    { id: '2', label: 'Premier League', rank: 2 },
    { id: '3', label: 'La Liga', rank: 3 },
    { id: '4', label: 'Serie A', rank: 4 },
    { id: '5', label: 'Bundesliga', rank: 5 },
    { id: '6', label: 'Ligue 1', rank: 6 },
    { id: '7', label: 'Champions League', rank: 7 },
    { id: '8', label: 'Europa League', rank: 8 },
    { id: '9', label: 'FIFA World Cup', rank: 9 },
    { id: '10', label: 'African Cup of Nations(AFCON)', rank: 10 },
  ];

  const newsGroups = [
    {
      title: "Today's Hot News",
      news: [
        "Champions League: Tonight's match prediction, Bayern vs Arsenal...",
        "Official: Liverpool signs new right-back from Bundesliga...",
        "🔥 Who will reach the European summit? See predictions...",
        "Breaking: Bayern's 55-year Champions League record...",
        "👀 Royal review: Thunder's veteran player rating...",
        "⚡ Official: Argentina joins Royal Madrid...",
        "❤️ Congratulations to veteran champion! Mother Peiron...",
        "Champions League historical first case! Bayern 5...",
        "⭐ New report: '66 Road' milestone update...",
        "😢 It's over! Bayern fans crying on site..."
      ]
    },
    {
      title: "24h Rising News",
      news: [
        "Champions League: PSG vs Barcelona prediction tonight...",
        "Transfer News: Manchester United targets summer window...",
        "🔥 Premier League title race heats up! See analysis...",
        "Breaking: Real Madrid's new strategy revealed...",
        "👀 Serie A: Inter Milan's championship path...",
        "⚡ Official: Juventus announces new signing...",
        "❤️ Legend retires: Football world pays tribute...",
        "UEFA investigation: Financial fair play case opens...",
        "⭐ Special Report: Next generation stars...",
        "🎯 Goal of the season contenders revealed..."
      ]
    },
    {
      title: "Popular Topics",
      news: [
        "Champions League Quarter-finals: Complete guide...",
        "Summer Transfer Window: Top 10 potential moves...",
        "🔥 European Golden Boot race update...",
        "Breaking: World Cup 2026 preparation news...",
        "👀 VAR controversy: Experts weigh in...",
        "⚡ League standings: Battle for Europe spots...",
        "❤️ Fan favorite moments of the season...",
        "Tactical Analysis: Modern football trends...",
        "⭐ Rising Stars: Next generation talents...",
        "🌟 Historical moments in football..."
      ]
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={[
          styles.searchInputContainer, 
          { 
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border
          }
        ]}>
          <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[
              styles.searchInput, 
              { 
                color: theme.colors.text,
                ...Platform.select({
                  web: {
                    outlineStyle: 'none',
                  }
                })
              }
            ]}
            placeholder="Search matches, teams, players or news"
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
              <X size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => router.back()}
        >
          <Text style={[styles.cancelText, { color: theme.colors.text }]}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {suggestions.length > 0 ? (
        <ScrollView style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestionItem,
                { borderBottomColor: theme.colors.border }
              ]}
              onPress={() => handleSelectSuggestion(suggestion)}
            >
              <Search size={16} color={theme.colors.textSecondary} style={styles.suggestionIcon} />
              <Text style={[styles.suggestionText, { color: theme.colors.text }]}>
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Hot Searches</Text>
          <View style={styles.hotSearchGrid}>
            {hotSearches.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.hotSearchItem,
                  { backgroundColor: theme.colors.backgroundSecondary }
                ]}
              >
                <Text style={[styles.rankNumber, { color: item.rank <= 3 ? theme.colors.primary : theme.colors.textSecondary }]}>
                  {item.rank}
                </Text>
                <Text style={[styles.hotSearchText, { color: theme.colors.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.hotNewsHeader}>
            <Text style={styles.fireEmoji}>🔥</Text>
            <Text style={[styles.hotNewsTitle, { color: theme.colors.text }]}>Hot News</Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.hotNewsContainer}
            pagingEnabled
            decelerationRate="fast"
            snapToInterval={320}
          >
            {newsGroups.map((group, groupIndex) => (
              <View 
                key={groupIndex} 
                style={[
                  styles.newsGroup,
                  { 
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.primary
                  }
                ]}
              >
                <Text style={[styles.newsGroupTitle, { color: theme.colors.primary }]}>{group.title}</Text>
                {group.news.map((news, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.newsItem,
                      { borderBottomColor: theme.colors.border }
                    ]}
                  >
                    <Text style={styles.newsText} numberOfLines={1}>
                      <Text style={[styles.bulletinNumber, { color: theme.colors.primary }]}>{index + 1}. </Text>
                      <Text style={[styles.bulletinText, { color: theme.colors.text }]}>{news}</Text>
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    padding: 0,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  suggestionsContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  hotSearchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  hotSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  rankNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  hotSearchText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  hotNewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  fireEmoji: {
    fontSize: 20,
  },
  hotNewsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  hotNewsContainer: {
    marginHorizontal: -16,
  },
  newsGroup: {
    width: 320,
    height: 380,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginRight: 12,
    padding: 12,
  },
  newsGroupTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  newsItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  newsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  bulletinNumber: {
    fontFamily: 'Inter-SemiBold',
  },
  bulletinText: {
    fontFamily: 'Inter-Regular',
  },
});