// Serie A Team Images Index - Updated for new team configuration
// Maps logoKey values from serie-a-config.ts to their PNG files

// Import all team images from their respective folders
const teamImages = {
  // Row 1 teams
  juventus: require("./serie-a row 1/juventus.png"),
  inter_milan: require("./serie-a row 1/inter-milan.png"),
  ac_milan: require("./serie-a row 1/ac_mila.png"),
  napoli: require("./serie-a row 1/napoli.png"),
  as_roma: require("./serie-a row 1/as_roma.png"),
  lazio: require("./serie-a row 1/lazio.png"),
  atalanta: require("./serie-a row 1/atalanta.png"),
  fiorentina: require("./serie-a row 1/fiorentina.png"),
  bologna: require("./serie-a row 1/bologna.png"),
  torino: require("./serie-a row 1/torino.png"),

  // Row 2 teams
  genoa: require("./serie-a row 2/genoa.png"),
  sassuolo: require("./serie-a row 2/sassuolo.png"),
  udinese: require("./serie-a row 2/udinese.png"),
  lecce: require("./serie-a row 2/lecce.png"),
  como: require("./serie-a row 2/como.png"),
  verona: require("./serie-a row 2/verona.png"),
  cagliari: require("./serie-a row 2/cagliari.png"),
  parma: require("./serie-a row 2/parma.png"),
  // Note: Using available images as placeholders for missing teams
  empoli: require("./serie-a row 2/pisa.png"), // Using pisa as placeholder for empoli
  monza: require("./serie-a row 2/cremonese.png"), // Using cremonese as placeholder for monza
};

// Direct mapping from logoKey values (from serie-a-config.ts) to image files
const teamNameMapping = {
  // Row 1 - logoKey mappings
  Juventus: teamImages.juventus,
  Inter: teamImages.inter_milan,
  "AC Milan": teamImages.ac_milan,
  Napoli: teamImages.napoli,
  Atalanta: teamImages.atalanta,
  Roma: teamImages.as_roma,
  Lazio: teamImages.lazio,
  Fiorentina: teamImages.fiorentina,
  Bologna: teamImages.bologna,
  Torino: teamImages.torino,

  // Row 2 - logoKey mappings
  Genoa: teamImages.genoa,
  Udinese: teamImages.udinese,
  Sassuolo: teamImages.sassuolo,
  Empoli: teamImages.empoli,
  "Hellas Verona": teamImages.verona,
  Lecce: teamImages.lecce,
  Cagliari: teamImages.cagliari,
  Monza: teamImages.monza,
  Parma: teamImages.parma,
  Como: teamImages.como,

  // Alternative name mappings for flexibility
  "Juventus FC": teamImages.juventus,
  "FC Internazionale Milano": teamImages.inter_milan,
  Internazionale: teamImages.inter_milan,
  Milan: teamImages.ac_milan,
  "SSC Napoli": teamImages.napoli,
  "Atalanta BC": teamImages.atalanta,
  "AS Roma": teamImages.as_roma,
  "SS Lazio": teamImages.lazio,
  "ACF Fiorentina": teamImages.fiorentina,
  "Bologna FC 1909": teamImages.bologna,
  "Torino FC": teamImages.torino,
  "Genoa CFC": teamImages.genoa,
  "Udinese Calcio": teamImages.udinese,
  "US Sassuolo Calcio": teamImages.sassuolo,
  "Empoli FC": teamImages.empoli,
  "Hellas Verona FC": teamImages.verona,
  "H. Verona": teamImages.verona,
  "US Lecce": teamImages.lecce,
  "Cagliari Calcio": teamImages.cagliari,
  "AC Monza": teamImages.monza,
  "Parma Calcio 1913": teamImages.parma,
  "Como 1907": teamImages.como,
};

// Main function to get team image
export const getSerieATeamImage = (teamName: string): any => {
  console.log(`🔍 Looking up Serie A team: "${teamName}"`);

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

  console.log(`❌ No image found for Serie A team: "${teamName}"`);
  console.log(`📋 Available teams:`, mappingKeys.slice(0, 20)); // Show first 20 main teams
  return null;
};

// Helper function to check if team has real image
export const hasRealSerieATeamImage = (teamName: string): boolean => {
  return getSerieATeamImage(teamName) !== null;
};

// Export all images and mappings for debugging
export { teamImages, teamNameMapping };

// Default export
export default getSerieATeamImage;
