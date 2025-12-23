import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Platform,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Video, Play, Pause, Square, RotateCcw, Download, Share, Search, Filter, Calendar, Clock, Eye, Heart, MessageCircle, Star, Upload, Camera, CreditCard as Edit3, Trash2, Settings } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

interface VideoRecord {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  date: Date;
  views: number;
  likes: number;
  comments: number;
  category: 'football' | 'basketball' | 'rugby' | 'boxing';
  quality: '720p' | '1080p' | '4K';
  size: string;
  isRecording?: boolean;
  isFavorite?: boolean;
}

export default function VideoRecordsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  const [videoRecords] = useState<VideoRecord[]>([
    {
      id: '1',
      title: 'Arsenal vs Bayern Munich - Tactical Analysis',
      duration: '15:32',
      thumbnail: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg',
      date: new Date('2024-01-15'),
      views: 1250,
      likes: 89,
      comments: 23,
      category: 'football',
      quality: '1080p',
      size: '245 MB',
      isFavorite: true
    },
    {
      id: '2',
      title: 'Lakers Training Session Highlights',
      duration: '8:45',
      thumbnail: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg',
      date: new Date('2024-01-14'),
      views: 892,
      likes: 67,
      comments: 15,
      category: 'basketball',
      quality: '720p',
      size: '156 MB'
    },
    {
      id: '3',
      title: 'Rugby World Cup Final Moments',
      duration: '12:18',
      thumbnail: 'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg',
      date: new Date('2024-01-13'),
      views: 2100,
      likes: 156,
      comments: 45,
      category: 'rugby',
      quality: '4K',
      size: '890 MB',
      isFavorite: true
    }
  ]);

  const filterOptions = [
    { id: 'all', label: 'All Videos' },
    { id: 'football', label: 'Football' },
    { id: 'basketball', label: 'Basketball' },
    { id: 'rugby', label: 'Rugby' },
    { id: 'boxing', label: 'Boxing' },
    { id: 'favorites', label: 'Favorites' }
  ];

  const startRecording = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Camera Access', 'Camera recording is not available in web browser. Please use a mobile device.');
      return;
    }
    
    setIsRecording(true);
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }
    Alert.alert('Recording Saved', 'Your video has been saved to your records.');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoAction = (action: string, videoId: string) => {
    switch (action) {
      case 'play':
        Alert.alert('Play Video', `Playing video ${videoId}`);
        break;
      case 'share':
        Alert.alert('Share Video', `Sharing video ${videoId}`);
        break;
      case 'download':
        Alert.alert('Download Video', `Downloading video ${videoId}`);
        break;
      case 'delete':
        Alert.alert('Delete Video', `Are you sure you want to delete this video?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive' }
        ]);
        break;
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <ChevronLeft size={28} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Video Records</Text>
      <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
        <Settings size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderRecordingControls = () => (
    <View style={[styles.recordingControls, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.recordingInfo}>
        <Camera size={24} color={theme.colors.primary} />
        <Text style={[styles.recordingTitle, { color: theme.colors.text }]}>
          Video Recording
        </Text>
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={[styles.recordingTime, { color: theme.colors.primary }]}>
              {formatTime(recordingTime)}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.recordingButtons}>
        {!isRecording ? (
          <TouchableOpacity
            style={[styles.recordButton, { backgroundColor: theme.colors.primary }]}
            onPress={startRecording}
            activeOpacity={0.8}
          >
            <Video size={20} color="#FFFFFF" />
            <Text style={styles.recordButtonText}>Start Recording</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.stopButton, { backgroundColor: '#EF5350' }]}
            onPress={stopRecording}
            activeOpacity={0.8}
          >
            <Square size={20} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>Stop Recording</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderSearchAndFilter = () => (
    <View style={styles.searchFilterContainer}>
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Search size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[
            styles.searchInput,
            { 
              color: theme.colors.text
            }
          ]}
          placeholder="Search video records..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.filterButton,
              {
                backgroundColor: activeFilter === option.id ? theme.colors.primary : theme.colors.backgroundSecondary,
              }
            ]}
            onPress={() => setActiveFilter(option.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color: activeFilter === option.id ? '#FFFFFF' : theme.colors.text,
                }
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderVideoCard = (video: VideoRecord) => (
    <View
      key={video.id}
      style={[styles.videoCard, { backgroundColor: theme.colors.backgroundSecondary }]}
    >
      <View style={styles.videoThumbnailContainer}>
        <Image source={{ uri: video.thumbnail }} style={styles.videoThumbnail} />
        <View style={styles.videoDuration}>
          <Text style={styles.videoDurationText}>{video.duration}</Text>
        </View>
        <TouchableOpacity 
          style={styles.playButton}
          onPress={() => handleVideoAction('play', video.id)}
          activeOpacity={0.8}
        >
          <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
        </TouchableOpacity>
        {video.isFavorite && (
          <View style={styles.favoriteIndicator}>
            <Star size={16} color="#FF4444" fill="#FF4444" />
          </View>
        )}
      </View>
      
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {video.title}
        </Text>
        
        <View style={styles.videoMeta}>
          <View style={styles.videoMetaRow}>
            <Calendar size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.videoMetaText, { color: theme.colors.textSecondary }]}>
              {video.date.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.videoMetaRow}>
            <Text style={[styles.videoQuality, { color: theme.colors.primary }]}>
              {video.quality}
            </Text>
            <Text style={[styles.videoSize, { color: theme.colors.textSecondary }]}>
              {video.size}
            </Text>
          </View>
        </View>
        
        <View style={styles.videoStats}>
          <View style={styles.videoStatItem}>
            <Eye size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.videoStatText, { color: theme.colors.textSecondary }]}>
              {video.views}
            </Text>
          </View>
          <View style={styles.videoStatItem}>
            <Heart size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.videoStatText, { color: theme.colors.textSecondary }]}>
              {video.likes}
            </Text>
          </View>
          <View style={styles.videoStatItem}>
            <MessageCircle size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.videoStatText, { color: theme.colors.textSecondary }]}>
              {video.comments}
            </Text>
          </View>
        </View>
        
        <View style={styles.videoActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleVideoAction('share', video.id)}
            activeOpacity={0.7}
          >
            <Share size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleVideoAction('download', video.id)}
            activeOpacity={0.7}
          >
            <Download size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleVideoAction('delete', video.id)}
            activeOpacity={0.7}
          >
            <Trash2 size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderRecordingControls()}
        {renderSearchAndFilter()}
        
        <View style={styles.videosContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Your Video Records ({videoRecords.length})
          </Text>
          
          <View style={styles.videosList}>
            {videoRecords.map(renderVideoCard)}
          </View>
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  recordingControls: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 12,
    flex: 1,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF5350',
    marginRight: 8,
  },
  recordingTime: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  recordingButtons: {
    alignItems: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  searchFilterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterContainer: {
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  videosContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  videosList: {
    gap: 16,
  },
  videoCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  videoThumbnailContainer: {
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
    borderRadius: 12,
  },
  videoInfo: {
    padding: 16,
  },
  videoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 22,
    marginBottom: 12,
  },
  videoMeta: {
    marginBottom: 12,
  },
  videoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  videoMetaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 6,
  },
  videoQuality: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginRight: 12,
  },
  videoSize: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  videoStats: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  videoStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoStatText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  videoActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
});