import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface FormationSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onFormationSelect: (formation: string) => void;
  currentFormation: string;
}

interface Formation {
  name: string;
  displayName: string;
  positions: Array<{ x: number; y: number; id: string }>;
}

const formations: Formation[] = [
  {
    name: "4-4-2",
    displayName: "4-4-2",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 15, y: 70, id: "lb" },
      { x: 35, y: 75, id: "cb1" },
      { x: 65, y: 75, id: "cb2" },
      { x: 85, y: 70, id: "rb" },
      { x: 12, y: 50, id: "lm" },
      { x: 35, y: 45, id: "cm1" },
      { x: 65, y: 45, id: "cm2" },
      { x: 88, y: 50, id: "rm" },
      { x: 30, y: 25, id: "lf" },
      { x: 70, y: 25, id: "rf" },
    ],
  },
  {
    name: "4-4-1-1",
    displayName: "4-4-1-1",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 15, y: 70, id: "lb" },
      { x: 35, y: 75, id: "cb1" },
      { x: 65, y: 75, id: "cb2" },
      { x: 85, y: 70, id: "rb" },
      { x: 12, y: 50, id: "lm" },
      { x: 35, y: 45, id: "cm1" },
      { x: 65, y: 45, id: "cm2" },
      { x: 88, y: 50, id: "rm" },
      { x: 50, y: 30, id: "cam" },
      { x: 50, y: 20, id: "cf" },
    ],
  },
  {
    name: "4-2-3-1",
    displayName: "4-2-3-1",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 15, y: 70, id: "lb" },
      { x: 35, y: 75, id: "cb1" },
      { x: 65, y: 75, id: "cb2" },
      { x: 85, y: 70, id: "rb" },
      { x: 35, y: 55, id: "cdm1" },
      { x: 65, y: 55, id: "cdm2" },
      { x: 20, y: 32, id: "lam" },
      { x: 50, y: 35, id: "cam" },
      { x: 80, y: 32, id: "ram" },
      { x: 50, y: 20, id: "cf" },
    ],
  },
  {
    name: "4-3-3",
    displayName: "4-3-3",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 15, y: 70, id: "lb" },
      { x: 35, y: 75, id: "cb1" },
      { x: 65, y: 75, id: "cb2" },
      { x: 85, y: 70, id: "rb" },
      { x: 25, y: 45, id: "lm" },
      { x: 50, y: 50, id: "cm" },
      { x: 75, y: 45, id: "rm" },
      { x: 20, y: 25, id: "lw" },
      { x: 50, y: 20, id: "cf" },
      { x: 80, y: 25, id: "rw" },
    ],
  },
  {
    name: "4-1-4-1",
    displayName: "4-1-4-1",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 15, y: 70, id: "lb" },
      { x: 35, y: 75, id: "cb1" },
      { x: 65, y: 75, id: "cb2" },
      { x: 85, y: 70, id: "rb" },
      { x: 50, y: 58, id: "dm" },
      { x: 15, y: 40, id: "lm" },
      { x: 35, y: 35, id: "cm1" },
      { x: 65, y: 35, id: "cm2" },
      { x: 85, y: 40, id: "rm" },
      { x: 50, y: 20, id: "cf" },
    ],
  },
  {
    name: "4-5-1",
    displayName: "4-5-1",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 15, y: 70, id: "lb" },
      { x: 35, y: 75, id: "cb1" },
      { x: 65, y: 75, id: "cb2" },
      { x: 85, y: 70, id: "rb" },
      { x: 15, y: 45, id: "lm" },
      { x: 30, y: 40, id: "cm1" },
      { x: 50, y: 45, id: "cm" },
      { x: 70, y: 40, id: "cm2" },
      { x: 85, y: 45, id: "rm" },
      { x: 50, y: 20, id: "cf" },
    ],
  },
  {
    name: "4-3-2-1",
    displayName: "4-3-2-1",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 15, y: 70, id: "lb" },
      { x: 35, y: 75, id: "cb1" },
      { x: 65, y: 75, id: "cb2" },
      { x: 85, y: 70, id: "rb" },
      { x: 25, y: 50, id: "lm" },
      { x: 50, y: 45, id: "cm" },
      { x: 75, y: 50, id: "rm" },
      { x: 35, y: 28, id: "lam" },
      { x: 65, y: 28, id: "ram" },
      { x: 50, y: 20, id: "cf" },
    ],
  },
  {
    name: "4-3-1-2",
    displayName: "4-3-1-2",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 15, y: 70, id: "lb" },
      { x: 35, y: 75, id: "cb1" },
      { x: 65, y: 75, id: "cb2" },
      { x: 85, y: 70, id: "rb" },
      { x: 25, y: 50, id: "lm" },
      { x: 50, y: 45, id: "cm" },
      { x: 75, y: 50, id: "rm" },
      { x: 50, y: 30, id: "cam" },
      { x: 35, y: 20, id: "lf" },
      { x: 65, y: 20, id: "rf" },
    ],
  },
  {
    name: "4-2-4",
    displayName: "4-2-4",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 15, y: 70, id: "lb" },
      { x: 35, y: 75, id: "cb1" },
      { x: 65, y: 75, id: "cb2" },
      { x: 85, y: 70, id: "rb" },
      { x: 35, y: 50, id: "cm1" },
      { x: 65, y: 50, id: "cm2" },
      { x: 15, y: 25, id: "lw" },
      { x: 35, y: 20, id: "lf" },
      { x: 65, y: 20, id: "rf" },
      { x: 85, y: 25, id: "rw" },
    ],
  },
  {
    name: "4-1-3-2",
    displayName: "4-1-3-2",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 15, y: 70, id: "lb" },
      { x: 35, y: 75, id: "cb1" },
      { x: 65, y: 75, id: "cb2" },
      { x: 85, y: 70, id: "rb" },
      { x: 50, y: 55, id: "dm" },
      { x: 25, y: 40, id: "lm" },
      { x: 50, y: 35, id: "cam" },
      { x: 75, y: 40, id: "rm" },
      { x: 35, y: 20, id: "lf" },
      { x: 65, y: 20, id: "rf" },
    ],
  },
  {
    name: "4-1-2-1-2",
    displayName: "4-1-2-1-2",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 15, y: 70, id: "lb" },
      { x: 35, y: 75, id: "cb1" },
      { x: 65, y: 75, id: "cb2" },
      { x: 85, y: 70, id: "rb" },
      { x: 50, y: 60, id: "dm" },
      { x: 35, y: 45, id: "cm1" },
      { x: 65, y: 45, id: "cm2" },
      { x: 50, y: 30, id: "cam" },
      { x: 35, y: 20, id: "lf" },
      { x: 65, y: 20, id: "rf" },
    ],
  },
  {
    name: "3-4-3",
    displayName: "3-4-3",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 25, y: 75, id: "cb1" },
      { x: 50, y: 78, id: "cb2" },
      { x: 75, y: 75, id: "cb3" },
      { x: 10, y: 55, id: "lwb" },
      { x: 35, y: 50, id: "cm1" },
      { x: 65, y: 50, id: "cm2" },
      { x: 90, y: 55, id: "rwb" },
      { x: 20, y: 25, id: "lw" },
      { x: 50, y: 20, id: "cf" },
      { x: 80, y: 25, id: "rw" },
    ],
  },
  {
    name: "3-5-2",
    displayName: "3-5-2",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 25, y: 75, id: "cb1" },
      { x: 50, y: 78, id: "cb2" },
      { x: 75, y: 75, id: "cb3" },
      { x: 10, y: 55, id: "lwb" },
      { x: 30, y: 45, id: "lm" },
      { x: 50, y: 50, id: "cm" },
      { x: 70, y: 45, id: "rm" },
      { x: 90, y: 55, id: "rwb" },
      { x: 35, y: 25, id: "lf" },
      { x: 65, y: 25, id: "rf" },
    ],
  },
  {
    name: "3-4-2-1",
    displayName: "3-4-2-1",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 25, y: 75, id: "cb1" },
      { x: 50, y: 78, id: "cb2" },
      { x: 75, y: 75, id: "cb3" },
      { x: 10, y: 55, id: "lwb" },
      { x: 35, y: 50, id: "cm1" },
      { x: 65, y: 50, id: "cm2" },
      { x: 90, y: 55, id: "rwb" },
      { x: 35, y: 30, id: "lam" },
      { x: 65, y: 30, id: "ram" },
      { x: 50, y: 20, id: "cf" },
    ],
  },
  {
    name: "3-4-1-2",
    displayName: "3-4-1-2",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 25, y: 75, id: "cb1" },
      { x: 50, y: 78, id: "cb2" },
      { x: 75, y: 75, id: "cb3" },
      { x: 10, y: 55, id: "lwb" },
      { x: 35, y: 50, id: "cm1" },
      { x: 65, y: 50, id: "cm2" },
      { x: 90, y: 55, id: "rwb" },
      { x: 50, y: 30, id: "cam" },
      { x: 35, y: 20, id: "lf" },
      { x: 65, y: 20, id: "rf" },
    ],
  },
  {
    name: "5-3-2",
    displayName: "5-3-2",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 10, y: 70, id: "lwb" },
      { x: 27, y: 75, id: "cb1" },
      { x: 50, y: 78, id: "cb2" },
      { x: 73, y: 75, id: "cb3" },
      { x: 90, y: 70, id: "rwb" },
      { x: 30, y: 50, id: "lm" },
      { x: 50, y: 45, id: "cm" },
      { x: 70, y: 50, id: "rm" },
      { x: 35, y: 25, id: "lf" },
      { x: 65, y: 25, id: "rf" },
    ],
  },
  {
    name: "5-4-1",
    displayName: "5-4-1",
    positions: [
      { x: 50, y: 88, id: "gk" },
      { x: 10, y: 70, id: "lwb" },
      { x: 27, y: 75, id: "cb1" },
      { x: 50, y: 78, id: "cb2" },
      { x: 73, y: 75, id: "cb3" },
      { x: 90, y: 70, id: "rwb" },
      { x: 20, y: 45, id: "lm" },
      { x: 37, y: 50, id: "cm1" },
      { x: 63, y: 50, id: "cm2" },
      { x: 80, y: 45, id: "rm" },
      { x: 50, y: 20, id: "cf" },
    ],
  },
];

