export const formatPhoneNumber = (input: string): string => {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');
  
  // Limit to 10 digits for Ugandan numbers (starting with 0)
  const limitedDigits = digits.slice(0, 10);
  
  // Format as 0XXX XXX XXX
  if (limitedDigits.length <= 4) {
    return limitedDigits;
  } else if (limitedDigits.length <= 7) {
    return `${limitedDigits.slice(0, 4)} ${limitedDigits.slice(4)}`;
  } else {
    return `${limitedDigits.slice(0, 4)} ${limitedDigits.slice(4, 7)} ${limitedDigits.slice(7)}`;
  }
};

export const formatPhoneNumberWithoutCountryCode = (input: string): string => {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');
  
  // Remove leading 0 if present (for international format)
  const cleanDigits = digits.startsWith('0') ? digits.slice(1) : digits;
  
  // Limit to 9 digits for Ugandan numbers (without leading 0)
  const limitedDigits = cleanDigits.slice(0, 9);
  
  // Format as XXXX XXX XXX (4-3-3 format for Uganda)
  if (limitedDigits.length <= 4) {
    return limitedDigits;
  } else if (limitedDigits.length <= 7) {
    return `${limitedDigits.slice(0, 4)} ${limitedDigits.slice(4)}`;
  } else {
    return `${limitedDigits.slice(0, 4)} ${limitedDigits.slice(4, 7)} ${limitedDigits.slice(7)}`;
  }
};

// Format phone numbers based on country code
export const formatPhoneNumberByCountry = (input: string, countryCode: string): string => {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');
  
  if (countryCode === '+256') {
    // Uganda: 4-3-3 format (without leading 0)
    // Remove leading 0 if present
    const cleanDigits = digits.startsWith('0') ? digits.slice(1) : digits;
    const limitedDigits = cleanDigits.slice(0, 9);
    
    if (limitedDigits.length <= 4) {
      return limitedDigits;
    } else if (limitedDigits.length <= 7) {
      return `${limitedDigits.slice(0, 4)} ${limitedDigits.slice(4)}`;
    } else {
      return `${limitedDigits.slice(0, 4)} ${limitedDigits.slice(4, 7)} ${limitedDigits.slice(7)}`;
    }
  } else if (countryCode === '+1') {
    // US/Canada: 3-3-4 format
    const limitedDigits = digits.slice(0, 10);
    if (limitedDigits.length <= 3) {
      return limitedDigits;
    } else if (limitedDigits.length <= 6) {
      return `${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3)}`;
    } else {
      return `${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3, 6)} ${limitedDigits.slice(6)}`;
    }
  } else if (countryCode === '+44') {
    // UK: varies, but generally 4-3-4 or 3-4-4
    const limitedDigits = digits.slice(0, 10);
    if (limitedDigits.length <= 4) {
      return limitedDigits;
    } else if (limitedDigits.length <= 7) {
      return `${limitedDigits.slice(0, 4)} ${limitedDigits.slice(4)}`;
    } else {
      return `${limitedDigits.slice(0, 4)} ${limitedDigits.slice(4, 7)} ${limitedDigits.slice(7)}`;
    }
  } else {
    // Default formatting for other countries: 3-3-4 or similar
    const maxLength = getCountryMaxLength(countryCode);
    const limitedDigits = digits.slice(0, maxLength);
    
    if (limitedDigits.length <= 3) {
      return limitedDigits;
    } else if (limitedDigits.length <= 6) {
      return `${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3)}`;
    } else {
      return `${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3, 6)} ${limitedDigits.slice(6)}`;
    }
  }
};

// Helper function to get max length for a country
const getCountryMaxLength = (countryCode: string): number => {
  const lengths: Record<string, number> = {
    '+256': 9,  // Uganda (without leading 0)
    '+1': 10,   // US/Canada
    '+44': 10,  // UK
    '+91': 10,  // India
    '+86': 11,  // China
    '+49': 11,  // Germany
    '+33': 9,   // France
    '+39': 10,  // Italy
    '+34': 9,   // Spain
  };
  return lengths[countryCode] || 10; // Default to 10
};

export const validateUgandanPhoneNumber = (phone: string): boolean => {
  // Ugandan phone number formats:
  // +256XXXXXXXXX (international)
  // 0XXXXXXXXX (national)
  // 7XXXXXXXX or 3XXXXXXXX (without country code)
  
  const cleanPhone = phone.replace(/\s+/g, '');
  
  const patterns = [
    /^\+256[0-9]{9}$/, // +256XXXXXXXXX
    /^0[0-9]{9}$/, // 0XXXXXXXXX
    /^[73][0-9]{8}$/ // 7XXXXXXXX or 3XXXXXXXX
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone));
}; 