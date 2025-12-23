import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { TeamRanking } from './team-rankings';
import teamRankingsService from '../services/teamRankingsService';

const RankingTest: React.FC = () => {
  const theme = useTheme();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testTeams = [
    { id: 33, name: 'Manchester United', leagueId: 39, leagueName: 'Premier League' },
    { id: 40, name: 'Liverpool', leagueId: 39, leagueName: 'Premier League' },
    { id: 50, name: 'Manchester City', leagueId: 39, leagueName: 'Premier League' },
    { id: 42, name: 'Arsenal', leagueId: 39, leagueName: 'Premier League' },
    { id: 541, name: 'Real Madrid', leagueId: 140, leagueName: 'La Liga' },
    { id: 529, name: 'Barcelona', leagueId: 140, leagueName: 'La Liga' },
    { id: null, name: 'Brazil', leagueId: null, leagueName: 'World Cup' },
    { id: null, name: 'Argentina', leagueId: null, leagueName: 'World Cup' },
  ];

  const runRankingTest = async () => {
    setIsLoading(true);
    const results: any[] = [];

    console.log('🏆 RANKING TEST STARTED');

    for (const team of testTeams) {
      try {
        console.log(`🏆 Testing: ${team.name} in ${team.leagueName}`);

        const ranking = await teamRankingsService.getTeamRankingForDisplay(
          team.id,
          team.name,
          team.leagueId,
          team.leagueName
        );

        const result = {
          ...team,
          ranking: ranking,
          status: ranking ? 'SUCCESS' : 'NO_RANKING',
          timestamp: new Date().toISOString()
        };

        results.push(result);
        console.log(`🏆 Result: ${team.name} = [${ranking || 'N/A'}]`);
      } catch (error) {
        const result = {
          ...team,
          ranking: null,
          status: 'ERROR',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        };
        results.push(result);
        console.error(`🏆 Error for ${team.name}:`, error);
      }
    }

    console.log('🏆 RANKING TEST COMPLETED');
    console.log('🏆 RESULTS SUMMARY:', results);
    setTestResults(results);
    setIsLoading(false);
  };

  const testBatchRankings = async () => {
    setIsLoading(true);
    console.log('🏆 BATCH RANKING TEST STARTED');

    try {
      const rankingsMap = await teamRankingsService.getBatchTeamRankings(testTeams);

      const batchResults = testTeams.map(team => ({
        ...team,
        ranking: rankingsMap.get(team.name) || null,
        status: rankingsMap.get(team.name) ? 'BATCH_SUCCESS' : 'BATCH_NO_RANKING',
        timestamp: new Date().toISOString()
      }));

      console.log('🏆 BATCH RESULTS:', batchResults);
      setTestResults(batchResults);
    } catch (error) {
      console.error('🏆 BATCH ERROR:', error);
      setTestResults([{
        name: 'BATCH_TEST',
        status: 'BATCH_ERROR',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }]);
    }

    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
    teamRankingsService.clearCache();
    console.log('🏆 Cache cleared and results reset');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          🏆 Team Ranking System Test
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Verify that rankings are loading properly
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={runRankingTest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test Individual Rankings'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FF6B35' }]}
          onPress={testBatchRankings}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test Batch Rankings'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#95A5A6' }]}
          onPress={clearResults}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {testResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
            Test Results ({testResults.length})
          </Text>

          {testResults.map((result, index) => (
            <View
              key={index}
              style={[
                styles.resultItem,
                { backgroundColor: theme.colors.backgroundSecondary },
              ]}
            >
              <View style={styles.resultHeader}>
                <Text style={[styles.teamName, { color: theme.colors.text }]}>
                  {result.name}
                </Text>
                <View style={styles.statusContainer}>
                  <Text
                    style={[
                      styles.status,
                      {
                        color:
                          result.status === 'SUCCESS' || result.status === 'BATCH_SUCCESS'
                            ? '#4ECDC4'
                            : result.status.includes('ERROR')
                            ? '#FF6B6B'
                            : '#FFE66D',
                      },
                    ]}
                  >
                    {result.status}
                  </Text>
                </View>
              </View>

              <View style={styles.resultDetails}>
                <Text style={[styles.league, { color: theme.colors.textSecondary }]}>
                  {result.leagueName}
                </Text>

                {result.ranking && (
                  <View style={styles.rankingDisplay}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                      Ranking:
                    </Text>
                    <TeamRanking
                      ranking={result.ranking}
                      position="home"
                      teamName={result.name}
                    />
                    <Text style={[styles.rankingText, { color: theme.colors.text }]}>
                      {result.name}
                    </Text>
                  </View>
                )}

                {result.error && (
                  <Text style={[styles.error, { color: '#FF6B6B' }]}>
                    Error: {result.error}
                  </Text>
                )}

                <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.instructions}>
        <Text style={[styles.instructionsTitle, { color: theme.colors.text }]}>
          How to use:
        </Text>
        <Text style={[styles.instructionsText, { color: theme.colors.textSecondary }]}>
          1. Press "Test Individual Rankings" to test each team separately{'\n'}
          2. Press "Test Batch Rankings" to test the batch loading system{'\n'}
          3. Check console logs for detailed debugging info{'\n'}
          4. Look for rankings displayed next to team names{'\n'}
          5. Press "Clear Results" to reset the test
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  resultDetails: {
    gap: 6,
  },
  league: {
    fontSize: 14,
  },
  rankingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
  },
  rankingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  error: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 12,
  },
  instructions: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default RankingTest;
