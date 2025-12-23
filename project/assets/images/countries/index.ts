// Country Images Index - Row-based organization
// Row 1: countries row 1 folder (11 countries)
// Row 2: countries row 2 folder (11 countries)

// ROW 1 COUNTRIES - All in "counries row 1" folder (note: typo in folder name)
const row1Images = {
  uganda: require("./counries row 1/uganda.png"),
  argentina: require("./counries row 1/argentina.png"),
  france: require("./counries row 1/france.png"),
  portugal: require("./counries row 1/portugal.png"),
  spain: require("./counries row 1/spain.png"),
  england: require("./counries row 1/england.png"),
  brazil: require("./counries row 1/brazil.png"),
  germany: require("./counries row 1/germany.png"),
  italy: require("./counries row 1/italy.png"),
  netherlands: require("./counries row 1/netherlands.png"),
  saudi: require("./counries row 1/saudi.png"),
};

// ROW 2 COUNTRIES - All in "countries row 2" folder
const row2Images = {
  belgium: require("./countries row 2/belgium.png"),
  croatia: require("./countries row 2/croatia.png"),
  morocco: require("./countries row 2/morocco.png"),
  mexico: require("./countries row 2/mexico.png"),
  japan: require("./countries row 2/japan.png"),
  egypt: require("./countries row 2/egypt.png"),
  senegal: require("./countries row 2/senegal.png"),
  denmark: require("./countries row 2/denmark.png"),
  switzerland: require("./countries row 2/switzerland.png"),
  colombia: require("./countries row 2/colombia.png"),
  s_korea: require("./countries row 2/s_korea.png"),
};

// Add aliases for name variations
const countryAliases = {
  // Handle different name formats
  brasil: row1Images.brazil, // Portuguese name for Brazil
  holland: row1Images.netherlands, // Netherlands alternative name
  the_netherlands: row1Images.netherlands, // Full name
  "saudi arabia": row1Images.saudi, // Full name for Saudi
  "south korea": row2Images.s_korea, // Full name for S.Korea
  korea: row2Images.s_korea, // Alternative name for S.Korea
};

// Combine all images
const allCountryImages = {
  ...row1Images,
  ...row2Images,
  ...countryAliases,
};

const normalizeCountryName = (countryName: string): string => {
  return countryName
    .toLowerCase()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[ñ]/g, "n")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
};

export const getCountryImage = (countryName: string): any => {
  const normalizedName = normalizeCountryName(countryName);

  if (allCountryImages.hasOwnProperty(normalizedName)) {
    return allCountryImages[normalizedName as keyof typeof allCountryImages];
  }

  const variations = [
    normalizedName.replace("_", ""),
    normalizedName.replace(/^([a-z])_/, "$1_"),
    normalizedName.replace(/_([a-z])$/, "_$1"),
    normalizedName.split("_").join(""),
    normalizedName.split("_").reverse().join("_"),
  ];

  for (const variation of variations) {
    if (allCountryImages.hasOwnProperty(variation)) {
      return allCountryImages[variation as keyof typeof allCountryImages];
    }
  }

  return null;
};

export const hasRealCountryImage = (countryName: string): boolean => {
  return getCountryImage(countryName) !== null;
};

export { allCountryImages, row1Images, row2Images };

export default getCountryImage;
