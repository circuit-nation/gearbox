/** Rider tag (tags[0] / visualizer team field) → MongoDB team document name */
export const MOTOGP_TEAM_TAG_TO_NAME: Record<string, string> = {
  "Ducati Lenovo": "Ducati Lenovo Team",
  "Gresini Ducati": "Gresini Racing MotoGP",
  "VR46 Ducati": "Pertamina Enduro VR46 Racing Team",
  "Yamaha Factory": "Monster Energy Yamaha MotoGP Team",
  "Pramac Yamaha": "Prima Pramac Yamaha",
  "KTM Factory": "Red Bull KTM Factory Racing",
  "Tech3 KTM": "Red Bull GASGAS Tech3",
  "Aprilia Factory": "Aprilia Racing",
  "Trackhouse Aprilia": "Trackhouse Racing",
  "Repsol Honda": "Repsol Honda Team",
  "LCR Honda": "IDEMITSU Honda LCR",
};

/** Rider tag → legacy team id from motogp_teams.json seed data */
export const MOTOGP_TEAM_TAG_TO_LEGACY_ID: Record<string, string> = {
  "Ducati Lenovo": "motogp-team-ducati-lenovo",
  "Gresini Ducati": "motogp-team-gresini-ducati",
  "VR46 Ducati": "motogp-team-vr46-ducati",
  "Yamaha Factory": "motogp-team-yamaha-monster",
  "Pramac Yamaha": "motogp-team-pramac-yamaha",
  "KTM Factory": "motogp-team-ktm-factory",
  "Tech3 KTM": "motogp-team-tech3-ktm",
  "Aprilia Factory": "motogp-team-aprilia-factory",
  "Trackhouse Aprilia": "motogp-team-trackhouse-aprilia",
  "Repsol Honda": "motogp-team-honda-factory",
  "LCR Honda": "motogp-team-lcr-honda",
};
