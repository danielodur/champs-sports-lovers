import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Image,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { getManagerImage } from "../../../assets/images/team-managers/index";

interface ManagerSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onManagerSelect: (manager: string) => void;
  currentManager: string;
}

interface Manager {
  id: string;
  name: string;
  displayName: string;
}

const managers: Manager[] = [
  { id: "enrique", name: "Luis Enrique", displayName: "Luis Enrique" },
  { id: "guardiola", name: "Pep Guardiola", displayName: "Pep Guardiola" },
  { id: "flick", name: "Hansi Flick", displayName: "Hansi Flick" },
  { id: "slot", name: "Arne Slot", displayName: "Arne Slot" },
  { id: "arteta", name: "Mikel Arteta", displayName: "Mikel Arteta" },
  { id: "alonso", name: "Xabi Alonso", displayName: "Xabi Alonso" },
  { id: "conte", name: "Antonio Conte", displayName: "Antonio Conte" },
  { id: "inzaghi", name: "Simone Inzaghi", displayName: "Simone Inzaghi" },
  { id: "ancelotti", name: "Carlo Ancelotti", displayName: "Carlo Ancelotti" },
  { id: "simeone", name: "Diego Simeone", displayName: "Diego Simeone" },
  { id: "scaloni", name: "Lionel Scaloni", displayName: "Lionel Scaloni" },
  {
    id: "deschamps",
    name: "Didier Deschamps",
    displayName: "Didier Deschamps",
  },
  { id: "fuente", name: "Luis de la Fuente", displayName: "Luis de la Fuente" },
  { id: "tuchel", name: "Thomas Tuchel", displayName: "Thomas Tuchel" },
  { id: "maresca", name: "Enzo Maresca", displayName: "Enzo Maresca" },
  { id: "emery", name: "Unai Emery", displayName: "Unai Emery" },
  {
    id: "nagelsmann",
    name: "Julian Nagelsmann",
    displayName: "Julian Nagelsmann",
  },
  { id: "amorim", name: "Ruben Amorim", displayName: "Ruben Amorim" },
  { id: "howe", name: "Eddie Howe", displayName: "Eddie Howe" },
  { id: "glasner", name: "Oliver Glasner", displayName: "Oliver Glasner" },
  { id: "mourinho", name: "Jose Mourinho", displayName: "Jose Mourinho" },
];

