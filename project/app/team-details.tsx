import React from "react";
import { useLocalSearchParams } from "expo-router";
import NewsTeamDetails from "@/modules/news/components/content/shared/team-details/news-team-details";

export default function TeamDetailsScreen() {
  const { teamId, teamName, sport } = useLocalSearchParams();
  const sportParam = (sport as string) || "football"; // ✅ Get sport from params

  // Use teamId if available, otherwise derive from teamName
  const finalTeamId =
    teamId ||
    (teamName
      ? (teamName as string)
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "") + "-fc"
      : "elche-fc");

  return (
    <NewsTeamDetails
      teamId={finalTeamId as string}
      teamData={undefined} // Let the component use its own configurations
      sport={sportParam} // ✅ Pass sport to child component
    />
  );
}
