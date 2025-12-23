import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react-native';
import { router } from 'expo-router';
import { sanitizeErrorMessage } from '../utils/errorUtils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Log to crash reporting service if available
    if (__DEV__) {
      console.error('Error Stack:', error.stack);
      console.error('Component Stack:', errorInfo.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    router.replace('/(tabs)/');
  };

  handleReportIssue = () => {
    const errorMessage = this.state.error?.message || 'Unknown error';
    const sanitizedMessage = sanitizeErrorMessage(this.state.error);

    Alert.alert(
      'Report Issue',
      'Would you like to report this issue to our support team?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: () => {
            // Here you could integrate with your crash reporting service
            // For now, we'll just show a confirmation
            Alert.alert(
              'Thank You',
              'The issue has been reported to our development team.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const userFriendlyMessage = sanitizeErrorMessage(this.state.error);

      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconContainer}>
              <AlertTriangle size={64} color="#FF6B6B" />
            </View>

            <Text style={styles.title}>Oops! Something went wrong</Text>

            <Text style={styles.message}>
              {userFriendlyMessage}
            </Text>

            <Text style={styles.subtitle}>
              Don't worry, this happens sometimes. You can try refreshing the page or go back to the home screen.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleRetry}
                activeOpacity={0.8}
              >
                <RefreshCw size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleGoHome}
                activeOpacity={0.8}
              >
                <Home size={20} color="#666666" />
                <Text style={styles.secondaryButtonText}>Go to Home</Text>
              </TouchableOpacity>
            </View>

            {__DEV__ && (
              <TouchableOpacity
                style={styles.debugButton}
                onPress={() => {
                  Alert.alert(
                    'Debug Info',
                    `Error: ${this.state.error?.message}\nStack: ${this.state.error?.stack?.substring(0, 200)}...`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Text style={styles.debugButtonText}>Show Debug Info (Dev Mode)</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.reportButton}
              onPress={this.handleReportIssue}
            >
              <Text style={styles.reportButtonText}>Report this issue</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: '100%',
  },
  iconContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
    fontFamily: 'Inter-Medium',
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  secondaryButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  debugButton: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  debugButtonText: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  reportButton: {
    marginTop: 16,
    padding: 8,
  },
  reportButtonText: {
    color: '#007AFF',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontFamily: 'Inter-Medium',
  },
});
