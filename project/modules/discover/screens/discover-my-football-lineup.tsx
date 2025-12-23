import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  startTransition,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
  Share,
  Dimensions,
  Modal,
  FlatList,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ChevronDown, Plus, Minus } from "lucide-react-native";
import MyLinePopularPlayers from "./my-lineup-popular-players";
import ClearMyLineup from "./clear-my-lineup";
import MyLineupManagerSelector from "./my-lineup-manager-selector";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyLineupNationalTeam from "./my-lineup-national-team";
import MyLineupEnglishPL from "./my-lineup-english-pl";
import MyLineupLaLiga from "./my-lineup-laliga";
import MyLineupSerieA from "./my-lineup-serie-a";
import MyLineupBundesliga from "./my-lineup-bundesliga";
import { getManagerImageFromName } from "../../../assets/images/team-managers/index";
import MyLineupLeague1 from "./my-lineup-league-1";
import MyLineupUgandanPL from "./my-lineup-ugandan-pl";
import FormationSelectorModal from "./formation-selector-modal";
import CreateMyLineup from "./create-my-lineup";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  image: string;
  nationality: string;
}

interface LineupPosition {
  id: string;
  x: number;
  y: number;
  player: Player | null;
}

const formations = [
  { id: "4-3-3", name: "4-3-3" },
  { id: "4-4-2", name: "4-4-2" },
  { id: "3-5-2", name: "3-5-2" },
  { id: "4-2-3-1", name: "4-2-3-1" },
];

const leagues = [
  { id: "popular", name: "Popular", color: "#FF6B35" },
  { id: "national", name: "National Team", color: "#4ECDC4" },
  { id: "epl", name: "English PL", color: "#45B7D1" },
  { id: "laliga", name: "La Liga", color: "#96CEB4" },
  { id: "seriea", name: "Serie A", color: "#DDA0DD" },
  { id: "bundesliga", name: "Bundesliga", color: "#FFEAA7" },
  { id: "ligue1", name: "League 1", color: "#98D8C8" },
  { id: "upl", name: "Ugandan PL", color: "#FF9A8B" },
  { id: "saudipro", name: "Saudi Pro L", color: "#A8E6CF" },
];

export default function DiscoverMyFootballLineupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const [selectedFormation, setSelectedFormation] = useState("4-4-2");
  const [showFormationDropdown, setShowFormationDropdown] = useState(false);
  const [activeLeague, setActiveLeague] = useState("popular");
  const [lineup, setLineup] = useState<LineupPosition[]>([]);
  const [editMode, setEditMode] = useState(false);

  const animatedValues = useRef<{ [key: string]: Animated.ValueXY }>({});
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(
    null,
  );
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [managerName, setManagerName] = useState("Select Manager");
  const [isManagerModalVisible, setIsManagerModalVisible] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [showPositionAlert, setShowPositionAlert] = useState(false);

  // Formation position mappings - adjusted for one half of the pitch
  const getFormationPositions = (formation: string): LineupPosition[] => {
    const formationMap: Record<string, LineupPosition[]> = {
      "4-3-3": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "lb", x: 10, y: 70, player: null },
        { id: "cb1", x: 35, y: 70, player: null },
        { id: "cb2", x: 65, y: 70, player: null },
        { id: "rb", x: 90, y: 70, player: null },
        { id: "lm", x: 20, y: 50, player: null },
        { id: "cm", x: 50, y: 48, player: null },
        { id: "rm", x: 80, y: 50, player: null },
        { id: "lw", x: 18, y: 25, player: null },
        { id: "cf", x: 50, y: 20, player: null },
        { id: "rw", x: 82, y: 25, player: null },
      ],
      "5-4-1": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "lwb", x: 10, y: 62, player: null },
        { id: "cb1", x: 27, y: 67, player: null },
        { id: "cb2", x: 50, y: 70, player: null },
        { id: "cb3", x: 73, y: 67, player: null },
        { id: "rwb", x: 90, y: 62, player: null },
        { id: "lm", x: 20, y: 45, player: null },
        { id: "cm1", x: 37, y: 50, player: null },
        { id: "cm2", x: 63, y: 50, player: null },
        { id: "rm", x: 80, y: 45, player: null },
        { id: "cf", x: 50, y: 20, player: null },
      ],
      "5-3-2": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "lwb", x: 10, y: 62, player: null },
        { id: "cb1", x: 27, y: 67, player: null },
        { id: "cb2", x: 50, y: 70, player: null },
        { id: "cb3", x: 73, y: 67, player: null },
        { id: "rwb", x: 90, y: 62, player: null },
        { id: "lm", x: 30, y: 50, player: null },
        { id: "cm", x: 50, y: 45, player: null },
        { id: "rm", x: 70, y: 50, player: null },
        { id: "lf", x: 35, y: 25, player: null },
        { id: "rf", x: 65, y: 25, player: null },
      ],
      "3-4-1-2": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "cb1", x: 25, y: 67, player: null },
        { id: "cb2", x: 50, y: 70, player: null },
        { id: "cb3", x: 75, y: 67, player: null },
        { id: "lwb", x: 10, y: 55, player: null },
        { id: "cm1", x: 35, y: 50, player: null },
        { id: "cm2", x: 65, y: 50, player: null },
        { id: "rwb", x: 90, y: 55, player: null },
        { id: "cam", x: 50, y: 30, player: null },
        { id: "lf", x: 35, y: 20, player: null },
        { id: "rf", x: 65, y: 20, player: null },
      ],
      "3-4-2-1": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "cb1", x: 25, y: 67, player: null },
        { id: "cb2", x: 50, y: 70, player: null },
        { id: "cb3", x: 75, y: 67, player: null },
        { id: "lwb", x: 10, y: 55, player: null },
        { id: "cm1", x: 35, y: 50, player: null },
        { id: "cm2", x: 65, y: 50, player: null },
        { id: "rwb", x: 90, y: 55, player: null },
        { id: "lam", x: 35, y: 30, player: null },
        { id: "ram", x: 65, y: 30, player: null },
        { id: "cf", x: 50, y: 20, player: null },
      ],
      "3-4-3": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "cb1", x: 25, y: 67, player: null },
        { id: "cb2", x: 50, y: 70, player: null },
        { id: "cb3", x: 75, y: 67, player: null },
        { id: "lwb", x: 10, y: 55, player: null },
        { id: "cm1", x: 35, y: 50, player: null },
        { id: "cm2", x: 65, y: 50, player: null },
        { id: "rwb", x: 90, y: 55, player: null },
        { id: "lw", x: 5, y: 25, player: null },
        { id: "cf", x: 50, y: 20, player: null },
        { id: "rw", x: 95, y: 25, player: null },
      ],
      "3-5-2": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "cb1", x: 25, y: 67, player: null },
        { id: "cb2", x: 50, y: 70, player: null },
        { id: "cb3", x: 75, y: 67, player: null },
        { id: "lwb", x: 10, y: 55, player: null },
        { id: "lm", x: 30, y: 45, player: null },
        { id: "cm", x: 50, y: 50, player: null },
        { id: "rm", x: 70, y: 45, player: null },
        { id: "rwb", x: 90, y: 55, player: null },
        { id: "lf", x: 35, y: 25, player: null },
        { id: "rf", x: 65, y: 25, player: null },
      ],
      "4-1-2-1-2": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "lb", x: 15, y: 62, player: null },
        { id: "cb1", x: 35, y: 67, player: null },
        { id: "cb2", x: 65, y: 67, player: null },
        { id: "rb", x: 85, y: 62, player: null },
        { id: "dm", x: 50, y: 60, player: null },
        { id: "cm1", x: 35, y: 45, player: null },
        { id: "cm2", x: 65, y: 45, player: null },
        { id: "cam", x: 50, y: 30, player: null },
        { id: "lf", x: 35, y: 20, player: null },
        { id: "rf", x: 65, y: 20, player: null },
      ],
      "4-2-4": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "lb", x: 15, y: 62, player: null },
        { id: "cb1", x: 35, y: 67, player: null },
        { id: "cb2", x: 65, y: 67, player: null },
        { id: "rb", x: 85, y: 62, player: null },
        { id: "cm1", x: 35, y: 50, player: null },
        { id: "cm2", x: 65, y: 50, player: null },
        { id: "lw", x: 5, y: 25, player: null },
        { id: "lf", x: 35, y: 20, player: null },
        { id: "rf", x: 65, y: 20, player: null },
        { id: "rw", x: 95, y: 25, player: null },
      ],
      "4-1-3-2": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "lb", x: 15, y: 62, player: null },
        { id: "cb1", x: 35, y: 67, player: null },
        { id: "cb2", x: 65, y: 67, player: null },
        { id: "rb", x: 85, y: 62, player: null },
        { id: "dm", x: 50, y: 55, player: null },
        { id: "lm", x: 25, y: 40, player: null },
        { id: "cam", x: 50, y: 35, player: null },
        { id: "rm", x: 75, y: 40, player: null },
        { id: "lf", x: 35, y: 20, player: null },
        { id: "rf", x: 65, y: 20, player: null },
      ],
      "4-2-3-1": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "lb", x: 15, y: 62, player: null },
        { id: "cb1", x: 35, y: 67, player: null },
        { id: "cb2", x: 65, y: 67, player: null },
        { id: "rb", x: 85, y: 62, player: null },
        { id: "cdm1", x: 35, y: 55, player: null },
        { id: "cdm2", x: 65, y: 55, player: null },
        { id: "lam", x: 20, y: 32, player: null },
        { id: "cam", x: 50, y: 35, player: null },
        { id: "ram", x: 80, y: 32, player: null },
        { id: "cf", x: 50, y: 20, player: null },
      ],
      "4-4-1-1": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "lb", x: 15, y: 62, player: null },
        { id: "cb1", x: 35, y: 67, player: null },
        { id: "cb2", x: 65, y: 67, player: null },
        { id: "rb", x: 85, y: 62, player: null },
        { id: "lm", x: 12, y: 50, player: null },
        { id: "cm1", x: 35, y: 45, player: null },
        { id: "cm2", x: 65, y: 45, player: null },
        { id: "rm", x: 88, y: 50, player: null },
        { id: "cam", x: 50, y: 30, player: null },
        { id: "cf", x: 50, y: 20, player: null },
      ],
      "4-4-2": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "lb", x: 15, y: 62, player: null },
        { id: "cb1", x: 35, y: 67, player: null },
        { id: "cb2", x: 65, y: 67, player: null },
        { id: "rb", x: 85, y: 62, player: null },
        { id: "lm", x: 12, y: 50, player: null },
        { id: "cm1", x: 35, y: 45, player: null },
        { id: "cm2", x: 65, y: 45, player: null },
        { id: "rm", x: 88, y: 50, player: null },
        { id: "lf", x: 30, y: 25, player: null },
        { id: "rf", x: 70, y: 25, player: null },
      ],
      "4-3-1-2": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "lb", x: 15, y: 62, player: null },
        { id: "cb1", x: 35, y: 67, player: null },
        { id: "cb2", x: 65, y: 67, player: null },
        { id: "rb", x: 85, y: 62, player: null },
        { id: "lm", x: 25, y: 50, player: null },
        { id: "cm", x: 50, y: 45, player: null },
        { id: "rm", x: 75, y: 50, player: null },
        { id: "cam", x: 50, y: 30, player: null },
        { id: "lf", x: 35, y: 20, player: null },
        { id: "rf", x: 65, y: 20, player: null },
      ],
      "4-3-2-1": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "lb", x: 15, y: 62, player: null },
        { id: "cb1", x: 35, y: 67, player: null },
        { id: "cb2", x: 65, y: 67, player: null },
        { id: "rb", x: 85, y: 62, player: null },
        { id: "lm", x: 25, y: 50, player: null },
        { id: "cm", x: 50, y: 45, player: null },
        { id: "rm", x: 75, y: 50, player: null },
        { id: "lam", x: 35, y: 28, player: null },
        { id: "ram", x: 65, y: 28, player: null },
        { id: "cf", x: 50, y: 20, player: null },
      ],
      "4-1-4-1": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "lb", x: 15, y: 62, player: null },
        { id: "cb1", x: 35, y: 67, player: null },
        { id: "cb2", x: 65, y: 67, player: null },
        { id: "rb", x: 85, y: 62, player: null },
        { id: "dm", x: 50, y: 58, player: null },
        { id: "lm", x: 15, y: 40, player: null },
        { id: "cm1", x: 35, y: 35, player: null },
        { id: "cm2", x: 65, y: 35, player: null },
        { id: "rm", x: 85, y: 40, player: null },
        { id: "cf", x: 50, y: 20, player: null },
      ],
      "4-5-1": [
        { id: "gk", x: 50, y: 78, player: null },
        { id: "lb", x: 15, y: 62, player: null },
        { id: "cb1", x: 35, y: 67, player: null },
        { id: "cb2", x: 65, y: 67, player: null },
        { id: "rb", x: 85, y: 62, player: null },
        { id: "lm", x: 15, y: 45, player: null },
        { id: "cm1", x: 30, y: 40, player: null },
        { id: "cm", x: 50, y: 45, player: null },
        { id: "cm2", x: 70, y: 40, player: null },
        { id: "rm", x: 85, y: 45, player: null },
        { id: "cf", x: 50, y: 20, player: null },
      ],
    };

    return formationMap[formation] || formationMap["4-4-2"];
  };

  useEffect(() => {
    const initialFormation = getFormationPositions("4-4-2");
    setLineup(initialFormation);
    // Initialize animated values for the default formation
    initialFormation.forEach((position) => {
      animatedValues.current[position.id] = new Animated.ValueXY({
        x: position.x,
        y: position.y,
      });
    });

    // Load manager name from storage
    loadManagerName();
  }, []);

  const loadManagerName = async () => {
    try {
      const storedManager = await AsyncStorage.getItem("lineup_manager_name");
      if (storedManager) {
        setManagerName(storedManager);
      }
    } catch (error) {
      console.error("Error loading manager name:", error);
    }
  };

  const handleManagerSelect = async (manager: string) => {
    setManagerName(manager);
    try {
      await AsyncStorage.setItem("lineup_manager_name", manager);
    } catch (error) {
      console.error("Error saving manager name:", error);
    }
  };

  const handlePlayerSelection = (player: Player) => {
    if (selectedPositionId) {
      // Check if player is already in any position in the lineup
      const isPlayerAlreadyInLineup = lineup.some(
        (position) => position.player && position.player.id === player.id,
      );

      if (isPlayerAlreadyInLineup) {
        // Show alert using same system as national teams
        setShowPositionAlert(true);
        setTimeout(() => setShowPositionAlert(false), 2000);
        setSelectedPositionId(null);
        return;
      }

      // Get the current player in the selected position (if any)
      const currentPositionPlayer = lineup.find(
        (position) => position.id === selectedPositionId,
      )?.player;

      setLineup((prev) =>
        prev.map((pos) =>
          pos.id === selectedPositionId ? { ...pos, player } : pos,
        ),
      );

      // Update selected players list
      const updatedSelectedPlayers = [...selectedPlayers];

      // Remove the previous player from selected list if there was one
      if (currentPositionPlayer) {
        const prevPlayerIndex = updatedSelectedPlayers.findIndex(
          (p) => p.id === currentPositionPlayer.id,
        );
        if (prevPlayerIndex !== -1) {
          updatedSelectedPlayers.splice(prevPlayerIndex, 1);
        }
      }

      // Add new player to selected list if not already there
      const isAlreadySelected = updatedSelectedPlayers.some(
        (p) => p.id === player.id,
      );
      if (!isAlreadySelected) {
        updatedSelectedPlayers.push(player);
      }

      setSelectedPlayers(updatedSelectedPlayers);
      setSelectedPositionId(null);
    }
  };

  // Open player selection - just set the selected position for instant selection
  const openPlayerSelection = (positionId: string) => {
    setSelectedPositionId(positionId);

    // Auto-clear selection after 30 seconds if no player is selected
    setTimeout(() => {
      setSelectedPositionId((current) =>
        current === positionId ? null : current,
      );
    }, 30000);
  };

  // Handle player selection from popular players
  const handlePlayerSelect = (player: Player) => {
    if (selectedPositionId) {
      // Check if player is already in any position in the lineup
      const isPlayerAlreadyInLineup = lineup.some(
        (position) => position.player && position.player.id === player.id,
      );

      if (isPlayerAlreadyInLineup) {
        // Show alert using same system as national teams
        setShowPositionAlert(true);
        setTimeout(() => setShowPositionAlert(false), 2000);
        setSelectedPositionId(null);
        return;
      }

      // Get the current player in the selected position (if any)
      const currentPositionPlayer = lineup.find(
        (position) => position.id === selectedPositionId,
      )?.player;

      // Replace player in the selected position
      const updatedLineup = lineup.map((position) => {
        if (position.id === selectedPositionId) {
          return { ...position, player };
        }
        return position;
      });
      setLineup(updatedLineup);

      // Update selected players list
      const updatedSelectedPlayers = [...selectedPlayers];

      // Remove the previous player from selected list if there was one
      if (currentPositionPlayer) {
        const prevPlayerIndex = updatedSelectedPlayers.findIndex(
          (p) => p.id === currentPositionPlayer.id,
        );
        if (prevPlayerIndex !== -1) {
          updatedSelectedPlayers.splice(prevPlayerIndex, 1);
        }
      }

      // Add new player to selected list if not already there
      const isAlreadySelected = updatedSelectedPlayers.some(
        (p) => p.id === player.id,
      );
      if (!isAlreadySelected) {
        updatedSelectedPlayers.push(player);
      }

      setSelectedPlayers(updatedSelectedPlayers);

      // Clear selection immediately
      setSelectedPositionId(null);
    }
  };

  // Handle player replacement in formation
  const handlePlayerReplace = (positionId: string, player: Player) => {
    startTransition(() => {
      const updatedLineup = lineup.map((position) => {
        if (position.id === positionId) {
          return { ...position, player };
        }
        return position;
      });
      setLineup(updatedLineup);

      // Update selected players list
      const isAlreadySelected = selectedPlayers.some((p) => p.id === player.id);
      if (!isAlreadySelected) {
        setSelectedPlayers((prev) => [...prev, player]);
      }
    });
  };

  // Smart function to determine which tabs have players in the lineup
  const getTabsWithPlayers = () => {
    const tabsWithPlayers = new Set<string>();

    lineup.forEach((position) => {
      if (position.player) {
        const player = position.player;

        // Check if player is from national teams (most reliable indicator)
        if (
          player.nationality &&
          player.team &&
          (player.team.includes("National Team") ||
            player.team === "Uganda National Team" ||
            player.team === "Argentina National Team" ||
            player.team === "Brazil National Team" ||
            player.team === "France National Team")
        ) {
          tabsWithPlayers.add("national");
        }
        // Check if player has remote image URL (from national team API)
        else if (player.image && player.image.startsWith("http")) {
          tabsWithPlayers.add("national");
        }
        // Check specific leagues based on team names
        else if (player.team) {
          const team = player.team.toLowerCase();

          // English Premier League teams
          if (
            team.includes("arsenal") ||
            team.includes("manchester united") ||
            team.includes("manchester city") ||
            team.includes("liverpool") ||
            team.includes("chelsea") ||
            team.includes("tottenham") ||
            team.includes("newcastle") ||
            team.includes("brighton") ||
            team.includes("aston villa")
          ) {
            tabsWithPlayers.add("epl");
          }
          // La Liga teams
          else if (
            team.includes("real madrid") ||
            team.includes("barcelona") ||
            team.includes("atletico madrid") ||
            team.includes("sevilla") ||
            team.includes("valencia") ||
            team.includes("real sociedad") ||
            team.includes("athletic bilbao")
          ) {
            tabsWithPlayers.add("laliga");
          }
          // Serie A teams
          else if (
            team.includes("juventus") ||
            team.includes("inter") ||
            team.includes("milan") ||
            team.includes("napoli") ||
            team.includes("roma") ||
            team.includes("lazio") ||
            team.includes("atalanta")
          ) {
            tabsWithPlayers.add("seriea");
          }
          // Bundesliga teams
          else if (
            team.includes("bayern munich") ||
            team.includes("borussia dortmund") ||
            team.includes("rb leipzig") ||
            team.includes("bayer leverkusen") ||
            team.includes("eintracht frankfurt") ||
            team.includes("borussia")
          ) {
            tabsWithPlayers.add("bundesliga");
          }
          // Ligue 1 teams
          else if (
            team.includes("psg") ||
            team.includes("paris saint-germain") ||
            team.includes("marseille") ||
            team.includes("lyon") ||
            team.includes("monaco") ||
            team.includes("lille") ||
            team.includes("rennes")
          ) {
            tabsWithPlayers.add("ligue1");
          }
          // Ugandan Premier League teams
          else if (
            team.includes("vipers") ||
            team.includes("kcca") ||
            team.includes("express") ||
            team.includes("villa") ||
            team.includes("sc villa") ||
            team.includes("bul fc")
          ) {
            tabsWithPlayers.add("upl");
          }
          // If no specific league detected, consider it popular
          else {
            tabsWithPlayers.add("popular");
          }
        }
        // Default to popular if no team info
        else {
          tabsWithPlayers.add("popular");
        }
      }
    });

    return tabsWithPlayers;
  };

  const tabsWithPlayers = useMemo(() => getTabsWithPlayers(), [lineup]);

  // Handle clearing the lineup
  const handleClearLineup = async () => {
    // Clear all data and reset to fresh formation positions
    const freshPositions = getFormationPositions(selectedFormation);
    setLineup(freshPositions);
    setSelectedPlayers([]);

    // Clear manager selection
    setManagerName("Select Manager");
    try {
      await AsyncStorage.removeItem("lineup_manager_name");
    } catch (error) {
      console.error("Error clearing manager from storage:", error);
    }

    // Clear any animated values
    Object.keys(animatedValues.current).forEach((key) => {
      delete animatedValues.current[key];
    });

    // Re-initialize animated values for fresh positions
    freshPositions.forEach((position) => {
      animatedValues.current[position.id] = new Animated.ValueXY({
        x: position.x,
        y: position.y,
      });
    });
  };

  const handlePlayerRemoval = (positionId: string) => {
    setLineup((prev) =>
      prev.map((pos) =>
        pos.id === positionId ? { ...pos, player: null } : pos,
      ),
    );
  };

  const handleSave = async () => {
    router.push({
      pathname: "/save-share-my-lineup",
      params: {
        formation: selectedFormation,
        lineup: JSON.stringify(lineup),
        managerName: managerName,
        selectedPlayers: JSON.stringify(selectedPlayers),
      },
    });
  };

  const renderPlayersSection = () => {
    if (activeLeague === "popular") {
      return (
        <MyLinePopularPlayers
          onPlayerSelect={handlePlayerSelect}
          selectedPlayers={selectedPlayers}
          selectedPositionId={selectedPositionId}
          onShowAlert={() => {
            setShowPositionAlert(true);
            setTimeout(() => setShowPositionAlert(false), 2000);
          }}
        />
      );
    }

    if (activeLeague === "national") {
      return (
        <MyLineupNationalTeam
          onCountrySelect={(countryId) =>
            console.log("Selected country:", countryId)
          }
          onPlayerSelect={handlePlayerSelect}
          selectedPositionId={selectedPositionId}
          selectedPlayers={selectedPlayers}
          onShowAlert={() => {
            setShowPositionAlert(true);
            setTimeout(() => setShowPositionAlert(false), 2000);
          }}
        />
      );
    }

    if (activeLeague === "epl") {
      return (
        <MyLineupEnglishPL
          onTeamSelect={(teamId) => console.log("Selected team:", teamId)}
          onPlayerSelect={handlePlayerSelect}
          selectedPositionId={selectedPositionId}
          selectedPlayers={selectedPlayers}
          onShowAlert={() => {
            setShowPositionAlert(true);
            setTimeout(() => setShowPositionAlert(false), 2000);
          }}
        />
      );
    }

    if (activeLeague === "laliga") {
      return (
        <MyLineupLaLiga
          onTeamSelect={(teamId) => console.log("Selected team:", teamId)}
          onPlayerSelect={handlePlayerSelect}
          selectedPositionId={selectedPositionId}
          selectedPlayers={selectedPlayers}
          onShowAlert={() => {
            setShowPositionAlert(true);
            setTimeout(() => setShowPositionAlert(false), 2000);
          }}
        />
      );
    }

    if (activeLeague === "seriea") {
      return (
        <MyLineupSerieA
          onTeamSelect={(teamId) => console.log("Selected team:", teamId)}
        />
      );
    }

    if (activeLeague === "bundesliga") {
      return (
        <MyLineupBundesliga
          onTeamSelect={(teamId) => console.log("Selected team:", teamId)}
        />
      );
    }

    if (activeLeague === "ligue1") {
      return (
        <MyLineupLeague1
          onTeamSelect={(teamId) => console.log("Selected team:", teamId)}
        />
      );
    }

    if (activeLeague === "upl") {
      return (
        <MyLineupUgandanPL
          onTeamSelect={(teamId) => console.log("Selected team:", teamId)}
        />
      );
    }

    // For other leagues, show placeholder content
    return (
      <View style={styles.leaguePlaceholder}>
        <Text
          style={[
            styles.placeholderText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {activeLeague} players will be added here
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            router.back();
          }}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          My Lineup
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={[styles.saveButtonText, { color: "#FF0000" }]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
      >
        {/* Formation and Manager Selector */}
        <View style={styles.formationSection}>
          <View style={styles.formationRow}>
            <Text style={[styles.formationLabel, { color: theme.colors.text }]}>
              Formation
            </Text>
            <TouchableOpacity
              style={[
                styles.formationSelector,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setShowFormationModal(true)}
            >
              <Text
                style={[styles.formationText, { color: theme.colors.text }]}
              >
                {selectedFormation}
              </Text>
              <ChevronDown size={20} color={theme.colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.managerSelector}
              onPress={() => setIsManagerModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.managerContent}>
                {(() => {
                  const managerImage = getManagerImageFromName(managerName);

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
                <View style={styles.managerNameRow}>
                  <Text
                    style={[styles.managerText, { color: theme.colors.text }]}
                  >
                    {managerName}
                  </Text>
                  <ChevronDown size={12} color={theme.colors.text} />
                </View>
              </View>
            </TouchableOpacity>

            <ClearMyLineup onClear={handleClearLineup} disabled={false} />
          </View>
        </View>

        {/* Football Pitch with CreateMyLineup */}
        <CreateMyLineup
          formation={selectedFormation}
          lineup={lineup}
          onPlayerSelect={openPlayerSelection}
          onPlayerReplace={handlePlayerReplace}
          selectedPlayers={selectedPlayers}
          selectedPositionId={selectedPositionId}
          animatedValues={animatedValues}
        />

        {/* Position Selection Alert Overlay */}
        {showPositionAlert && (
          <View style={styles.alertOverlay}>
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>
                {selectedPositionId
                  ? "Player already in lineup!"
                  : "Please select a position first"}
              </Text>
            </View>
          </View>
        )}

        {/* League Tabs */}
        <View
          style={[
            styles.leagueTabsContainer,
            {
              backgroundColor:
                theme.colors.background === "#FFFFFF" ||
                theme.colors.background === "#ffffff"
                  ? "rgba(128, 128, 128, 0.3)"
                  : "rgba(128, 128, 128, 0.15)",
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.leagueTabs}
            contentContainerStyle={styles.leagueTabsContent}
            decelerationRate="fast"
            snapToAlignment="start"
            scrollEventThrottle={16}
            bounces={true}
          >
            {leagues.map((league) => (
              <TouchableOpacity
                key={league.id}
                style={styles.leagueTab}
                onPress={() => setActiveLeague(league.id)}
              >
                {/* Red dot indicator */}
                {tabsWithPlayers.has(league.id) && (
                  <View style={styles.redDot} />
                )}
                <Text
                  style={[
                    styles.leagueTabText,
                    {
                      color:
                        activeLeague === league.id
                          ? theme.colors.background === "#FFFFFF" ||
                            theme.colors.background === "#ffffff"
                            ? "#333333"
                            : "#FFFFFF"
                          : theme.colors.background === "#FFFFFF" ||
                              theme.colors.background === "#ffffff"
                            ? "rgba(80, 80, 80, 0.9)"
                            : "rgba(200, 200, 200, 0.9)",
                      fontWeight: activeLeague === league.id ? "600" : "400",
                    },
                  ]}
                >
                  {league.name}
                </Text>
                {activeLeague === league.id && (
                  <View
                    style={[
                      styles.activeUnderline,
                      { backgroundColor: "#FF0000" },
                    ]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Players Section */}
        <View style={styles.playersContainer}>{renderPlayersSection()}</View>
      </ScrollView>

      {/* Scroll Indicator - positioned at screen bottom */}
      <View style={styles.scrollIndicatorContainer}>
        <View style={styles.scrollTrack}>
          <View
            style={[
              styles.scrollIndicator,
              {
                left: `${scrollProgress * 80}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Formation Selector Modal */}
      <FormationSelectorModal
        visible={showFormationModal}
        onClose={() => setShowFormationModal(false)}
        onFormationSelect={(formation) => {
          setSelectedFormation(formation);
          // Update lineup positions based on selected formation
          const newFormationPositions = getFormationPositions(formation);

          // Animate position changes with smooth easing
          newFormationPositions.forEach((newPosition) => {
            if (animatedValues.current[newPosition.id]) {
              Animated.parallel([
                Animated.timing(animatedValues.current[newPosition.id].x, {
                  toValue: newPosition.x,
                  duration: 1200,
                  useNativeDriver: false,
                  // Add smooth easing for natural movement
                  easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
                }),
                Animated.timing(animatedValues.current[newPosition.id].y, {
                  toValue: newPosition.y,
                  duration: 1200,
                  useNativeDriver: false,
                  easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
                }),
              ]).start();
            } else {
              // Initialize animated value for new positions
              animatedValues.current[newPosition.id] = new Animated.ValueXY({
                x: newPosition.x,
                y: newPosition.y,
              });
            }
          });

          // Preserve existing players by mapping them to similar positions
          const updatedLineup = newFormationPositions.map((newPosition) => {
            // Try to find a similar player from the current lineup
            const existingPlayer = lineup.find((oldPosition) => {
              // Map similar position types
              if (newPosition.id === oldPosition.id) return true;

              // Goalkeeper mapping
              if (newPosition.id === "gk" && oldPosition.id === "gk")
                return true;

              // Defender mappings
              const defenderPositions = [
                "lb",
                "cb1",
                "cb2",
                "cb3",
                "rb",
                "lwb",
                "rwb",
              ];
              if (
                defenderPositions.includes(newPosition.id) &&
                defenderPositions.includes(oldPosition.id)
              ) {
                return !newFormationPositions.find(
                  (pos) => pos.id === oldPosition.id,
                );
              }

              // Midfielder mappings
              const midfielderPositions = [
                "lm",
                "cm",
                "cm1",
                "cm2",
                "rm",
                "dm",
                "cam",
                "lam",
                "ram",
                "cdm1",
                "cdm2",
              ];
              if (
                midfielderPositions.includes(newPosition.id) &&
                midfielderPositions.includes(oldPosition.id)
              ) {
                return !newFormationPositions.find(
                  (pos) => pos.id === oldPosition.id,
                );
              }

              // Forward mappings
              const forwardPositions = ["lw", "cf", "rw", "lf", "rf"];
              if (
                forwardPositions.includes(newPosition.id) &&
                forwardPositions.includes(oldPosition.id)
              ) {
                return !newFormationPositions.find(
                  (pos) => pos.id === oldPosition.id,
                );
              }

              return false;
            });

            return {
              ...newPosition,
              player: existingPlayer?.player || null,
            };
          });

          setLineup(updatedLineup);
        }}
        currentFormation={selectedFormation}
      />

      {/* Manager Selector Modal */}
      <MyLineupManagerSelector
        visible={isManagerModalVisible}
        onClose={() => setIsManagerModalVisible(false)}
        onManagerSelect={handleManagerSelect}
        currentManager={managerName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 1000,
    elevation: 1000,
    position: "relative",
  },
  backButton: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 48,
    minHeight: 48,
    zIndex: 1001,
    elevation: 1001,
    position: "relative",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1001,
    elevation: 1001,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    zIndex: 1001,
    elevation: 1001,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: "transparent",
    zIndex: 1001,
    elevation: 1001,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  formationSection: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    zIndex: 1001,
    elevation: 1001,
    position: "relative",
  },
  formationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  formationLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  formationSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 12,
    marginRight: 12,
    zIndex: 1002,
    elevation: 1002,
  },
  formationText: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 8,
  },
  managerSelector: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 120,
    maxWidth: 140,
    marginLeft: 8,
    zIndex: 1002,
    elevation: 1002,
  },
  managerContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  managerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  managerPortrait: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(128, 128, 128, 0.3)",
    marginBottom: 4,
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
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 13,
    marginRight: 2,
  },
  pitchContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: -55,
    marginTop: -8,
  },
  pitch: {
    position: "relative",
    height: 540,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 0,
  },
  pitchImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playerPosition: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -18 }, { translateY: -18 }],
    zIndex: 10,
  },
  playerSlot: {
    alignItems: "center",
    position: "relative",
  },
  playerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#fff",
  },
  removeButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  playerName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 8,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    maxWidth: 70,
    textAlign: "center",
  },
  emptySlot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
    borderStyle: "dashed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  leagueTabsContainer: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginTop: -120,
  },
  leagueTabs: {
    flexGrow: 0,
  },
  leagueTabsContent: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  leagueTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    position: "relative",
    minWidth: 65,
    alignItems: "center",
    justifyContent: "center",
  },
  activeLeagueTab: {
    // This style is applied when tab is active
  },
  leagueTabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeUnderline: {
    position: "absolute",
    bottom: -2,
    alignSelf: "center",
    width: 40,
    height: 3,
    borderRadius: 2,
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    flexGrow: 1,
    paddingBottom: 180,
  },
  playersContainer: {
    minHeight: 600,
    marginTop: 10,
    paddingBottom: 40,
  },
  leaguePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: 14,
    textAlign: "center",
  },

  scrollIndicatorContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scrollTrack: {
    width: 60,
    height: 3,
    backgroundColor: "rgba(255, 68, 68, 0.15)",
    borderRadius: 1.5,
    position: "relative",
  },
  scrollIndicator: {
    position: "absolute",
    top: -0.5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FF4444",
  },
  alertOverlay: {
    position: "absolute",
    top: "35%",
    left: "50%",
    transform: [{ translateX: -100 }, { translateY: -20 }],
    width: 200,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    borderRadius: 6,
  },
  alertBox: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  alertText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  redDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4444",
    zIndex: 1,
  },
});
