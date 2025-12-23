import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Quote, Lightbulb, Heart, Star, Target } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';

// Simple in-memory storage for demonstration (in real app, use AsyncStorage)
declare global {
  var savedProfileData: any;
}

if (typeof global.savedProfileData === 'undefined') {
  global.savedProfileData = null;
}

export default function QuoteEditScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [quote, setQuote] = useState('');
  const maxWords = 20;

  useEffect(() => {
    loadCurrentData();
  }, []);

  const loadCurrentData = () => {
    if (global.savedProfileData && global.savedProfileData.personalInfo && global.savedProfileData.personalInfo.quote) {
      setQuote(global.savedProfileData.personalInfo.quote);
    }
  };

  const suggestedQuotes = [
    "The only way to do great work is to love what you do.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Dream big, work hard, stay focused.",
    "Champions are made when nobody's watching.",
    "Your only limit is your mind.",
    "Great things never come from comfort zones.",
    "Believe you can and you're halfway there.",
    "Hard work beats talent when talent doesn't work hard."
  ];

  const handleSave = () => {
    if (!quote.trim()) {
      Alert.alert('Quote Required', 'Please enter a quote or select one from suggestions');
      return;
    }

    const wordCount = quote.trim().split(/\s+/).length;
    if (wordCount > maxWords) {
      Alert.alert('Quote Too Long', `Quote must be ${maxWords} words or less`);
      return;
    }

    // Save the quote to shared storage
    if (!global.savedProfileData) {
      global.savedProfileData = { personalInfo: {} };
    }
    if (!global.savedProfileData.personalInfo) {
      global.savedProfileData.personalInfo = {};
    }
    global.savedProfileData.personalInfo.quote = quote.trim();

    Alert.alert(
      'Quote Saved',
      'Your personal quote has been saved successfully.',
      [{ 
        text: 'OK', 
        onPress: () => router.back()
      }]
    );
  };

  const handleCancel = () => {
    if (quote.trim()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const handleSuggestedQuote = (suggestedQuote: string) => {
    setQuote(suggestedQuote);
  };

  const clearQuote = () => {
    setQuote('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <TouchableOpacity 
            onPress={handleCancel} 
            style={styles.cancelButton}
            activeOpacity={0.7}
          >
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Personal Quote</Text>
                     <TouchableOpacity 
             onPress={handleSave}
             style={styles.saveButton}
             activeOpacity={0.7}
           >
             <Text style={[styles.saveText, { color: theme.colors.primary }]}>OK</Text>
           </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title and Description */}
          <View style={styles.titleContainer}>
            <Quote size={32} color={theme.colors.primary} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Personal Quote</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Share your favorite quote or motto
            </Text>
          </View>

          {/* Quote Input */}
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <TextInput
              style={[styles.textInput, { color: theme.colors.text }]}
              value={quote}
              onChangeText={(text) => {
                const words = text.trim().split(/\s+/).filter(word => word.length > 0);
                if (words.length <= maxWords) {
                  setQuote(text);
                } else {
                  // Only allow up to maxWords
                  const limitedWords = words.slice(0, maxWords);
                  setQuote(limitedWords.join(' '));
                }
              }}
              placeholder="Enter your personal quote or motto..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <View style={styles.inputFooter}>
              <Text style={[styles.characterCount, { color: theme.colors.textSecondary }]}>
                {quote.trim().split(/\s+/).filter(word => word.length > 0).length}/{maxWords} words
              </Text>
              {quote && (
                <TouchableOpacity onPress={clearQuote} activeOpacity={0.7}>
                  <Text style={[styles.clearText, { color: theme.colors.primary }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>


        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
    borderRadius: 8,
  },
  saveText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  clearText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  previewContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  suggestionsSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  tipsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 6,
    lineHeight: 20,
  },
}); 