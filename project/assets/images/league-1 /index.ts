// League 1 Team Images Index - Direct mappings for all team names
// This file maps team display names directly to their PNG files

// Import all team images from their respective folders
const teamImages = {
  // Row 1 teams
  psg: require("./league-1 row 1/psg.png"),
  as_monaco: require("./league-1 row 1/as_monaco.png"),
  lens: require("./league-1 row 1/lens.png"),
  toulouse: require("./league-1 row 1/toulouse.svg.png"),
  nice: require("./league-1 row 1/nice.png"),
  paris_fc: require("./league-1 row 1/paris_fc.png"),
  le_havre: require("./league-1 row 1/le_havre.png"),
  auxerre: require("./league-1 row 1/auxerre.png"),
  metz: require("./league-1 row 1/metz.png"),

  // Row 2 teams
  marseille: require("./league-1 row 2/marseille.png"),
  lyon: require("./league-1 row 2/lyon.png"),
  lille: require("./league-1 row 2/lille.png"),
  strasbourg: require("./league-1 row 2/strasbourg.png"),
  rennais: require("./league-1 row 2/rennais.png"),
  brest: require("./league-1 row 2/brest.png"),
  lorient: require("./league-1 row 2/lorient.png"),
  nantes: require("./league-1 row 2/nantes.png"),
  angers: require("./league-1 row 2/angers.png"),
};

// Direct mapping from display names to image keys
const teamNameMapping = {
  PSG: teamImages.psg,
  "AS Monaco": teamImages.as_monaco,
  Lens: teamImages.lens,
  Toulouse: teamImages.toulouse,
  Nice: teamImages.nice,
  "Paris FC": teamImages.paris_fc,
  "Le Havre": teamImages.le_havre,
  Auxerre: teamImages.auxerre,
  Metz: teamImages.metz,

  Marseille: teamImages.marseille,
  Lyon: teamImages.lyon,
  Lille: teamImages.lille,
  Strasbourg: teamImages.strasbourg,
  Rennais: teamImages.rennais,
  Brest: teamImages.brest,
  Lorient: teamImages.lorient,
  Nantes: teamImages.nantes,
  Angers: teamImages.angers,
};

// Main function to get team image
export const getLeague1TeamImage = (teamName: string): any => {
  console.log(`🔍 Looking up League 1 team: "${teamName}"`);

  // Try exact match first
  if (teamNameMapping[teamName as keyof typeof teamNameMapping]) {
    console.log(`✅ Found exact match for: "${teamName}"`);
    return teamNameMapping[teamName as keyof typeof teamNameMapping];
  }

  // Try case-insensitive match
  const lowerTeamName = teamName.toLowerCase();
  const mappingKeys = Object.keys(teamNameMapping);

  for (const key of mappingKeys) {
    if (key.toLowerCase() === lowerTeamName) {
      console.log(
        `✅ Found case-insensitive match for: "${teamName}" -> "${key}"`,
      );
      return teamNameMapping[key as keyof typeof teamNameMapping];
    }
  }

  console.log(`❌ No image found for League 1 team: "${teamName}"`);
  console.log(`📋 Available teams:`, mappingKeys);
  return null;
};

// Helper function to check if team has real image
export const hasRealLeague1TeamImage = (teamName: string): boolean => {
  return getLeague1TeamImage(teamName) !== null;
};

// Export all images and mappings for debugging
export { teamImages, teamNameMapping };

// Default export
export default getLeague1TeamImage;
