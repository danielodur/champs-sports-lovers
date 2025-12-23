import { createApiSportsService } from "./api-sports-service";

// Create a singleton instance
const apiSportsInstance = createApiSportsService();

export const fixtureService = {
  getFixtures: async (
    teamId?: number,
    leagueId?: number,
    season?: number,
    date?: string,
    status?: string,
    live?: string,
  ) => {
    return apiSportsInstance.getFixtures(
      teamId,
      leagueId,
      season,
      date,
      status,
      live,
    );
  },
};
