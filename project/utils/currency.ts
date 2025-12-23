/**
 * Currency formatting utilities for consistent display across the application
 * All monetary values in news-related screens should use Euro (€) formatting
 */

export interface CurrencyConfig {
  symbol: string;
  code: string;
  position: 'before' | 'after';
}

export const EURO_CONFIG: CurrencyConfig = {
  symbol: '€',
  code: 'EUR',
  position: 'before',
};

/**
 * Converts any currency value to Euro format
 * Handles various input formats: $25M, £30K, USD 100, etc.
 * @param value - The monetary value as string or number
 * @param config - Currency configuration (defaults to Euro)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: string | number,
  config: CurrencyConfig = EURO_CONFIG
): string => {
  let cleanValue: string;

  if (typeof value === 'number') {
    cleanValue = value.toString();
  } else {
    // Remove any existing currency symbols and codes
    cleanValue = value.replace(/[€$£¥₹]|EUR|USD|GBP|JPY|INR/gi, '').trim();
  }

  // Handle shorthand notation (M for millions, K for thousands)
  if (cleanValue.includes('M') || cleanValue.includes('K')) {
    const numericPart = cleanValue.replace(/[MK]/gi, '');
    const suffix = cleanValue.toUpperCase().includes('M') ? 'M' : 'K';

    const parsedValue = parseFloat(numericPart);
    if (!isNaN(parsedValue)) {
      return config.position === 'before'
        ? `${config.symbol}${parsedValue}${suffix}`
        : `${parsedValue}${suffix}${config.symbol}`;
    }
    return config.position === 'before'
      ? `${config.symbol}${cleanValue}`
      : `${cleanValue}${config.symbol}`;
  }

  // Handle pure numeric values
  const numericValue = parseFloat(cleanValue);
  if (!isNaN(numericValue)) {
    if (numericValue >= 1000000) {
      const millions = (numericValue / 1000000).toFixed(1);
      return config.position === 'before'
        ? `${config.symbol}${millions}M`
        : `${millions}M${config.symbol}`;
    } else if (numericValue >= 1000) {
      const thousands = (numericValue / 1000).toFixed(1);
      return config.position === 'before'
        ? `${config.symbol}${thousands}K`
        : `${thousands}K${config.symbol}`;
    } else {
      const formatted = numericValue.toLocaleString();
      return config.position === 'before'
        ? `${config.symbol}${formatted}`
        : `${formatted}${config.symbol}`;
    }
  }

  // Fallback: just add currency symbol
  return config.position === 'before'
    ? `${config.symbol}${cleanValue}`
    : `${cleanValue}${config.symbol}`;
};

/**
 * Formats a value specifically in Euros (convenience function)
 * @param value - The monetary value as string or number
 * @returns Euro-formatted string
 */
export const formatEuro = (value: string | number): string => {
  return formatCurrency(value, EURO_CONFIG);
};

/**
 * Converts common currency values to Euro equivalents
 * Note: These are approximate conversion rates for display purposes only
 * In a real application, you would use live exchange rates
 */
export const convertToEuro = (value: string, fromCurrency?: string): string => {
  const approximateRates: Record<string, number> = {
    USD: 0.85, // 1 USD ≈ 0.85 EUR
    GBP: 1.15, // 1 GBP ≈ 1.15 EUR
    JPY: 0.0065, // 1 JPY ≈ 0.0065 EUR
    INR: 0.011, // 1 INR ≈ 0.011 EUR
  };

  if (!fromCurrency) {
    // Try to detect currency from the value string
    if (value.includes('$') || value.toUpperCase().includes('USD')) {
      fromCurrency = 'USD';
    } else if (value.includes('£') || value.toUpperCase().includes('GBP')) {
      fromCurrency = 'GBP';
    } else if (value.includes('¥') || value.toUpperCase().includes('JPY')) {
      fromCurrency = 'JPY';
    } else if (value.includes('₹') || value.toUpperCase().includes('INR')) {
      fromCurrency = 'INR';
    }
  }

  if (fromCurrency && approximateRates[fromCurrency]) {
    // Extract numeric value
    const numericMatch = value.match(/[\d,.]+/);
    if (numericMatch) {
      const numericValue = parseFloat(numericMatch[0].replace(/,/g, ''));
      const euroValue = numericValue * approximateRates[fromCurrency];

      // Preserve the format (M, K, etc.)
      if (value.toUpperCase().includes('M')) {
        return formatEuro(`${euroValue}M`);
      } else if (value.toUpperCase().includes('K')) {
        return formatEuro(`${euroValue}K`);
      } else {
        return formatEuro(euroValue);
      }
    }
  }

  // If no conversion needed or possible, just format as Euro
  return formatEuro(value);
};

/**
 * Removes currency symbol from a formatted currency string
 * Useful for display where you want to show the symbol separately
 * @param formattedValue - Currency string with symbol
 * @returns Clean numeric value with suffix (M, K, etc.)
 */
export const removeCurrencySymbol = (formattedValue: string): string => {
  return formattedValue.replace(/[€$£¥₹]/g, '').trim();
};

/**
 * Validates if a string contains a valid currency value
 * @param value - String to validate
 * @returns boolean indicating if it's a valid currency format
 */
export const isValidCurrency = (value: string): boolean => {
  const currencyPattern = /^[€$£¥₹]?\s*[\d,.]+[MK]?\s*[€$£¥₹]?$/i;
  return currencyPattern.test(value.trim());
};

/**
 * Gets the appropriate currency symbol for React Native icons
 * @param config - Currency configuration
 * @returns Object with icon name for lucide-react-native
 */
export const getCurrencyIcon = (config: CurrencyConfig = EURO_CONFIG) => {
  switch (config.code) {
    case 'EUR':
      return 'Euro';
    case 'USD':
      return 'DollarSign';
    case 'GBP':
      return 'PoundSterling';
    default:
      return 'Euro';
  }
};
