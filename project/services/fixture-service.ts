import ApiSportsService from "./api-sports-service";

export const fixtureService = {
  getFixtures: async (
    teamId?: number,
    leagueId?: number,
    season?: number,
    date?: string,
    status?: string,
    live?: string
  ) => {
    return ApiSportsService.getFixtures(
      teamId,
      leagueId,
      season,
      date,
      status,
      live
    );
  },
};
