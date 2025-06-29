import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMatches } from '@/services/matchService';
import { sportsApiService } from '@/services/sportsApiService';
import { useTheme } from '@/hooks/useTheme';

export default function ApiTestScreen() {
  const theme = useTheme();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testLiveMatches = async () => {
    setLoading(true);
    addLog('🔴 Testing Live Matches...');
    
    try {
      const matches = await fetchMatches('football', 'live');
      addLog(`✅ Live Matches: ${matches.length} found`);
      
      if (matches.length > 0) {
        addLog(`📊 First match: ${matches[0].home.name} vs ${matches[0].away.name}`);
        addLog(`📊 League: ${matches[0].league}`);
        addLog(`📊 Status: ${matches[0].status}`);
      }
    } catch (error) {
      addLog(`❌ Live Matches Error: ${error}`);
    }
    
    setLoading(false);
  };

  const testAllMatches = async () => {
    setLoading(true);
    addLog('🏈 Testing All Matches...');
    
    try {
      const matches = await fetchMatches('football', 'all');
      addLog(`✅ All Matches: ${matches.length} found`);
      
      if (matches.length > 0) {
        const live = matches.filter(m => m.status === 'live').length;
        const upcoming = matches.filter(m => m.status === 'upcoming').length;
        const finished = matches.filter(m => m.status === 'finished').length;
        
        addLog(`📊 Breakdown: ${live} live, ${upcoming} upcoming, ${finished} finished`);
      }
    } catch (error) {
      addLog(`❌ All Matches Error: ${error}`);
    }
    
    setLoading(false);
  };

  const testDirectAPI = async () => {
    setLoading(true);
    addLog('🌐 Testing Direct API...');
    
    try {
      const apiData = await sportsApiService.getLiveScores('football');
      addLog(`✅ Direct API: ${apiData.length} results`);
      
      if (apiData.length > 0) {
        addLog(`📊 First API result: ${apiData[0].homeTeam} vs ${apiData[0].awayTeam}`);
        addLog(`📊 API Status: ${apiData[0].status}`);
      }
    } catch (error) {
      addLog(`❌ Direct API Error: ${error}`);
    }
    
    setLoading(false);
  };

  const testFixtures = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    addLog(`📅 Testing Fixtures for today (${today})...`);
    
    try {
      const matches = await fetchMatches('football', 'fixture', today);
      addLog(`✅ Today's Fixtures: ${matches.length} found`);
      
      if (matches.length > 0) {
        addLog(`📊 First fixture: ${matches[0].home.name} vs ${matches[0].away.name}`);
        addLog(`📊 Time: ${new Date(matches[0].startTime).toLocaleTimeString()}`);
      }
    } catch (error) {
      addLog(`❌ Fixtures Error: ${error}`);
    }
    
    setLoading(false);
  };

  const clearLogs = () => {
    setTestResults([]);
    addLog('🧹 Logs cleared');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>API Test Dashboard</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Debug Match Fetching Issues
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testLiveMatches}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Live Matches</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testAllMatches}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test All Matches</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testDirectAPI}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Direct API</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testFixtures}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Today's Fixtures</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: theme.colors.textSecondary }]}
          onPress={clearLogs}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Testing...</Text>
        </View>
      )}

      <ScrollView style={styles.logContainer}>
        {testResults.map((result, index) => (
          <Text key={index} style={[styles.logText, { color: theme.colors.text }]}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  clearButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
  },
}); 