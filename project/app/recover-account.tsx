import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Headset } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

const PHONE_LENGTH = 10; // Uganda standard mobile number length (without country code)

export default function RecoverAccountScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [sendCodeUsed, setSendCodeUsed] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timer]);

  useEffect(() => {
    // Reset sendCodeUsed when the screen is mounted
    setSendCodeUsed(false);
  }, []);

  const isValidPhone = (value: string) => {
    // Uganda mobile numbers: 10 digits, start with 07 or 03
    return /^0[37][0-9]{8}$/.test(value);
  };

  const handleSendCode = () => {
    if (!isValidPhone(phone)) {
      Alert.alert('Error', 'Please enter a valid Ugandan phone number.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCodeSent(true);
      setSendCodeUsed(true);
      setTimer(40);
      Alert.alert('Verification Code Sent', 'A verification code has been sent to your phone number.');
    }, 1200);
  };

  const handleResendCode = () => {
    if (!isValidPhone(phone)) {
      Alert.alert('Error', 'Please enter a valid Ugandan phone number.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setTimer(40);
      Alert.alert('Verification Code Sent', 'A new verification code has been sent to your phone number.');
    }, 1200);
  };

  const handleVerifyCode = () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the verification code.');
      return;
    }
    // Simulate code verification
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Navigate to reset-password screen, passing phone as param
      router.push({ pathname: '/reset-password', params: { phone } });
    }, 1000);
  };

  const handleCustomerService = () => {
    router.push('/help-center');
  };

  const handleBack = () => {
    if (phone || codeSent || timer > 0) {
      Alert.alert(
        'Are you sure?',
        'If you go back now, your progress will be lost. Do you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
            <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}> 
              <ChevronLeft size={28} color={theme.colors.text} onPress={handleBack} style={styles.backButton} /> 
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Recover Account</Text> 
              <TouchableOpacity onPress={handleCustomerService} style={styles.headerRight} activeOpacity={0.7}>
                <Headset size={26} color={theme.colors.primary} />
              </TouchableOpacity>
            </View> 
            <View style={styles.content}>
              <Text style={[styles.instructions, { color: theme.colors.textSecondary }]}>Enter your registered phone number to receive a verification code.</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="Phone number (e.g. 07XXXXXXXX)"
                placeholderTextColor={theme.colors.textSecondary}
                value={phone}
                onChangeText={text => setPhone(text.replace(/[^0-9]/g, '').slice(0, PHONE_LENGTH))}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={PHONE_LENGTH}
              />
              <TouchableOpacity
                style={[styles.sendCodeButton, { backgroundColor: (!isValidPhone(phone) || sendCodeUsed) ? '#CCCCCC' : '#EF5350', opacity: loading ? 0.7 : 1 }]}
                onPress={handleSendCode}
                disabled={!isValidPhone(phone) || loading || timer > 0 || sendCodeUsed}
                activeOpacity={0.8}
              >
                <Text style={styles.sendCodeButtonText}>
                  {loading ? 'Sending...' : timer > 0 ? `Resend in ${timer}s` : 'Send Code'}
                </Text>
              </TouchableOpacity>
              {codeSent && timer === 0 && (
                <TouchableOpacity
                  style={[styles.resendButton, { backgroundColor: '#EF5350' }]}
                  onPress={handleResendCode}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resendButtonText}>Resend Code</Text>
                </TouchableOpacity>
              )}

              {codeSent && (
                <>
                  <Text style={[styles.instructions, { color: theme.colors.textSecondary, marginTop: 24 }]}>Enter the verification code sent to your phone.</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.text, borderColor: theme.colors.border }]}
                    placeholder="Verification Code"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[styles.verifyButton, { backgroundColor: code ? '#EF5350' : '#CCCCCC', opacity: loading ? 0.7 : 1 }]}
                    onPress={handleVerifyCode}
                    disabled={!code || loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.verifyButtonText}>{loading ? 'Verifying...' : 'Verify Code'}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
          <View style={[styles.reminderBox, { backgroundColor: theme.colors.backgroundSecondary, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomWidth: 0, borderColor: 'transparent', shadowColor: 'transparent' }]}> 
            <Text style={[styles.reminderTitle, { color: theme.colors.text, opacity: 0.7 }]}>Note:</Text>
            <Text style={[styles.reminderText, { color: theme.colors.textSecondary, opacity: 0.7 }]}>• Ensure your phone has enough credit to receive SMS messages.</Text>
            <Text style={[styles.reminderText, { color: theme.colors.textSecondary, opacity: 0.7 }]}>• If you do not receive the code, check your network connection and try again.</Text>
            <Text style={[styles.reminderText, { color: theme.colors.textSecondary, opacity: 0.7 }]}>• Clear your SMS inbox if it is full or check your spam/junk messages.</Text>
            <Text style={[styles.reminderText, { color: theme.colors.textSecondary, opacity: 0.7 }]}>• If your number is out of service or blocked, contact your mobile provider.</Text>
            <Text style={[styles.reminderText, { color: theme.colors.textSecondary, opacity: 0.7 }]}>• For further assistance, contact <Text style={{ color: '#EF5350', fontWeight: 'bold' }}>Champs Support</Text>.</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold' },
  headerRight: { width: 36, alignItems: 'flex-end', justifyContent: 'center' },
  content: { flex: 1, padding: 24, justifyContent: 'flex-start' },
  instructions: { fontSize: 14, fontFamily: 'Inter-Regular', marginBottom: 12 },
  input: { height: 48, borderRadius: 8, paddingHorizontal: 16, marginBottom: 12, fontSize: 16, fontFamily: 'Inter-Regular', borderWidth: 1 },
  sendCodeButton: { height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  sendCodeButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Inter-SemiBold' },
  resendButton: { height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  resendButtonText: { color: '#fff', fontSize: 15, fontFamily: 'Inter-SemiBold' },
  verifyButton: { height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  verifyButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Inter-SemiBold' },
  reminderBox: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 0,
    borderRadius: 0,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 120,
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    zIndex: 10,
  },
  reminderTitle: { fontSize: 15, fontFamily: 'Inter-SemiBold', marginBottom: 6 },
  reminderText: { fontSize: 13, fontFamily: 'Inter-Regular', marginBottom: 2 },
});
