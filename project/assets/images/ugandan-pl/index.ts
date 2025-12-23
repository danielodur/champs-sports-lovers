// Ugandan Premier League Team Images Index - Row-based organization
// Row 1: ugandan-pl row 1 folder (8 teams)
// Row 2: ugandan-pl row 2 folder (8 teams)

// ROW 1 TEAMS - All in "ugandan-pl row 1" folder
const row1Images = {
  bahimba_utd: require("./ugandan-pl row 1/bahimba_utd.png"),
  bul_fc: require("./ugandan-pl row 1/bul_fc.png"),
  kcca_fc: require("./ugandan-pl row 1/kcc_fc.png"),
  police_fc: require("./ugandan-pl row 1/police_fc.png"),
  lugazi_fc: require("./ugandan-pl row 1/lugazi_fc.png"),
  ent_uppc: require("./ugandan-pl row 1/ent_uppc.png"),
  express_fc: require("./ugandan-pl row 1/express.png"),
  maroons_fc: require("./ugandan-pl row 1/maroons.png"),
};

// ROW 2 TEAMS - All in "ugandan-pl row 2" folder
const row2Images = {
  ura_fc: require("./ugandan-pl row 2/ura_fc.png"),
  updf_fc: require("./ugandan-pl row 2/updf_fc.png"),
  nec_fc: require("./ugandan-pl row 2/nec.png"),
  mbarara: require("./ugandan-pl row 2/mbarara.png"),
  kitara_fc: require("./ugandan-pl row 2/kitara_fc.png"),
  sc_villa: require("./ugandan-pl row 2/sc-villa.png"),
  vipers_sc: require("./ugandan-pl row 2/vipers_sc.png"),
  calvary_fc: require("./ugandan-pl row 2/calvary_fc.png"),
};

// Add aliases for name variations
const teamAliases = {
  // Handle different team name formats
  "bahimba utd": row1Images.bahimba_utd,
  "bul fc": row1Images.bul_fc,
  "kcca fc": row1Images.kcca_fc,
  "kcc fc": row1Images.kcca_fc,
  "police fc": row1Images.police_fc,
  "lugazi fc": row1Images.lugazi_fc,
  "ent uppc": row1Images.ent_uppc,
  "express fc": row1Images.express_fc,
  express: row1Images.express_fc,
  "maroons fc": row1Images.maroons_fc,
  maroons: row1Images.maroons_fc,
  "ura fc": row2Images.ura_fc,
  "updf fc": row2Images.updf_fc,
  "nec fc": row2Images.nec_fc,
  nec: row2Images.nec_fc,
  "mbarara city": row2Images.mbarara,
  mbarara: row2Images.mbarara,
  "kitara fc": row2Images.kitara_fc,
  "sc villa": row2Images.sc_villa,
  "vipers sc": row2Images.vipers_sc,
  vipers: row2Images.vipers_sc,
  "calvary fc": row2Images.calvary_fc,
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
