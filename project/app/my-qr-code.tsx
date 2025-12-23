import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Download, Share2, RefreshCw, User, Shield } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import useAuth from '../hooks/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Generate Champs ID - "CH" followed by 12 digits (matching profile.tsx)
const generateChampsId = () => {
  let digits = '';
  for (let i = 0; i < 12; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  return `CH${digits}`;
};

export default function MyQRCodeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { isLoggedIn, userInfo } = useAuth();
  
  const [qrValue, setQrValue] = useState('');
  const [champsId, setChampsId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Generate initial QR code based on user info
    generateQRCode();
  }, []);

  const generateQRCode = () => {
    setIsGenerating(true);
    
    // Simulate brief loading for better UX
    setTimeout(() => {
      const newChampsId = generateChampsId();
      setChampsId(newChampsId);
      
      // Create professional QR data format
      const qrData = JSON.stringify({
        type: 'champs_profile',
        id: newChampsId,
        app: 'Champs',
        version: '1.0',
        timestamp: Date.now()
      });
      
      setQrValue(qrData);
      setIsGenerating(false);
    }, 800);
  };

  const handleSave = () => {
    if (!qrValue) {
      Alert.alert('Error', 'Please generate a QR code first');
      return;
    }

    // Save QR code to profile (in real app, save to storage)
    Alert.alert(
      'QR Code Saved',
      'Your QR code has been saved to your profile.',
      [{ 
        text: 'OK', 
        onPress: () => router.back()
      }]
    );
  };

  const handleShare = async () => {
    if (!qrValue) {
      Alert.alert('Error', 'Please generate a QR code first');
      return;
    }

    try {
      await Share.share({
        message: `Connect with me on Champs! My ID: ${champsId}\n\nScan this QR code or search for my Champs ID in the app.`,
        title: 'My Champs Profile',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const handleDownload = () => {
    if (!qrValue) {
      Alert.alert('Error', 'Please generate a QR code first');
      return;
    }

    Alert.alert(
      'Download QR Code',
      'QR code will be saved to your device gallery.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => {
          // In a real app, implement actual download functionality
          Alert.alert('Success', 'QR code saved to gallery!');
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.cancelButton}
          activeOpacity={0.7}
        >
          <X size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My QR Code</Text>
        <TouchableOpacity 
          onPress={handleSave}
          style={styles.saveButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.saveText, { color: theme.colors.primary }]}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* QR Code Container */}
        <View style={[styles.qrContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Your Personal QR Code</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Share this QR code to connect with other Champs users
          </Text>

          <View style={[styles.qrCodeWrapper, { backgroundColor: '#FFFFFF' }]}>
            {qrValue && !isGenerating ? (
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={qrValue}
                  size={200}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                  logoSize={30}
                  logoBackgroundColor="transparent"
                  logoMargin={2}
                  logoBorderRadius={8}
                  quietZone={8}
                  enableLinearGradient={false}
                />
                
                {/* Champs ID Display */}
                <View style={styles.champsIdBadge}>
                  <Shield size={12} color="#4CAF50" />
                  <Text style={styles.champsIdText}>{champsId}</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.placeholderQR, { width: 200, height: 200 }]}>
                <RefreshCw 
                  size={40} 
                  color="#CCCCCC" 
                  style={isGenerating ? { opacity: 0.5 } : {}} 
                />
                <Text style={styles.placeholderText}>
                  {isGenerating ? 'Generating QR Code...' : 'Tap to Generate'}
                </Text>
              </View>
            )}
          </View>

          {/* Info Section */}
          {champsId && (
            <View style={styles.infoSection}>
              <Text style={[styles.infoTitle, { color: theme.colors.text }]}>Your Champs ID</Text>
              <Text style={[styles.infoValue, { color: theme.colors.textSecondary }]}>{champsId}</Text>
              <Text style={[styles.infoDescription, { color: theme.colors.textSecondary }]}>
                Others can scan this QR code or search for your ID to connect with you
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={generateQRCode}
            disabled={isGenerating}
            activeOpacity={0.7}
          >
            <RefreshCw 
              size={20} 
              color={isGenerating ? theme.colors.textSecondary : theme.colors.primary}
              style={isGenerating ? { transform: [{ rotate: '180deg' }] } : {}}
            />
            <Text style={[styles.actionButtonText, { 
              color: isGenerating ? theme.colors.textSecondary : theme.colors.text 
            }]}>
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={handleShare}
            disabled={!qrValue}
            activeOpacity={0.7}
          >
            <Share2 size={20} color={qrValue ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[styles.actionButtonText, { 
              color: qrValue ? theme.colors.text : theme.colors.textSecondary 
            }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={handleDownload}
            disabled={!qrValue}
            activeOpacity={0.7}
          >
            <Download size={20} color={qrValue ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[styles.actionButtonText, { 
              color: qrValue ? theme.colors.text : theme.colors.textSecondary 
            }]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={[styles.securityNote, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Shield size={16} color="#4CAF50" />
          <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
            This QR code is unique to your Champs profile and is secure to share
          </Text>
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
    padding: 12,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  qrCodeWrapper: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrCodeContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  champsIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  champsIdText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#2E7D32',
    marginLeft: 4,
  },
  placeholderQR: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 12,
    fontFamily: 'Inter-Regular',
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  infoDescription: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
    textAlign: 'center',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  securityText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginLeft: 6,
    flex: 1,
    lineHeight: 14,
  },
}); 