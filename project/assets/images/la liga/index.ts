// La Liga Team Images Index - Direct mappings for all team names
// This file maps team display names directly to their PNG files

// Import all team images from their respective folders
const teamImages = {
  // Row 1 teams
  real_madrid: require("./la liga row 1/real_madrid.png"),
  mallorca: require("./la liga row 1/mallorca.png"),
  real_sociedad: require("./la liga row 1/real_sociedad.png"),
  villareal: require("./la liga row 1/villareal.png"),
  girona: require("./la liga row 1/girona.png"),
  osasuna: require("./la liga row 1/osasuna.png"),
  oviedo: require("./la liga row 1/oviedo.png"),
  atletico: require("./la liga row 1/atletico.png"),
  celta_vigo: require("./la liga row 1/celta_vigo.png"),
  sevilla: require("./la liga row 1/sevilla.png"),

  // Row 2 teams
  barcelona: require("./la liga row 2/barcelona.png"),
  valencia: require("./la liga row 2/valencia.png"),
  elche: require("./la liga row 2/elche.png"),
  vallecano: require("./la liga row 2/vallecano.png"),
  athletic_bilbao: require("./la liga row 2/athletic_bilbao.png"),
  lavante: require("./la liga row 2/lavante.png"),
  alaves: require("./la liga row 2/alaves.png"),
  espanyol: require("./la liga row 2/espanyol.png"),
  real_betis: require("./la liga row 2/real_betis.png"),
  gatafe: require("./la liga row 2/gatafe.png"),
};

// Direct mapping from display names to image keys
const teamNameMapping = {
  "R Madrid": teamImages.real_madrid,
  Mallorca: teamImages.mallorca,
  "R Sociedad": teamImages.real_sociedad,
  Villarreal: teamImages.villareal,
  Girona: teamImages.girona,
  Osasuna: teamImages.osasuna,
  "R Oviedo": teamImages.oviedo,
  "Atlético M": teamImages.atletico,
  "RC Celta": teamImages.celta_vigo,
  Sevilla: teamImages.sevilla,

  Barcelona: teamImages.barcelona,
  Valencia: teamImages.valencia,
  "Elche C": teamImages.elche,
  Vallecano: teamImages.vallecano,
  "Athletic B": teamImages.athletic_bilbao,
  Levante: teamImages.lavante,
  Alavés: teamImages.alaves,
  Espanyol: teamImages.espanyol,
  "R Betis": teamImages.real_betis,
  Getafe: teamImages.gatafe,
};

// Main function to get team image
export const getLaLigaTeamImage = (teamName: string): any => {
  console.log(`🔍 Looking up La Liga team: "${teamName}"`);

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

  console.log(`❌ No image found for La Liga team: "${teamName}"`);
  console.log(`📋 Available teams:`, mappingKeys);
  return null;
};

// Helper function to check if team has real image
export const hasRealLaLigaTeamImage = (teamName: string): boolean => {
  return getLaLigaTeamImage(teamName) !== null;
};

// Export all images and mappings for debugging
export { teamImages, teamNameMapping };

// Default export
export default getLaLigaTeamImage;
