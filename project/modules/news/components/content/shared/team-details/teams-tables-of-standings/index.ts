/**
 * Teams Tables of Standings - Main Index
 * 
 * This file exports all competition-specific table templates organized by region.
 * These templates are used by news-team-details-table.tsx to display
 * competition-specific standings based on the team's current competition.
 * 
 * Folder Structure:
 * - africa/   - African competitions (AFCON, FIFA qualifiers)
 * - asia/     - Asian competitions (AFC qualifiers, Gulf Cup)
 * - europe/   - European competitions (UEFA qualifiers, Nations League)
 */

// Universal League Table (for all club leagues via API-Football)
export { default as UniversalLeagueTable } from './UniversalLeagueTable';

// Reusable Table Components
export * from './components';

// African Competitions (National Teams)
export * from './africa';

// Asian Competitions (National Teams)
export * from './asia';

// European Competitions (National Teams)
export * from './europe';

// CONCACAF Competitions (National Teams - North, Central America & Caribbean)
export * from './concacaf';

// South American Competitions (National Teams - CONMEBOL)
export * from './south-america';

// Oceania Competitions (National Teams - OFC)
export * from './oceania';

// TODO: Add more regional folders as needed
// - club/           (Club competitions: Champions League, Europa League, etc.)
// - domestic/       (Domestic leagues: Premier League, La Liga, Serie A, etc.)
