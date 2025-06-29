import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, UploadCloud } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function UploadDebugLogScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setModalVisible(true);
    }, 1500);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}> 
        <ChevronLeft size={28} color={theme.colors.text} onPress={() => router.back()} style={styles.backButton} /> 
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Upload Debug Log</Text> 
        <View style={styles.headerRight} /> 
      </View> 
      <View style={styles.content}>
        <UploadCloud size={48} color={theme.colors.primary} style={{ marginBottom: 16 }} />
        <Text style={[styles.info, { color: theme.colors.textSecondary }]}>If you encounter issues, you can upload your debug log to help us improve the app. <Text style={{color: 'red'}}>Your log will be handled securely</Text> in line with Ugandan ICT best practices.</Text>
        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleUpload}
          activeOpacity={0.8}
          disabled={uploading}
        >
          <Text style={styles.uploadButtonText}>{uploading ? 'Uploading...' : 'Upload Debug Log'}</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.backgroundSecondary }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Upload Successful</Text>
            <Text style={[styles.modalText, { color: theme.colors.textSecondary }]}>Your debug log has been uploaded securely. <Text style={{color: 'red'}}>Thank you for helping us improve Champs!</Text></Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold' },
  headerRight: { width: 36 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  info: { fontSize: 15, fontFamily: 'Inter-Regular', textAlign: 'center', marginBottom: 32 },
  uploadButton: { paddingVertical: 14, paddingHorizontal: 36, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  uploadButtonText: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', borderRadius: 16, padding: 28, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontFamily: 'Inter-SemiBold', marginBottom: 16 },
  modalText: { fontSize: 15, fontFamily: 'Inter-Regular', marginBottom: 28, textAlign: 'center' },
  modalButton: { paddingVertical: 14, paddingHorizontal: 36, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#fff' },
}); 