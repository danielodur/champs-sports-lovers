import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { X, Mail, Phone, MessageCircle, Bug, Star, Users, ThumbsUp, Calendar } from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';
import { useRouter } from 'expo-router';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OtherIssuesModalProps {
  visible: boolean;
  onClose: () => void;
  modalType: 'partnership' | 'technical-support' | 'user-reviews' | null;
}

// Mock user reviews data - in real app, this would come from your backend
const mockReviews = [
  {
    id: 1,
    userName: 'John K.',
    rating: 5,
    comment: 'Amazing app for sports predictions! Very accurate and user-friendly.',
    date: '2024-01-15',
    verified: true,
  },
  {
    id: 2,
    userName: 'Sarah M.',
    rating: 4,
    comment: 'Great for following Ugandan Premier League. Love the live updates!',
    date: '2024-01-10',
    verified: true,
  },
  {
    id: 3,
    userName: 'David O.',
    rating: 5,
    comment: 'Best sports app in Uganda! Excellent match predictions and analysis.',
    date: '2024-01-08',
    verified: true,
  },
  {
    id: 4,
    userName: 'Grace A.',
    rating: 4,
    comment: 'Very helpful for sports betting insights. Highly recommend!',
    date: '2024-01-05',
    verified: true,
  },
];

export default function OtherIssuesModal({
  visible,
  onClose,
  modalType,
}: OtherIssuesModalProps) {
  const theme = useTheme();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [reviews, setReviews] = useState(mockReviews);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [showAddReview, setShowAddReview] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigateToReport = () => {
    onClose();
    router.push('/help-center/report');
  };

  const handleAddReview = () => {
    if (!newReview.comment.trim()) {
      Alert.alert('Error', 'Please enter a review comment');
      return;
    }

    const review = {
      id: reviews.length + 1,
      userName: 'You',
      rating: newReview.rating,
      comment: newReview.comment.trim(),
      date: new Date().toISOString().split('T')[0],
      verified: false,
    };

    setReviews([review, ...reviews]);
    setNewReview({ rating: 5, comment: '' });
    setShowAddReview(false);
    Alert.alert('Success', 'Your review has been submitted for approval!');
  };

  const renderStars = (rating: number, interactive = false, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && onPress?.(star)}
            disabled={!interactive}
          >
            <Star
              size={20}
              color={star <= rating ? '#FFD700' : '#E5E5E5'}
              fill={star <= rating ? '#FFD700' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'partnership':
        return 'Partnership & Business Inquiries';
      case 'technical-support':
        return 'Technical Support Request';
      case 'user-reviews':
        return 'Champs User Reviews';
      default:
        return 'Other Issues';
    }
  };

  const renderPartnershipContent = () => (
    <ScrollView
      style={styles.sheetBody}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.introText, { color: theme.colors.textSecondary }]}>
        We apologize for any inconvenience to your normal usage! For partnership matters, 
        please select the appropriate contact method below based on your cooperation type.
      </Text>

      <View style={styles.contactSection}>
        <View style={styles.contactHeader}>
          <MessageCircle size={20} color={theme.colors.primary} />
          <Text style={[styles.contactTitle, { color: theme.colors.text }]}>
            Contact Information:
          </Text>
        </View>
        
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Mail size={16} color={theme.colors.primary} />
            <View style={styles.contactDetails}>
              <Text style={[styles.contactLabel, { color: theme.colors.text }]}>
                Business Partnership:
              </Text>
              <Text style={[styles.contactDetail, { color: '#3B82F6' }]}>
                partners@champssports.ug
              </Text>
            </View>
          </View>
          
          <View style={styles.contactItem}>
            <Mail size={16} color={theme.colors.primary} />
            <View style={styles.contactDetails}>
              <Text style={[styles.contactLabel, { color: theme.colors.text }]}>
                Advertising:
              </Text>
              <Text style={[styles.contactDetail, { color: '#3B82F6' }]}>
                ads@champssports.ug
              </Text>
            </View>
          </View>
          
          <View style={styles.contactItem}>
            <Phone size={16} color={theme.colors.primary} />
            <View style={styles.contactDetails}>
              <Text style={[styles.contactLabel, { color: theme.colors.text }]}>
                Phone Support:
              </Text>
              <Text style={[styles.contactDetail, { color: '#3B82F6' }]}>
                +256 700 123 456
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.noteSection}>
        <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
          Our team will reply to you promptly. Welcome to inquire about partnership opportunities!
        </Text>
      </View>

      <TouchableOpacity onPress={onClose} style={styles.gotItBtn} activeOpacity={0.85}>
        <Text style={[styles.gotItText, { color: theme.colors.text }]}>I Got It</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderTechnicalSupportContent = () => (
    <ScrollView
      style={styles.sheetBody}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.introText, { color: theme.colors.textSecondary }]}>
        We apologize for any inconvenience! Please tap "Report" below to describe your 
        technical issue in detail, and leave your phone number for prompt assistance.
      </Text>

      <View style={styles.supportSection}>
        <View style={styles.supportHeader}>
          <Bug size={20} color={theme.colors.primary} />
          <Text style={[styles.supportTitle, { color: theme.colors.text }]}>
            Common Issues We Handle:
          </Text>
        </View>
        
        <Text style={[styles.supportText, { color: theme.colors.textSecondary }]}>
          • App crashes, freezes, or unexpected errors
        </Text>
        <Text style={[styles.supportText, { color: theme.colors.textSecondary }]}>
          • Data synchronization problems
        </Text>
        <Text style={[styles.supportText, { color: theme.colors.textSecondary }]}>
          • Login and account access issues
        </Text>
        <Text style={[styles.supportText, { color: theme.colors.textSecondary }]}>
          • Payment and transaction problems
        </Text>
        <Text style={[styles.supportText, { color: theme.colors.textSecondary }]}>
          • Performance and loading issues
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.reportButton, { backgroundColor: '#EF5350' }]} 
        activeOpacity={0.85}
        onPress={handleNavigateToReport}
      >
        <Bug size={18} color="#FFFFFF" style={styles.reportButtonIcon} />
        <Text style={styles.reportButtonText}>Report</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onClose} style={styles.gotItBtn} activeOpacity={0.85}>
        <Text style={[styles.gotItText, { color: theme.colors.text }]}>I Got It</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderUserReviewsContent = () => (
    <ScrollView
      style={styles.sheetBody}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.reviewsHeader}>
        <View style={styles.reviewsStats}>
          <Users size={20} color={theme.colors.primary} />
          <Text style={[styles.reviewsTitle, { color: theme.colors.text }]}>
            User Reviews ({reviews.length})
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addReviewBtn}
          onPress={() => setShowAddReview(!showAddReview)}
        >
          <Text style={[styles.addReviewText, { color: theme.colors.primary }]}>
            {showAddReview ? 'Cancel' : 'Add Review'}
          </Text>
        </TouchableOpacity>
      </View>

      {showAddReview && (
        <View style={[styles.addReviewSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.addReviewLabel, { color: theme.colors.text }]}>
            Rate Champs Sports:
          </Text>
          {renderStars(newReview.rating, true, (rating) => 
            setNewReview({ ...newReview, rating })
          )}
          
          <TextInput
            style={[styles.reviewInput, { 
              color: theme.colors.text,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.background,
            }]}
            placeholder="Share your experience with Champs Sports..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={3}
            value={newReview.comment}
            onChangeText={(text) => setNewReview({ ...newReview, comment: text })}
          />
          
          <TouchableOpacity 
            style={[styles.submitReviewBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddReview}
          >
            <Text style={styles.submitReviewText}>Submit Review</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.reviewsList}>
        {reviews.map((review) => (
          <View key={review.id} style={[styles.reviewItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.reviewHeader}>
              <Text style={[styles.reviewUserName, { color: theme.colors.text }]}>
                {review.userName}
                {review.verified && <Text style={styles.verifiedBadge}> ✓</Text>}
              </Text>
              <View style={styles.reviewMeta}>
                {renderStars(review.rating)}
                <Text style={[styles.reviewDate, { color: theme.colors.textSecondary }]}>
                  {review.date}
                </Text>
              </View>
            </View>
            <Text style={[styles.reviewComment, { color: theme.colors.textSecondary }]}>
              {review.comment}
            </Text>
            <View style={styles.reviewActions}>
              <TouchableOpacity style={styles.helpfulBtn}>
                <ThumbsUp size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.helpfulText, { color: theme.colors.textSecondary }]}>
                  Helpful
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={onClose} style={styles.gotItBtn} activeOpacity={0.85}>
        <Text style={[styles.gotItText, { color: theme.colors.text }]}>Close</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderContent = () => {
    switch (modalType) {
      case 'partnership':
        return renderPartnershipContent();
      case 'technical-support':
        return renderTechnicalSupportContent();
      case 'user-reviews':
        return renderUserReviewsContent();
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.sheetHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
              {getModalTitle()}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {renderContent()}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  sheetBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  introText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 20,
  },
  // Partnership styles
  contactSection: {
    marginBottom: 20,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  contactInfo: {
    paddingLeft: 28,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  contactDetails: {
    marginLeft: 12,
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  noteSection: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  noteText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  // Technical support styles
  supportSection: {
    marginBottom: 20,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  supportText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 28,
  },
  reportButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  reportButtonIcon: {
    marginRight: 8,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  // User reviews styles
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  addReviewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addReviewText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  addReviewSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  addReviewLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitReviewBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitReviewText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  reviewsList: {
    marginBottom: 20,
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewUserName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  verifiedBadge: {
    color: '#10B981',
    fontSize: 12,
  },
  reviewMeta: {
    alignItems: 'flex-end',
  },
  reviewDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  reviewComment: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewActions: {
    flexDirection: 'row',
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  helpfulText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  gotItBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  gotItText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
});
