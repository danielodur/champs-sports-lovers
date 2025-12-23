// English Premier League Team Images Index - Row-based organization
// Row 1: english-pl row 1 folder (10 teams)
// Row 2: english-pl row 2 folder (10 teams)

// ROW 1 TEAMS - All in "english-pl row 1" folder
const row1Images = {
  arsenal: require("./english-pl row 1/arsenal.png"),
  liverpool: require("./english-pl row 1/liverpool.png"),
  tottenham: require("./english-pl row 1/tottenham.png"),
  aston_villa: require("./english-pl row 1/aston_villa.png"),
  bournemouth: require("./english-pl row 1/bournemouth.png"),
  brentford: require("./english-pl row 1/brentford.png"),
  brighton: require("./english-pl row 1/brighton.png"),
  burnley: require("./english-pl row 1/burnley.png"),
  chelsea: require("./english-pl row 1/chelsea.png"),
  crystal_p: require("./english-pl row 1/crystal_p.png"),
};

// ROW 2 TEAMS - All in "english-pl row 2" folder
const row2Images = {
  man_utd: require("./english-pl row 2/man_utd.png"),
  fulham: require("./english-pl row 2/fulham.png"),
  leeds_utd: require("./english-pl row 2/leeds_utd.png"),
  man_city: require("./english-pl row 2/man_city.png"),
  everton: require("./english-pl row 2/everton.png"),
  newcastle: require("./english-pl row 2/newcastle.png"),
  nottm_fst: require("./english-pl row 2/nottm_fst.png"),
  sunderland: require("./english-pl row 2/sunderland.png"),
  west_ham: require("./english-pl row 2/west_ham.png"),
  wolves: require("./english-pl row 2/wolves.png"),
};

// Add aliases for name variations
const teamAliases = {
  // Handle different team name formats
  "aston villa": row1Images.aston_villa,
  "crystal palace": row1Images.crystal_p,
  "crystal p": row1Images.crystal_p,
  "man utd": row2Images.man_utd,
  "manchester united": row2Images.man_utd,
  "man city": row2Images.man_city,
  "manchester city": row2Images.man_city,
  "leeds utd": row2Images.leeds_utd,
  "leeds united": row2Images.leeds_utd,
  "west ham": row2Images.west_ham,
  "west ham united": row2Images.west_ham,
  "nottingham forest": row2Images.nottm_fst,
  "nottm fst": row2Images.nottm_fst,
  "nott'm fst": row2Images.nottm_fst,
  "bournem'th": row1Images.bournemouth,
  bournemouth: row1Images.bournemouth,
  bournem_th: row1Images.bournemouth, // Fix for Bournem'th normalization
  wolverhampton: row2Images.wolves,
  "wolverhampton wanderers": row2Images.wolves,
  "newcastle united": row2Images.newcastle,
  "everton fc": row2Images.everton,
  "fulham fc": row2Images.fulham,
  man: row2Images.man_city, // Fix for "Man City" normalization issue
  nott_m_fst: row2Images.nottm_fst, // Fix for "Nott'm Fst" normalization
};

// Combine all images
const allTeamImages = {
  ...row1Images,
  ...row2Images,
  ...teamAliases,
};

const normalizeTeamName = (teamName: string): string => {
  return teamName
    .toLowerCase()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[ñ]/g, "n")
    .replace(/[ç]/g, "c")
    .replace(/fc|united|city/g, "") // Remove common suffixes
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
};

export const getTeamImage = (teamName: string): any => {
  const normalizedName = normalizeTeamName(teamName);

  if (allTeamImages.hasOwnProperty(normalizedName)) {
    return allTeamImages[normalizedName as keyof typeof allTeamImages];
  }

  const variations = [
    normalizedName.replace("_", ""),
    normalizedName.replace(/^([a-z])_/, "$1_"),
    normalizedName.replace(/_([a-z])$/, "_$1"),
    normalizedName.split("_").join(""),
    normalizedName.split("_").reverse().join("_"),
    teamName.toLowerCase().replace(/\s+/g, "_"),
    teamName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_"),
  ];

  for (const variation of variations) {
    if (allTeamImages.hasOwnProperty(variation)) {
      return allTeamImages[variation as keyof typeof allTeamImages];
    }
  }

  return null;
};

export const hasRealTeamImage = (teamName: string): boolean => {
  return getTeamImage(teamName) !== null;
};

export { allTeamImages, row1Images, row2Images };

export default getTeamImage;
