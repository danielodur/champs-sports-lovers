import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { useColorScheme } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export default function EventsHeader({
  title,
  onPress,
  icon,
}: {
  title: string;
  onPress: () => void;
  icon: React.ReactNode;
}) {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  return (
    <TouchableOpacity style={styles.buttonContainer} onPress={onPress}>
      <Text style={[styles.headerText, { color: theme.colors.text }]}>
        Select Sport
      </Text>
      <View style={styles.button}>
        {icon}
        <Text style={[styles.buttonText, { color: theme.colors.text }]}>
          {title}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={24}
          color={theme.colors.text}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerText: {
    fontSize: 16,
    fontWeight: "normal",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "flex-start",
  },
  button: {
    maxWidth: 200,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