export default function MyLineupManagerSelector({
  visible,
  onClose,
  onManagerSelect,
  currentManager,
}: ManagerSelectorModalProps) {
  const theme = useTheme();
  const [selectedManager, setSelectedManager] = useState(
    currentManager === "Team Manager"
      ? managers[0]?.name || "Luis Enrique"
      : currentManager,
  );
  const scrollY = new Animated.Value(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);

  const handleManagerSelect = (managerName: string) => {
    setSelectedManager(managerName);

    // Scroll to the selected manager smoothly
    const index = managers.findIndex((m) => m.name === managerName);
    if (index !== -1 && scrollViewRef.current && !isScrolling.current) {
      const scrollPosition = index * 50;
      scrollViewRef.current.scrollTo({
        y: scrollPosition,
        animated: true,
      });
    }
  };

  const handleConfirm = () => {
    onManagerSelect(selectedManager);
    onClose();
  };

  const updateSelectedManagerBasedOnScroll = (scrollPosition: number) => {
    if (isScrolling.current) return;

    // Calculate which manager should be selected based on scroll position
    const index = Math.round(scrollPosition / 50);
    const clampedIndex = Math.max(0, Math.min(index, managers.length - 1));
    const newManager = managers[clampedIndex];

    if (newManager && newManager.name !== selectedManager) {
      setSelectedManager(newManager.name);
    }
  };

  const onScrollEnd = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    updateSelectedManagerBasedOnScroll(scrollPosition);
    isScrolling.current = false;
  };

  const onScrollBeginDrag = () => {
    isScrolling.current = true;
  };

  useEffect(() => {
    if (visible && scrollViewRef.current) {
      // Find the index of the current manager
      let currentIndex = managers.findIndex((m) => m.name === selectedManager);

      // If current manager not found or is Team Manager, start from first actual manager
      if (currentIndex === -1 || currentManager === "Team Manager") {
        currentIndex = 0;
        setSelectedManager(managers[0]?.name || "Luis Enrique");
      }

      // Calculate scroll position to center the selected manager
      const scrollPosition = currentIndex * 50;

      // Delay scroll to ensure modal is fully rendered
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: scrollPosition,
          animated: false,
        });
      }, 150);
    }
  }, [visible]);

  const renderManagerItem = (manager: Manager, index: number) => {
    const isSelected = selectedManager === manager.name;
    const inputRange = [(index - 1) * 50, index * 50, (index + 1) * 50];

    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: "clamp",
    });

    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        key={manager.name}
        style={[
          styles.managerItemContainer,
          {
            transform: [{ scale }],
            opacity: isSelected ? 1 : opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.managerItem}
          onPress={() => handleManagerSelect(manager.name)}
          activeOpacity={0.7}
        >
          <View style={styles.managerContent}>
            {(() => {
              const managerImage = getManagerImage(manager.id);
              if (managerImage) {
                return (
                  <Image
                    source={managerImage}
                    style={styles.managerPortrait}
                    resizeMode="cover"
                  />
                );
              } else {
                return (
                  <View
                    style={[
                      styles.managerPortrait,
                      {
                        backgroundColor:
                          theme.colors.background === "#FFFFFF" ||
                          theme.colors.background === "#ffffff"
                            ? "rgba(128, 128, 128, 0.05)"
                            : "rgba(128, 128, 128, 0.05)",
                        borderColor:
                          theme.colors.background === "#FFFFFF" ||
                          theme.colors.background === "#ffffff"
                            ? "rgba(128, 128, 128, 0.08)"
                            : "rgba(128, 128, 128, 0.1)",
                      },
                    ]}
                  />
                );
              }
            })()}
            <Text
              style={[
                styles.managerText,
                {
                  color: isSelected
                    ? theme.colors.text
                    : theme.colors.textSecondary || `${theme.colors.text}99`,
                  fontSize: isSelected ? 22 : 20,
                  fontWeight: isSelected ? "600" : "400",
                  opacity: 1,
                },
              ]}
            >
              {manager.displayName}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.overlay}
          onPress={onClose}
          activeOpacity={1}
        />

        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.colors.background },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Text style={[styles.cancelText, { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Select Manager
            </Text>

            <TouchableOpacity
              onPress={handleConfirm}
              style={styles.headerButton}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>

          {/* Managers List */}
          <View style={styles.listContainer}>
            <Animated.ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              snapToInterval={50}
              snapToAlignment="center"
              decelerationRate="fast"
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true },
              )}
              onScrollEndDrag={onScrollEnd}
              onMomentumScrollEnd={onScrollEnd}
              onScrollBeginDrag={onScrollBeginDrag}
              scrollEventThrottle={16}
            >
              {managers.map(renderManagerItem)}
            </Animated.ScrollView>

            {/* Center highlight indicator */}
            <View style={styles.centerIndicator} />

            {/* Gradient overlays */}
            <View
              style={[
                styles.topGradient,
                { backgroundColor: theme.colors.background },
              ]}
            />
            <View
              style={[
                styles.bottomGradient,
                { backgroundColor: theme.colors.background },
              ]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlay: {
    flex: 1,
  },
  modalContent: {
    height: 320,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128, 128, 128, 0.3)",
  },
  headerButton: {
    minWidth: 60,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "400",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF3B30",
    textAlign: "right",
  },
  listContainer: {
    height: 250,
    position: "relative",
  },
  scrollView: {
    height: 250,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 100,
  },
  managerItemContainer: {
    height: 50,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  managerItem: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  managerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  managerPortrait: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(128, 128, 128, 0.3)",
    marginRight: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  managerText: {
    fontSize: 18,
    fontWeight: "400",
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  centerIndicator: {
    position: "absolute",
    top: "50%",
    left: 30,
    right: 30,
    height: 50,
    marginTop: -25,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.5)",
    backgroundColor: "rgba(128, 128, 128, 0.12)",
    pointerEvents: "none",
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    opacity: 0.8,
    pointerEvents: "none",
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    opacity: 0.8,
    pointerEvents: "none",
  },
});
