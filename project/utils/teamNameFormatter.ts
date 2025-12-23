import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Utility functions for intelligent team name formatting and layout management
 * Handles text wrapping, truncation, and positioning to prevent UI overlaps
 */

export interface TeamNameConfig {
  maxWidth: number;
  fontSize: number;
  position: 'home' | 'away';
  hasRanking: boolean;
  containerWidth?: number;
}

export interface FormattedTeamName {
  displayName: string;
  isMultiLine: boolean;
  isTruncated: boolean;
  lines: string[];
  estimatedWidth: number;
}

/**
 * Estimates text width based on character count and font size
 * This is an approximation for layout calculations
 */
function estimateTextWidth(text: string, fontSize: number): number {
  // Average character width multiplier based on Inter font
  const avgCharWidth = fontSize * 0.6;
  return text.length * avgCharWidth;
}

/**
 * Finds intelligent break points in team names
 * Prioritizes breaking at natural word boundaries
 */
function findIntelligentBreakPoints(teamName: string): string[] {
  if (!teamName || teamName.length === 0) return [''];

  // Common separators in team names
  const separators = [' vs ', ' v ', ' - ', ' / ', ' & ', ' and '];
  const words = teamName.split(' ');

  // If it's a short name (1-2 words), don't break
  if (words.length <= 2) {
    return [teamName];
  }

  // For names with 3+ words, find intelligent breaking points
  const breakPoints: string[] = [];

  // Strategy 1: Break at common separators
  for (const separator of separators) {
    if (teamName.includes(separator)) {
      const parts = teamName.split(separator);
      if (parts.length === 2 && parts[0].length > 0 && parts[1].length > 0) {
        return parts;
      }
    }
  }

  // Strategy 2: Break at middle word for long names
  if (words.length >= 4) {
    const midPoint = Math.ceil(words.length / 2);
    const firstPart = words.slice(0, midPoint).join(' ');
    const secondPart = words.slice(midPoint).join(' ');

    // Only break if both parts have reasonable length
    if (firstPart.length >= 3 && secondPart.length >= 3) {
      return [firstPart, secondPart];
    }
  }

  // Strategy 3: Break after first 2-3 words
  if (words.length === 3) {
    return [words[0] + ' ' + words[1], words[2]];
  } else if (words.length >= 4) {
    return [words.slice(0, 2).join(' '), words.slice(2).join(' ')];
  }

  // Fallback: return as single line
  return [teamName];
}

/**
 * Formats team name with intelligent wrapping and truncation
 */
export function formatTeamName(
  teamName: string,
  config: TeamNameConfig
): FormattedTeamName {
  if (!teamName) {
    return {
      displayName: '',
      isMultiLine: false,
      isTruncated: false,
      lines: [''],
      estimatedWidth: 0,
    };
  }

  const { maxWidth, fontSize, position, hasRanking } = config;

  // Adjust available width if ranking is present
  const rankingWidth = hasRanking ? 25 : 0;
  const availableWidth = maxWidth - rankingWidth - 8; // 8px margin

  // Estimate if single line fits
  const singleLineWidth = estimateTextWidth(teamName, fontSize);

  if (singleLineWidth <= availableWidth) {
    return {
      displayName: teamName,
      isMultiLine: false,
      isTruncated: false,
      lines: [teamName],
      estimatedWidth: singleLineWidth,
    };
  }

  // Try intelligent line breaking
  const breakPoints = findIntelligentBreakPoints(teamName);

  if (breakPoints.length === 2) {
    const firstLineWidth = estimateTextWidth(breakPoints[0], fontSize);
    const secondLineWidth = estimateTextWidth(breakPoints[1], fontSize);

    // Check if both lines fit within available width
    if (firstLineWidth <= availableWidth && secondLineWidth <= availableWidth) {
      return {
        displayName: breakPoints.join('\n'),
        isMultiLine: true,
        isTruncated: false,
        lines: breakPoints,
        estimatedWidth: Math.max(firstLineWidth, secondLineWidth),
      };
    }
  }

  // If intelligent breaking doesn't work, try truncation (only for home team)
  if (position === 'home') {
    const truncatedName = truncateTeamName(teamName, availableWidth, fontSize);
    return {
      displayName: truncatedName,
      isMultiLine: false,
      isTruncated: truncatedName !== teamName,
      lines: [truncatedName],
      estimatedWidth: estimateTextWidth(truncatedName, fontSize),
    };
  }

  // For away team, try to force line break at word boundaries
  const words = teamName.split(' ');
  if (words.length >= 2) {
    // Try different breaking points
    for (let i = 1; i < words.length; i++) {
      const firstPart = words.slice(0, i).join(' ');
      const secondPart = words.slice(i).join(' ');

      const firstWidth = estimateTextWidth(firstPart, fontSize);
      const secondWidth = estimateTextWidth(secondPart, fontSize);

      if (firstWidth <= availableWidth && secondWidth <= availableWidth) {
        return {
          displayName: firstPart + '\n' + secondPart,
          isMultiLine: true,
          isTruncated: false,
          lines: [firstPart, secondPart],
          estimatedWidth: Math.max(firstWidth, secondWidth),
        };
      }
    }
  }

  // Last resort: return original name (let React Native handle overflow)
  return {
    displayName: teamName,
    isMultiLine: false,
    isTruncated: false,
    lines: [teamName],
    estimatedWidth: singleLineWidth,
  };
}