export default function FormationSelectorModal({
  visible,
  onClose,
  onFormationSelect,
  currentFormation,
}: FormationSelectorModalProps) {
  const theme = useTheme();
  const [selectedFormation, setSelectedFormation] = useState(
    currentFormation || "4-4-2",
  );
  const scrollY = new Animated.Value(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);

  const handleFormationSelect = (formationName: string) => {
    setSelectedFormation(formationName);

    // Scroll to the selected formation smoothly
    const index = formations.findIndex((f) => f.name === formationName);
    if (index !== -1 && scrollViewRef.current && !isScrolling.current) {
      const scrollPosition = index * 60;
      scrollViewRef.current.scrollTo({
        y: scrollPosition,
        animated: true,
      });
    }
  };

  const handleConfirm = () => {
    onFormationSelect(selectedFormation);
    onClose();
  };

  const updateSelectedFormationBasedOnScroll = (scrollPosition: number) => {
    if (isScrolling.current) return;

    // Calculate which formation should be selected based on scroll position
    const index = Math.round(scrollPosition / 60);
    const clampedIndex = Math.max(0, Math.min(index, formations.length - 1));
    const newFormation = formations[clampedIndex];

    if (newFormation && newFormation.name !== selectedFormation) {
      setSelectedFormation(newFormation.name);
    }
  };

  const onScrollEnd = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    updateSelectedFormationBasedOnScroll(scrollPosition);
    isScrolling.current = false;
  };

  const onScrollBeginDrag = () => {
    isScrolling.current = true;
  };

  useEffect(() => {
    if (visible && scrollViewRef.current) {
      // Find the index of the current formation
      const currentIndex = formations.findIndex(
        (f) => f.name === selectedFormation,
      );
      if (currentIndex !== -1) {
        // Calculate scroll position to center the selected formation
        // Account for the padding offset to align with center indicator
        const scrollPosition = currentIndex * 60;

        // Delay scroll to ensure modal is fully rendered
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: scrollPosition,
            animated: false,
          });
        }, 100);
      }
    }
  }, [visible]);

  const renderFormationItem = (formation: Formation, index: number) => {
    const isSelected = selectedFormation === formation.name;
    const inputRange = [(index - 1) * 60, index * 60, (index + 1) * 60];

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
        key={formation.name}
        style={[
          styles.formationItemContainer,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.formationItem,
            {
              backgroundColor: isSelected
                ? "rgba(128, 128, 128, 0.2)"
                : "transparent",
            },
          ]}
          onPress={() => handleFormationSelect(formation.name)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.formationText,
              {
                color: isSelected
                  ? theme.colors.text
                  : theme.colors.textSecondary || `${theme.colors.text}99`,
                fontSize: isSelected ? 24 : 22,
                fontWeight: isSelected ? "600" : "400",
              },
            ]}
          >
            {formation.displayName}
          </Text>
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
              Select Formation
            </Text>

            <TouchableOpacity
              onPress={handleConfirm}
              style={styles.headerButton}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>

          {/* Formations List */}
          <View style={styles.listContainer}>
            <Animated.ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              snapToInterval={60}
              snapToAlignment="start"
              decelerationRate={0.98}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true },
              )}
              onScrollEndDrag={onScrollEnd}
              onMomentumScrollEnd={onScrollEnd}
              onScrollBeginDrag={onScrollBeginDrag}
              scrollEventThrottle={16}
            >
              {formations.map(renderFormationItem)}
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

          {/* Bottom indicator line */}
          <View style={styles.bottomIndicator} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    height: 250,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.3)",
  },
  headerButton: {
    minWidth: 60,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  cancelText: {
    fontSize: 16,
  },
  confirmText: {
    fontSize: 16,
    color: "#FF4444",
    fontWeight: "500",
  },
  listContainer: {
    flex: 1,
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 60,
    alignItems: "center",
  },
  formationItemContainer: {
    height: 60,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  formationItem: {
    height: 40,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 10,
  },
  formationText: {
    textAlign: "center",
    letterSpacing: 1,
  },
  centerIndicator: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 60,
    marginTop: -30,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "rgba(128, 128, 128, 0.15)",
    backgroundColor: "rgba(128, 128, 128, 0.03)",
    pointerEvents: "none",
    zIndex: 1,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    opacity: 0.6,
    pointerEvents: "none",
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    opacity: 0.6,
    pointerEvents: "none",
  },
  bottomIndicator: {
    height: 3,
    backgroundColor: "rgba(128, 128, 128, 0.4)",
    marginHorizontal: 100,
    borderRadius: 1.5,
    marginBottom: 12,
  },
});
