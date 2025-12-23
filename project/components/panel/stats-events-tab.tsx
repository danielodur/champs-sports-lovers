import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Calendar, Eye, Clock } from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import StatsRecentEvents from "./stats-recent-events";
import StatsRecentVisits from "./stats-recent-visits";
import StatsUpcomingEvents from "./stats-upcoming-events";

interface StatsSection {
  id: string;
  label: string;
  iconName: string;
}

interface StatsEventsTabProps {
  activeStatsSection: string;
  setActiveStatsSection: (sectionId: string) => void;
  sport?: string; // Add sport parameter to filter data by sport type
}

export default function StatsEventsTab({
  activeStatsSection,
  setActiveStatsSection,
  sport = "football", // Default to football
}: StatsEventsTabProps) {
  const theme = useTheme();

  const statsSectionTabs: StatsSection[] = [
    {
      id: "recent-events",
      label: "Recent Events",
      iconName: "calendar",
    },
    {
      id: "recent-visits",
      label: "Recent Visits",
      iconName: "eye",
    },
    {
      id: "upcoming-events",
      label: "Upcoming Events",
      iconName: "clock",
    },
  ];

  const renderSectionIcon = (iconName: string, isActive: boolean) => {
    const color = isActive ? "#FF4757" : theme.colors.textSecondary;

    switch (iconName) {
      case "calendar":
        return <Calendar size={14} color={color} />;
      case "eye":
        return <Eye size={14} color={color} />;
      case "clock":
        return <Clock size={14} color={color} />;
      default:
        return <Calendar size={14} color={color} />;
    }
  };

  const renderActiveContent = () => {
    switch (activeStatsSection) {
      case "recent-events":
        return <StatsRecentEvents sport={sport} />;
      case "recent-visits":
        return <StatsRecentVisits sport={sport} />;
      case "upcoming-events":
        return <StatsUpcomingEvents sport={sport} />;
      default:
        return <StatsRecentEvents sport={sport} />;
    }
  };

  return (
    <View style={styles.statsSectionsContainer}>
      <View style={styles.statsSectionNavContainer}>
        <View style={styles.statsSectionTabsContainer}>
          {statsSectionTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.statsSectionTabButton,
                {
                  backgroundColor:
                    activeStatsSection === tab.id
                      ? theme.colors.backgroundSecondary
                      : "transparent",
                  borderBottomWidth: 0,
                  borderBottomLeftRadius: activeStatsSection === tab.id ? 0 : 8,
                  borderBottomRightRadius:
                    activeStatsSection === tab.id ? 0 : 8,
                },
              ]}
              onPress={() => {
                if (activeStatsSection !== tab.id) {
                  setActiveStatsSection(tab.id);
                }
              }}
              activeOpacity={0.8}
            >
              {renderSectionIcon(tab.iconName, activeStatsSection === tab.id)}
              <Text
                style={[
                  styles.statsSectionTabText,
                  {
                    color:
                      activeStatsSection === tab.id
                        ? "#FF4757"
                        : theme.colors.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeStatsSection && (
        <View
          style={[
            styles.activeTabContentContainer,
            {
              backgroundColor: theme.colors.backgroundSecondary,
            },
          ]}
        >
          <View
            style={[
              styles.statsSectionContent,
              { backgroundColor: theme.colors.backgroundSecondary },
            ]}
          >
            {renderActiveContent()}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statsSectionsContainer: {
    backgroundColor: "transparent",
  },
  statsSectionNavContainer: {
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 0,
  },
  statsSectionTabsContainer: {
    flexDirection: "row",
    backgroundColor: "transparent",
    paddingHorizontal: 0,
  },
  statsSectionTabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 4,
    flex: 1,
    justifyContent: "center",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginHorizontal: 1,
    marginBottom: 0,
  },
  statsSectionTabText: {
    fontSize: 11,
    fontWeight: "600",
  },
  activeTabContentContainer: {
    marginTop: -1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingTop: 4,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsSectionContent: {
    height: 240,
    marginTop: 0,
    marginHorizontal: 0,
    overflow: "hidden",
    paddingTop: 2,
  },
});
