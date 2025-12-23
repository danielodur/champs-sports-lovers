import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { ClipboardList, Phone } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { horizontalTabScrollConfig } from "../../../../utils/scrollPerformance";

interface PostShareModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  authorName: string;
}

export default function PostShareModal({
  visible,
  onClose,
  postId,
  authorName,
}: PostShareModalProps) {
  const theme = useTheme();

  const handleShareOption = (platform: string) => {
    // Handle sharing logic for different platforms
    console.log(`Sharing post ${postId} by ${authorName} on ${platform}`);
    // In a real app, you would implement actual sharing logic here
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.shareModalContainer}>
        <TouchableOpacity
          style={styles.shareOverlay}
          onPress={onClose}
          activeOpacity={1}
        />
        <View
          style={[
            styles.shareModal,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}
        >
          <View style={styles.shareHeader}>
            <Text style={[styles.shareTitle, { color: theme.colors.text }]}>
              Share Post
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shareOptions}
            style={styles.shareScrollView}
            removeClippedSubviews={
              horizontalTabScrollConfig.removeClippedSubviews
            }
            scrollEventThrottle={horizontalTabScrollConfig.scrollEventThrottle}
            bounces={horizontalTabScrollConfig.bounces}
            decelerationRate={horizontalTabScrollConfig.decelerationRate}
            keyboardShouldPersistTaps={
              horizontalTabScrollConfig.keyboardShouldPersistTaps
            }
            keyboardDismissMode={horizontalTabScrollConfig.keyboardDismissMode}
          >
            {/* WhatsApp */}
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => handleShareOption("WhatsApp")}
            >
              <View style={[styles.shareIcon, { backgroundColor: "#25D366" }]}>
                <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                    fill="#FFFFFF"
                  />
                </Svg>
              </View>
              <Text style={[styles.shareLabel, { color: theme.colors.text }]}>
                WhatsApp
              </Text>
            </TouchableOpacity>

            {/* Instagram */}
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => handleShareOption("Instagram")}
            >
              <View style={[styles.shareIcon, { backgroundColor: "#E4405F" }]}>
                <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2z"
                    fill="#FFFFFF"
                  />
                  <Path
                    d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm5.5-9a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"
                    fill="#E4405F"
                  />
                </Svg>
              </View>
              <Text style={[styles.shareLabel, { color: theme.colors.text }]}>
                Instagram
              </Text>
            </TouchableOpacity>

            {/* Facebook */}
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => handleShareOption("Facebook")}
            >
              <View style={[styles.shareIcon, { backgroundColor: "#1877F2" }]}>
                <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M23.9981 11.9991C23.9981 5.37216 18.626 0 11.9991 0C5.37216 0 0 5.37216 0 11.9991C0 17.9882 4.38789 22.9522 10.1242 23.8524V15.4676H7.07758V11.9991H10.1242V9.35553C10.1242 6.34826 11.9156 4.68714 14.6564 4.68714C15.9692 4.68714 17.3424 4.92149 17.3424 4.92149V7.87439H15.8294C14.3388 7.87439 13.8739 8.79933 13.8739 9.74824V11.9991H17.2018L16.6698 15.4676H13.8739V23.8524C19.6103 22.9522 23.9981 17.9882 23.9981 11.9991Z"
                    fill="#FFFFFF"
                  />
                </Svg>
              </View>
              <Text style={[styles.shareLabel, { color: theme.colors.text }]}>
                Facebook
              </Text>
            </TouchableOpacity>

            {/* Phone */}
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => handleShareOption("Phone")}
            >
              <View style={[styles.shareIcon, { backgroundColor: "#4CAF50" }]}>
                <Phone size={32} color="#FFFFFF" />
              </View>
              <Text style={[styles.shareLabel, { color: theme.colors.text }]}>
                Phone
              </Text>
            </TouchableOpacity>

            {/* Copy Link */}
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => handleShareOption("Copy Link")}
            >
              <View
                style={[
                  styles.shareIcon,
                  { backgroundColor: theme.colors.textSecondary },
                ]}
              >
                <ClipboardList size={32} color="#FFFFFF" />
              </View>
              <Text style={[styles.shareLabel, { color: theme.colors.text }]}>
                Copy Link
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Separator Line */}
          <View
            style={[
              styles.shareSeparator,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.cancelButtonText, { color: theme.colors.text }]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shareModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  shareOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  shareModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 20,
    minHeight: 350,
  },
  shareHeader: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  shareTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  shareScrollView: {
    maxHeight: 120,
  },
  shareOptions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 20,
  },
  shareOption: {
    alignItems: "center",
    gap: 10,
    minWidth: 80,
  },
  shareIcon: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: "center",
    alignItems: "center",
  },
  shareLabel: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  shareSeparator: {
    height: 1,
    marginHorizontal: 0,
    marginTop: 30,
    marginBottom: 20,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

