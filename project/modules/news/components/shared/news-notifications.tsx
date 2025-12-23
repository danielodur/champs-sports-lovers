import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

interface NewsNotificationsProps {
  notificationCount?: number;
  showBadge?: boolean;
  iconColor?: string;
}

export default function NewsNotifications({
  notificationCount = 1,
  showBadge = true,
  iconColor,
}: NewsNotificationsProps) {
  const router = useRouter();
  const theme = useTheme();

  const handleNotificationPress = () => {
    router.push("/notifications");
  };

  const bellColor = iconColor || theme.colors.text;

  return (
    <TouchableOpacity
      style={styles.bellContainer}
      onPress={handleNotificationPress}
      activeOpacity={0.7}
    >
      <Bell size={20} color={bellColor} />
      {showBadge && notificationCount > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationText}>
            {notificationCount > 99 ? "99+" : notificationCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bellContainer: {
    marginLeft: 16,
    position: "relative",
    padding: 4, // Add padding for better touch target
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#EF5350",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Inter-Bold",
  },
});
