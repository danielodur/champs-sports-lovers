// Bundesliga Team Images Index - Updated for new team configuration
// Maps logoKey values from bundesliga-config.ts to their PNG files

// Import all team images from their respective folders
const teamImages = {
  // Row 1 teams
  bayern: require("./bundesliga row 1/bayern.png"),
  dortmund: require("./bundesliga row 1/dortmund.png"),
  rb_leipzig: require("./bundesliga row 1/rb_Leipzig.png"),
  union_berlin: require("./bundesliga row 1/union_berlin.png"),
  freiburg: require("./bundesliga row 1/freiburg.png"),
  leverkusen: require("./bundesliga row 1/leverkusen.png"),
  frankfurt: require("./bundesliga row 1/frankfurt.png"),
  wolfsburg: require("./bundesliga row 1/wolfsburg.png"),
  mainz: require("./bundesliga row 1/mainz.png"),

  // Row 2 teams
  hoffenheim: require("./bundesliga row 2/hoffenheim.png"),
  gladbach: require("./bundesliga row 2/gladbach.png"),
  fc_koln: require("./bundesliga row 2/fc_Koln.png"),
  werder_bremen: require("./bundesliga row 2/werder-bremen.png"),
  augsburg: require("./bundesliga row 2/augsburg.png"),
  hamburger: require("./bundesliga row 2/hamburger.png"),
  st_pauli: require("./bundesliga row 2/st_pauli.png"),
  stuttgart: require("./bundesliga row 2/stuttgart.png"),
  heidenhein: require("./bundesliga row 2/heidenhein.png"),
};

// Direct mapping from logoKey values (from bundesliga-config.ts) to image files
const teamNameMapping = {
  // Row 1 - logoKey mappings
  "Bayern Munich": teamImages.bayern,
  "Borussia Dortmund": teamImages.dortmund,
  "RB Leipzig": teamImages.rb_leipzig,
  "Bayer Leverkusen": teamImages.leverkusen,
  "Eintracht Frankfurt": teamImages.frankfurt,
  "Borussia Monchengladbach": teamImages.gladbach,
  "VfL Wolfsburg": teamImages.wolfsburg,
  "Werder Bremen": teamImages.werder_bremen,
  "SC Freiburg": teamImages.freiburg,

  // Row 2 - logoKey mappings
  "Union Berlin": teamImages.union_berlin,
  "VfB Stuttgart": teamImages.stuttgart,
  "TSG Hoffenheim": teamImages.hoffenheim,
  "FC Augsburg": teamImages.augsburg,
  "Mainz 05": teamImages.mainz,
  "FC Koln": teamImages.fc_koln,
  "Hertha Berlin": teamImages.hamburger, // Using hamburger as placeholder for Hertha
  "VfL Bochum": teamImages.st_pauli, // Using st_pauli as placeholder for Bochum
  "FC Heidenheim": teamImages.heidenhein,

  // Alternative name mappings for flexibility
  Bayern: teamImages.bayern,
  Dortmund: teamImages.dortmund,
  Leipzig: teamImages.rb_leipzig,
  Leverkusen: teamImages.leverkusen,
  "M'gladbach": teamImages.gladbach,
  Bremen: teamImages.werder_bremen,
  Köln: teamImages.fc_koln,
  "Hertha BSC": teamImages.hamburger,
  Bochum: teamImages.st_pauli,
};

// Main function to get team image
export const getBundesligaTeamImage = (teamName: string): any => {
  console.log(`🔍 Looking up Bundesliga team: "${teamName}"`);

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

  // Try partial matches for common variations
  for (const key of mappingKeys) {
    if (
      key.toLowerCase().includes(lowerTeamName) ||
      lowerTeamName.includes(key.toLowerCase())
    ) {
      console.log(`✅ Found partial match for: "${teamName}" -> "${key}"`);
      return teamNameMapping[key as keyof typeof teamNameMapping];
    }
  }

  console.log(`❌ No image found for Bundesliga team: "${teamName}"`);
  console.log(`📋 Available teams:`, mappingKeys.slice(0, 18)); // Show first 18 main teams
  return null;
};

// Helper function to check if team has real image
export const hasRealBundesligaTeamImage = (teamName: string): boolean => {
  return getBundesligaTeamImage(teamName) !== null;
};

// Export all images and mappings for debugging
export { teamImages, teamNameMapping };

// Default export
export default getBundesligaTeamImage;
