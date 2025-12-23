import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet
} from 'react-native'

// Simple test component for beginners to verify Sports API integration
const SimpleSportsTest = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  // Test function - calls the Supabase Edge Function
  const testSportsAPI = async () => {
    setLoading(true)
    setError('')
    setResult('')

    try {
      // Get your Supabase URL and Key from environment variables
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

      // Check if we have the required environment variables
      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          'Missing environment variables! Please check your .env.local file has:\n' +
          '- EXPO_PUBLIC_SUPABASE_URL\n' +
          '- EXPO_PUBLIC_SUPABASE_ANON_KEY'
        )
      }

      // Build the URL to call our edge function
      const functionUrl = `${supabaseUrl}/functions/v1/fetch-football-matches?status=live`

      console.log('🧪 Testing Sports API...')
      console.log('URL:', functionUrl)

      // Make the API call
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      })

      // Check if the response is ok
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`)
      }

      // Get the JSON data
      const data = await response.json()

      // Display the result
      setResult(JSON.stringify(data, null, 2))

      // Show success alert
      Alert.alert(
        '🎉 Success!',
        'Your Sports API is working! Check the result below.',
        [{ text: 'OK' }]
      )

    } catch (err: any) {
      console.error('❌ Test failed:', err)
      setError(err.message || 'Something went wrong')

      Alert.alert(
        '❌ Test Failed',
        err.message || 'Something went wrong. Check the console for details.',
        [{ text: 'OK' }]
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Sports API Test</Text>
      <Text style={styles.subtitle}>
        This will test your Supabase Edge Function integration
      </Text>

      <TouchableOpacity
        style={styles.testButton}
        onPress={testSportsAPI}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Test API Connection</Text>
        )}
      </TouchableOpacity>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ Error:</Text>
          <ScrollView style={styles.errorScroll}>
            <Text style={styles.errorText}>{error}</Text>
          </ScrollView>
        </View>
      ) : null}

      {result ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>✅ API Response:</Text>
          <ScrollView style={styles.resultScroll}>
            <Text style={styles.resultText}>{result}</Text>
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>ℹ️ What this test does:</Text>
        <Text style={styles.infoText}>
          • Checks your environment variables{'\n'}
          • Calls your Supabase Edge Function{'\n'}
          • Gets live football matches{'\n'}
          • Shows you the raw API response
        </Text>
      </View>

      <View style={styles.helpContainer}>
        <Text style={styles.helpTitle}>🆘 If the test fails:</Text>
        <Text style={styles.helpText}>
          1. Make sure you ran: ./setup-sports-api.sh{'\n'}
          2. Check your .env.local file has the right variables{'\n'}
          3. Verify your Supabase Edge Functions are deployed{'\n'}
          4. Check your TheSports.com API keys are valid
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  testButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 8,
  },
  errorScroll: {
    maxHeight: 100,
  },
  errorText: {
    fontSize: 14,
    color: '#721c24',
    fontFamily: 'monospace',
  },
  resultContainer: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 8,
  },
  resultScroll: {
    maxHeight: 200,
  },
  resultText: {
    fontSize: 12,
    color: '#155724',
    fontFamily: 'monospace',
  },
  infoContainer: {
    backgroundColor: '#d1ecf1',
    borderColor: '#bee5eb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c5460',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0c5460',
  },
  helpContainer: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#856404',
  },
})

export default SimpleSportsTest
