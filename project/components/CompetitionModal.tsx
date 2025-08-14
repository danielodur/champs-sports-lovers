import MaterialCommunityIcons from "@expo/vector-icons/build/MaterialCommunityIcons";
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Event } from "../types/event";

export default function CompetitionModal({
  isOpen,
  onClose,
  events,
  setSelectedEvent,
}: {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  setSelectedEvent: (event: Event) => void;
}) {
  const selectHandler = (event: Event) => {
    setSelectedEvent(event);
    onClose();
  };
  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity onPress={onClose}>
          <MaterialCommunityIcons name="close" size={32} color="black" />
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.title}>Events</Text>
        </View>
        <ScrollView style={styles.events}>
          {events?.map((event) => (
            <TouchableOpacity
              style={styles.event}
              key={event.id}
              onPress={() => selectHandler(event)}
            >
              {event.icon}
              <Text>{event.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  event: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "#FF4444",
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  events: {
    flex: 1,
    marginTop: 24,
  },
});