/**
 * Truncates team name with ellipsis while preserving word boundaries
 */
function truncateTeamName(teamName: string, maxWidth: number, fontSize: number): string {
  const ellipsisWidth = estimateTextWidth('...', fontSize);
  const availableWidth = maxWidth - ellipsisWidth;

  if (estimateTextWidth(teamName, fontSize) <= maxWidth) {
    return teamName;
  }

  const words = teamName.split(' ');
  let result = '';

  for (const word of words) {
    const testText = result ? result + ' ' + word : word;
    if (estimateTextWidth(testText, fontSize) <= availableWidth) {
      result = testText;
    } else {
      break;
    }
  }

  return result ? result + '...' : teamName.substring(0, Math.floor(availableWidth / (fontSize * 0.6))) + '...';
}

/**
 * Calculates optimal layout dimensions for match components
 */
export function calculateMatchLayoutDimensions(): {
  favoriteButtonWidth: number;
  broadcastIconsWidth: number;
  homeTeamMaxWidth: number;
  awayTeamMaxWidth: number;
  scoreWidth: number;
  margins: {
    horizontal: number;
    teamPadding: number;
  };
} {
  const totalPadding = 24; // Left and right padding
  const favoriteButtonWidth = 44; // Star button area
  const broadcastIconsWidth = 60; // Broadcast icons + nav button
  const scoreWidth = 80; // Score section
  const margins = {
    horizontal: 12,
    teamPadding: 16,
  };

  const availableWidth = screenWidth - totalPadding - favoriteButtonWidth - broadcastIconsWidth - scoreWidth - margins.teamPadding * 2;
  const teamSectionWidth = availableWidth / 2;

  return {
    favoriteButtonWidth,
    broadcastIconsWidth,
    homeTeamMaxWidth: Math.floor(teamSectionWidth - 16), // Extra margin for safety
    awayTeamMaxWidth: Math.floor(teamSectionWidth - 16),
    scoreWidth,
    margins,
  };
}

/**
 * Smart team name formatter for different screen contexts
 */
export class SmartTeamNameFormatter {
  private layoutDimensions: ReturnType<typeof calculateMatchLayoutDimensions>;

  constructor() {
    this.layoutDimensions = calculateMatchLayoutDimensions();
  }

  /**
   * Format home team name with proper constraints
   */
  formatHomeTeam(teamName: string, hasRanking: boolean = false): FormattedTeamName {
    return formatTeamName(teamName, {
      maxWidth: this.layoutDimensions.homeTeamMaxWidth,
      fontSize: 13,
      position: 'home',
      hasRanking,
    });
  }

  /**
   * Format away team name with proper constraints
   */
  formatAwayTeam(teamName: string, hasRanking: boolean = false): FormattedTeamName {
    return formatTeamName(teamName, {
      maxWidth: this.layoutDimensions.awayTeamMaxWidth,
      fontSize: 13,
      position: 'away',
      hasRanking,
    });
  }

  /**
   * Get layout dimensions
   */
  getLayoutDimensions() {
    return this.layoutDimensions;
  }

  /**
   * Update layout dimensions (useful for orientation changes)
   */
  updateLayoutDimensions() {
    this.layoutDimensions = calculateMatchLayoutDimensions();
  }
}

/**
 * Global instance for consistent formatting
 */
export const smartFormatter = new SmartTeamNameFormatter();

/**
 * Helper function for backwards compatibility
 */
export function formatTeamNameSmart(
  teamName: string,
  position: 'home' | 'away',
  hasRanking: boolean = false
): FormattedTeamName {
  if (position === 'home') {
    return smartFormatter.formatHomeTeam(teamName, hasRanking);
  } else {
    return smartFormatter.formatAwayTeam(teamName, hasRanking);
  }
}

/**
 * React Native style props for multi-line text
 */
export function getMultiLineTextStyle(formatted: FormattedTeamName, position: 'home' | 'away') {
  return {
    textAlign: position === 'home' ? 'right' as const : 'left' as const,
    lineHeight: formatted.isMultiLine ? 16 : undefined,
    numberOfLines: formatted.isMultiLine ? 2 : 1,
  };
}

export default {
  formatTeamName,
  formatTeamNameSmart,
  SmartTeamNameFormatter,
  smartFormatter,
  calculateMatchLayoutDimensions,
  getMultiLineTextStyle,
};
