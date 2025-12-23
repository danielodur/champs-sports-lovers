// Team Manager Images Index
// This file maps manager IDs to their corresponding image assets

export const getManagerImage = (managerId: string) => {
  const managerImages: { [key: string]: any } = {
    enrique: require("./luis_enrique.png"),
    guardiola: require("./pep_guardiola.png"),
    flick: require("./hansi_flick.png"),
    slot: require("./arne_slot.png"),
    arteta: require("./mikel_arteta.png"),
    alonso: require("./xabi_alonso.png"),
    conte: require("./antonio_conte.png"),
    inzaghi: require("./simone_inzaghi.png"),
    ancelotti: require("./carlo_ancelotti.png"),
    simeone: require("./diego_simeone.png"),
    scaloni: require("./lionel_scaloni.png"),
    deschamps: require("./didier_deschamps.png"),
    fuente: require("./luis_de_la_fuente.png"),
    tuchel: require("./thomas_tuchel.png"),
    maresca: require("./enzo_maresca.png"),
    emery: require("./unai_emery.png"),
    nagelsmann: require("./julian_nagelsmann.png"),
    amorim: require("./ruben_amorim.png"),
    howe: require("./edie_howe.png"), // Note: file is named edie_howe.png
    glasner: require("./oliver_glaner.png"), // Note: file is named oliver_glaner.png
    mourinho: require("./jose_mourinho.png"),
  };

  return managerImages[managerId] || null;
};

// Helper function to check if a manager has an image
export const hasManagerImage = (managerId: string): boolean => {
  return getManagerImage(managerId) !== null;
};

// Export all manager images for direct access if needed
export const managerImages = {
  luis_enrique: require("./luis_enrique.png"),
  pep_guardiola: require("./pep_guardiola.png"),
  hansi_flick: require("./hansi_flick.png"),
  arne_slot: require("./arne_slot.png"),
  mikel_arteta: require("./mikel_arteta.png"),
  xabi_alonso: require("./xabi_alonso.png"),
  antonio_conte: require("./antonio_conte.png"),
  simone_inzaghi: require("./simone_inzaghi.png"),
  carlo_ancelotti: require("./carlo_ancelotti.png"),
  diego_simeone: require("./diego_simeone.png"),
  lionel_scaloni: require("./lionel_scaloni.png"),
  didier_deschamps: require("./didier_deschamps.png"),
  luis_de_la_fuente: require("./luis_de_la_fuente.png"),
  thomas_tuchel: require("./thomas_tuchel.png"),
  enzo_maresca: require("./enzo_maresca.png"),
  unai_emery: require("./unai_emery.png"),
  julian_nagelsmann: require("./julian_nagelsmann.png"),
  ruben_amorim: require("./ruben_amorim.png"),
  edie_howe: require("./edie_howe.png"),
  oliver_glaner: require("./oliver_glaner.png"),
  jose_mourinho: require("./jose_mourinho.png"),
};

// Helper function to get manager ID from display name
export const getManagerIdFromName = (name: string): string | null => {
  const managerMap: { [key: string]: string } = {
    "Luis Enrique": "enrique",
    "Pep Guardiola": "guardiola",
    "Hansi Flick": "flick",
    "Arne Slot": "slot",
    "Mikel Arteta": "arteta",
    "Xabi Alonso": "alonso",
    "Antonio Conte": "conte",
    "Simone Inzaghi": "inzaghi",
    "Carlo Ancelotti": "ancelotti",
    "Diego Simeone": "simeone",
    "Lionel Scaloni": "scaloni",
    "Didier Deschamps": "deschamps",
    "Luis de la Fuente": "fuente",
    "Thomas Tuchel": "tuchel",
    "Enzo Maresca": "maresca",
    "Unai Emery": "emery",
    "Julian Nagelsmann": "nagelsmann",
    "Ruben Amorim": "amorim",
    "Eddie Howe": "howe",
    "Oliver Glasner": "glasner",
    "Jose Mourinho": "mourinho",
  };
  return managerMap[name] || null;
};

// Helper function to get manager image directly from name
export const getManagerImageFromName = (name: string) => {
  const managerId = getManagerIdFromName(name);
  return managerId ? getManagerImage(managerId) : null;
};

export default getManagerImage;
