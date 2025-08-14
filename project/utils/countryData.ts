// Comprehensive country data for phone number input
export interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

export interface PhoneNumberLengths {
  [key: string]: number;
}

// Phone number lengths by country code
export const phoneNumberLengths: PhoneNumberLengths = {
  "+93": 9, // Afghanistan
  "+355": 9, // Albania
  "+213": 9, // Algeria
  "+1684": 7, // American Samoa
  "+376": 6, // Andorra
  "+244": 9, // Angola
  "+1264": 7, // Anguilla
  "+672": 6, // Antarctica/Norfolk Island (taking Norfolk Island length)
  "+1268": 7, // Antigua and Barbuda
  "+54": 10, // Argentina
  "+374": 8, // Armenia
  "+297": 7, // Aruba
  "+61": 9, // Australia/Christmas Island/Cocos Islands
  "+43": 10, // Austria
  "+994": 9, // Azerbaijan
  "+1242": 7, // Bahamas
  "+973": 8, // Bahrain
  "+880": 10, // Bangladesh
  "+1246": 7, // Barbados
  "+375": 9, // Belarus
  "+32": 9, // Belgium
  "+501": 7, // Belize
  "+229": 8, // Benin
  "+1441": 7, // Bermuda
  "+975": 8, // Bhutan
  "+591": 8, // Bolivia
  "+387": 8, // Bosnia and Herzegovina
  "+267": 8, // Botswana
  "+55": 11, // Brazil
  "+246": 7, // British Indian Ocean Territory
  "+673": 7, // Brunei
  "+359": 9, // Bulgaria
  "+226": 8, // Burkina Faso
  "+257": 8, // Burundi
  "+855": 9, // Cambodia
  "+237": 9, // Cameroon
  "+1": 10, // Canada/United States
  "+238": 7, // Cape Verde
  "+1345": 7, // Cayman Islands
  "+236": 8, // Central African Republic
  "+235": 8, // Chad
  "+56": 9, // Chile
  "+86": 11, // China
  "+57": 10, // Colombia
  "+269": 7, // Comoros
  "+242": 9, // Congo
  "+243": 9, // Congo (DRC)
  "+682": 5, // Cook Islands
  "+506": 8, // Costa Rica
  "+225": 10, // Côte d'Ivoire
  "+385": 9, // Croatia
  "+53": 8, // Cuba
  "+599": 7, // Curaçao
  "+357": 8, // Cyprus
  "+420": 9, // Czech Republic
  "+45": 8, // Denmark
  "+253": 8, // Djibouti
  "+1767": 7, // Dominica
  "+1809": 7, // Dominican Republic
  "+593": 9, // Ecuador
  "+20": 10, // Egypt
  "+503": 8, // El Salvador
  "+240": 9, // Equatorial Guinea
  "+291": 7, // Eritrea
  "+372": 7, // Estonia
  "+251": 9, // Ethiopia
  "+500": 5, // Falkland Islands
  "+298": 6, // Faroe Islands
  "+679": 7, // Fiji
  "+358": 9, // Finland
  "+33": 9, // France
  "+594": 9, // French Guiana
  "+689": 8, // French Polynesia
  "+241": 7, // Gabon
  "+220": 7, // Gambia
  "+995": 9, // Georgia
  "+49": 11, // Germany
  "+233": 9, // Ghana
  "+350": 8, // Gibraltar
  "+30": 10, // Greece
  "+299": 6, // Greenland
  "+1473": 7, // Grenada
  "+590": 9, // Guadeloupe/Saint Barthélemy/Saint Martin
  "+1671": 7, // Guam
  "+502": 8, // Guatemala
  "+44": 10, // United Kingdom/Guernsey/Isle of Man/Jersey
  "+224": 9, // Guinea
  "+245": 7, // Guinea-Bissau
  "+592": 7, // Guyana
  "+509": 8, // Haiti
  "+504": 8, // Honduras
  "+852": 8, // Hong Kong
  "+36": 9, // Hungary
  "+354": 7, // Iceland
  "+91": 10, // India
  "+62": 10, // Indonesia
  "+98": 10, // Iran
  "+964": 10, // Iraq
  "+353": 9, // Ireland
  "+972": 9, // Israel
  "+39": 10, // Italy
  "+1876": 7, // Jamaica
  "+81": 10, // Japan
  "+962": 9, // Jordan
  "+7": 10, // Kazakhstan/Russia
  "+254": 9, // Kenya
  "+686": 5, // Kiribati
  "+850": 10, // Korea (North)
  "+82": 10, // Korea (South)
  "+965": 8, // Kuwait
  "+996": 9, // Kyrgyzstan
  "+856": 10, // Laos
  "+371": 8, // Latvia
  "+961": 8, // Lebanon
  "+266": 8, // Lesotho
  "+231": 7, // Liberia
  "+218": 9, // Libya
  "+423": 7, // Liechtenstein
  "+370": 8, // Lithuania
  "+352": 9, // Luxembourg
  "+853": 8, // Macao
  "+389": 8, // Macedonia
  "+261": 9, // Madagascar
  "+265": 9, // Malawi
  "+60": 10, // Malaysia
  "+960": 7, // Maldives
  "+223": 8, // Mali
  "+356": 8, // Malta
  "+692": 7, // Marshall Islands
  "+596": 9, // Martinique
  "+222": 8, // Mauritania
  "+230": 8, // Mauritius
  "+262": 9, // Mayotte/Réunion
  "+52": 10, // Mexico
  "+691": 7, // Micronesia
  "+373": 8, // Moldova
  "+377": 8, // Monaco
  "+976": 8, // Mongolia
  "+382": 8, // Montenegro
  "+1664": 7, // Montserrat
  "+212": 9, // Morocco/Western Sahara
  "+258": 9, // Mozambique
  "+95": 9, // Myanmar
  "+264": 9, // Namibia
  "+674": 7, // Nauru
  "+977": 10, // Nepal
  "+31": 9, // Netherlands
  "+687": 6, // New Caledonia
  "+64": 9, // New Zealand
  "+505": 8, // Nicaragua
  "+227": 8, // Niger
  "+234": 10, // Nigeria
  "+683": 4, // Niue
  "+1670": 7, // Northern Mariana Islands
  "+47": 8, // Norway/Svalbard and Jan Mayen
  "+968": 8, // Oman
  "+92": 10, // Pakistan
  "+680": 7, // Palau
  "+970": 9, // Palestine
  "+507": 8, // Panama
  "+675": 8, // Papua New Guinea
  "+595": 9, // Paraguay
  "+51": 9, // Peru
  "+63": 10, // Philippines
  "+48": 9, // Poland
  "+351": 9, // Portugal
  "+1787": 7, // Puerto Rico
  "+974": 8, // Qatar
  "+40": 9, // Romania
  "+250": 9, // Rwanda
  "+290": 4, // Saint Helena
  "+1869": 7, // Saint Kitts and Nevis
  "+1758": 7, // Saint Lucia
  "+508": 6, // Saint Pierre and Miquelon
  "+1784": 7, // Saint Vincent and the Grenadines
  "+685": 7, // Samoa
  "+378": 8, // San Marino
  "+239": 7, // São Tomé and Príncipe
  "+966": 9, // Saudi Arabia
  "+221": 9, // Senegal
  "+381": 9, // Serbia
  "+248": 7, // Seychelles
  "+232": 8, // Sierra Leone
  "+65": 8, // Singapore
  "+1721": 7, // Sint Maarten
  "+421": 9, // Slovakia
  "+386": 8, // Slovenia
  "+677": 7, // Solomon Islands
  "+252": 8, // Somalia
  "+27": 9, // South Africa
  "+211": 9, // South Sudan
  "+34": 9, // Spain
  "+94": 9, // Sri Lanka
  "+249": 9, // Sudan
  "+597": 7, // Suriname
  "+268": 8, // Swaziland
  "+46": 9, // Sweden
  "+41": 9, // Switzerland
  "+963": 9, // Syria
  "+886": 9, // Taiwan
  "+992": 9, // Tajikistan
  "+255": 9, // Tanzania
  "+66": 9, // Thailand
  "+670": 8, // Timor-Leste
  "+228": 8, // Togo
  "+690": 4, // Tokelau
  "+676": 7, // Tonga
  "+1868": 7, // Trinidad and Tobago
  "+216": 8, // Tunisia
  "+90": 10, // Turkey
  "+993": 8, // Turkmenistan
  "+1649": 7, // Turks and Caicos Islands
  "+688": 6, // Tuvalu
  "+256": 9, // Uganda
  "+380": 9, // Ukraine
  "+971": 9, // United Arab Emirates
  "+598": 8, // Uruguay
  "+998": 9, // Uzbekistan
  "+678": 7, // Vanuatu
  "+379": 8, // Vatican City
  "+58": 10, // Venezuela
  "+84": 9, // Vietnam
  "+1284": 7, // Virgin Islands (British)
  "+1340": 7, // Virgin Islands (US)
  "+681": 6, // Wallis and Futuna
  "+967": 9, // Yemen
  "+260": 9, // Zambia
  "+263": 9, // Zimbabwe
};

// Country codes with flags
export const countryCodes: CountryCode[] = [
  { code: "+93", country: "Afghanistan", flag: "🇦🇫" },
  { code: "+355", country: "Albania", flag: "🇦🇱" },
  { code: "+213", country: "Algeria", flag: "🇩🇿" },
  { code: "+1684", country: "American Samoa", flag: "🇦🇸" },
  { code: "+376", country: "Andorra", flag: "🇦🇩" },
  { code: "+244", country: "Angola", flag: "🇦🇴" },
  { code: "+1264", country: "Anguilla", flag: "🇦🇮" },
  { code: "+672", country: "Antarctica", flag: "🇦🇶" },
  { code: "+1268", country: "Antigua and Barbuda", flag: "🇦🇬" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+374", country: "Armenia", flag: "🇦🇲" },
  { code: "+297", country: "Aruba", flag: "🇦🇼" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+994", country: "Azerbaijan", flag: "🇦🇿" },
  { code: "+1242", country: "Bahamas", flag: "🇧🇸" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
  { code: "+1246", country: "Barbados", flag: "🇧🇧" },
  { code: "+375", country: "Belarus", flag: "🇧🇾" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+501", country: "Belize", flag: "🇧🇿" },
  { code: "+229", country: "Benin", flag: "🇧🇯" },
  { code: "+1441", country: "Bermuda", flag: "🇧🇲" },
  { code: "+975", country: "Bhutan", flag: "🇧🇹" },
  { code: "+591", country: "Bolivia", flag: "🇧🇴" },
  { code: "+387", country: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "+267", country: "Botswana", flag: "🇧🇼" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+246", country: "British Indian Ocean Territory", flag: "🇮🇴" },
  { code: "+673", country: "Brunei", flag: "🇧🇳" },
  { code: "+359", country: "Bulgaria", flag: "🇧🇬" },
  { code: "+226", country: "Burkina Faso", flag: "🇧🇫" },
  { code: "+257", country: "Burundi", flag: "🇧🇮" },
  { code: "+855", country: "Cambodia", flag: "🇰🇭" },
  { code: "+237", country: "Cameroon", flag: "🇨🇲" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+238", country: "Cape Verde", flag: "🇨🇻" },
  { code: "+1345", country: "Cayman Islands", flag: "🇰🇾" },
  { code: "+236", country: "Central African Republic", flag: "🇨🇫" },
  { code: "+235", country: "Chad", flag: "🇹🇩" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+61", country: "Christmas Island", flag: "🇨🇽" },
  { code: "+61", country: "Cocos Islands", flag: "🇨🇨" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+269", country: "Comoros", flag: "🇰🇲" },
  { code: "+242", country: "Congo", flag: "🇨🇬" },
  { code: "+243", country: "Congo (DRC)", flag: "🇨🇩" },
  { code: "+682", country: "Cook Islands", flag: "🇨🇰" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
  { code: "+225", country: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "+385", country: "Croatia", flag: "🇭🇷" },
  { code: "+53", country: "Cuba", flag: "🇨🇺" },
  { code: "+599", country: "Curaçao", flag: "🇨🇼" },
  { code: "+357", country: "Cyprus", flag: "🇨🇾" },
  { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+253", country: "Djibouti", flag: "🇩🇯" },
  { code: "+1767", country: "Dominica", flag: "🇩🇲" },
  { code: "+1809", country: "Dominican Republic", flag: "🇩🇴" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+503", country: "El Salvador", flag: "🇸🇻" },
  { code: "+240", country: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "+291", country: "Eritrea", flag: "🇪🇷" },
  { code: "+372", country: "Estonia", flag: "🇪🇪" },
  { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
  { code: "+500", country: "Falkland Islands", flag: "🇫🇰" },
  { code: "+298", country: "Faroe Islands", flag: "🇫🇴" },
  { code: "+679", country: "Fiji", flag: "🇫🇯" },
  { code: "+358", country: "Finland", flag: "🇫🇮" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+594", country: "French Guiana", flag: "🇬🇫" },
  { code: "+689", country: "French Polynesia", flag: "🇵🇫" },
  { code: "+241", country: "Gabon", flag: "🇬🇦" },
  { code: "+220", country: "Gambia", flag: "🇬🇲" },
  { code: "+995", country: "Georgia", flag: "🇬🇪" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+350", country: "Gibraltar", flag: "🇬🇮" },
  { code: "+30", country: "Greece", flag: "🇬🇷" },
  { code: "+299", country: "Greenland", flag: "🇬🇱" },
  { code: "+1473", country: "Grenada", flag: "🇬🇩" },
  { code: "+590", country: "Guadeloupe", flag: "🇬🇵" },
  { code: "+1671", country: "Guam", flag: "🇬🇺" },
  { code: "+502", country: "Guatemala", flag: "🇬🇹" },
  { code: "+44", country: "Guernsey", flag: "🇬🇬" },
  { code: "+224", country: "Guinea", flag: "🇬🇳" },
  { code: "+245", country: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "+592", country: "Guyana", flag: "🇬🇾" },
  { code: "+509", country: "Haiti", flag: "🇭🇹" },
  { code: "+504", country: "Honduras", flag: "🇭🇳" },
  { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
  { code: "+36", country: "Hungary", flag: "🇭🇺" },
  { code: "+354", country: "Iceland", flag: "🇮🇸" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+98", country: "Iran", flag: "🇮🇷" },
  { code: "+964", country: "Iraq", flag: "🇮🇶" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
  { code: "+44", country: "Isle of Man", flag: "🇮🇲" },
  { code: "+972", country: "Israel", flag: "🇮🇱" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+1876", country: "Jamaica", flag: "🇯🇲" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+44", country: "Jersey", flag: "🇯🇪" },
  { code: "+962", country: "Jordan", flag: "🇯🇴" },
  { code: "+7", country: "Kazakhstan", flag: "🇰🇿" },
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+686", country: "Kiribati", flag: "🇰🇮" },
  { code: "+850", country: "Korea (North)", flag: "🇰🇵" },
  { code: "+82", country: "Korea (South)", flag: "🇰🇷" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼" },
  { code: "+996", country: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "+856", country: "Laos", flag: "🇱🇦" },
  { code: "+371", country: "Latvia", flag: "🇱🇻" },
  { code: "+961", country: "Lebanon", flag: "🇱🇧" },
  { code: "+266", country: "Lesotho", flag: "🇱🇸" },
  { code: "+231", country: "Liberia", flag: "🇱🇷" },
  { code: "+218", country: "Libya", flag: "🇱🇾" },
  { code: "+423", country: "Liechtenstein", flag: "🇱🇮" },
  { code: "+370", country: "Lithuania", flag: "🇱🇹" },
  { code: "+352", country: "Luxembourg", flag: "🇱🇺" },
  { code: "+853", country: "Macao", flag: "🇲🇴" },
  { code: "+389", country: "Macedonia", flag: "🇲🇰" },
  { code: "+261", country: "Madagascar", flag: "🇲🇬" },
  { code: "+265", country: "Malawi", flag: "🇲🇼" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+960", country: "Maldives", flag: "🇲🇻" },
  { code: "+223", country: "Mali", flag: "🇲🇱" },
  { code: "+356", country: "Malta", flag: "🇲🇹" },
  { code: "+692", country: "Marshall Islands", flag: "🇲🇭" },
  { code: "+596", country: "Martinique", flag: "🇲🇶" },
  { code: "+222", country: "Mauritania", flag: "🇲🇷" },
  { code: "+230", country: "Mauritius", flag: "🇲🇺" },
  { code: "+262", country: "Mayotte", flag: "🇾🇹" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+691", country: "Micronesia", flag: "🇫🇲" },
  { code: "+373", country: "Moldova", flag: "🇲🇩" },
  { code: "+377", country: "Monaco", flag: "🇲🇨" },
  { code: "+976", country: "Mongolia", flag: "🇲🇳" },
  { code: "+382", country: "Montenegro", flag: "🇲🇪" },
  { code: "+1664", country: "Montserrat", flag: "🇲🇸" },
  { code: "+212", country: "Morocco", flag: "🇲🇦" },
  { code: "+258", country: "Mozambique", flag: "🇲🇿" },
  { code: "+95", country: "Myanmar", flag: "🇲🇲" },
  { code: "+264", country: "Namibia", flag: "🇳🇦" },
  { code: "+674", country: "Nauru", flag: "🇳🇷" },
  { code: "+977", country: "Nepal", flag: "🇳🇵" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+687", country: "New Caledonia", flag: "🇳🇨" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+505", country: "Nicaragua", flag: "🇳🇮" },
  { code: "+227", country: "Niger", flag: "🇳🇪" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+683", country: "Niue", flag: "🇳🇺" },
  { code: "+1670", country: "Northern Mariana Islands", flag: "🇲🇵" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+968", country: "Oman", flag: "🇴🇲" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
  { code: "+680", country: "Palau", flag: "🇵🇼" },
  { code: "+970", country: "Palestine", flag: "🇵🇸" },
  { code: "+507", country: "Panama", flag: "🇵🇦" },
  { code: "+675", country: "Papua New Guinea", flag: "🇵🇬" },
  { code: "+595", country: "Paraguay", flag: "🇵🇾" },
  { code: "+51", country: "Peru", flag: "🇵🇪" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+1787", country: "Puerto Rico", flag: "🇵🇷" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+262", country: "Réunion", flag: "🇷🇪" },
  { code: "+40", country: "Romania", flag: "🇷🇴" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+250", country: "Rwanda", flag: "🇷🇼" },
  { code: "+590", country: "Saint Barthélemy", flag: "🇧🇱" },
  { code: "+290", country: "Saint Helena", flag: "🇸🇭" },
  { code: "+1869", country: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { code: "+1758", country: "Saint Lucia", flag: "🇱🇨" },
  { code: "+590", country: "Saint Martin", flag: "🇲🇫" },
  { code: "+508", country: "Saint Pierre and Miquelon", flag: "🇵🇲" },
  { code: "+1784", country: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
  { code: "+685", country: "Samoa", flag: "🇼🇸" },
  { code: "+378", country: "San Marino", flag: "🇸🇲" },
  { code: "+239", country: "São Tomé and Príncipe", flag: "🇸🇹" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+221", country: "Senegal", flag: "🇸🇳" },
  { code: "+381", country: "Serbia", flag: "🇷🇸" },
  { code: "+248", country: "Seychelles", flag: "🇸🇨" },
  { code: "+232", country: "Sierra Leone", flag: "🇸🇱" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+1721", country: "Sint Maarten", flag: "🇸🇽" },
  { code: "+421", country: "Slovakia", flag: "🇸🇰" },
  { code: "+386", country: "Slovenia", flag: "🇸🇮" },
  { code: "+677", country: "Solomon Islands", flag: "🇸🇧" },
  { code: "+252", country: "Somalia", flag: "🇸🇴" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+211", country: "South Sudan", flag: "🇸🇸" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
  { code: "+249", country: "Sudan", flag: "🇸🇩" },
  { code: "+597", country: "Suriname", flag: "🇸🇷" },
  { code: "+47", country: "Svalbard and Jan Mayen", flag: "🇸🇯" },
  { code: "+268", country: "Swaziland", flag: "🇸🇿" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+963", country: "Syria", flag: "🇸🇾" },
  { code: "+886", country: "Taiwan", flag: "🇹🇼" },
  { code: "+992", country: "Tajikistan", flag: "🇹🇯" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+670", country: "Timor-Leste", flag: "🇹🇱" },
  { code: "+228", country: "Togo", flag: "🇹🇬" },
  { code: "+690", country: "Tokelau", flag: "🇹🇰" },
  { code: "+676", country: "Tonga", flag: "🇹🇴" },
  { code: "+1868", country: "Trinidad and Tobago", flag: "🇹🇹" },
  { code: "+216", country: "Tunisia", flag: "🇹🇳" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+993", country: "Turkmenistan", flag: "🇹🇲" },
  { code: "+1649", country: "Turks and Caicos Islands", flag: "🇹🇨" },
  { code: "+688", country: "Tuvalu", flag: "🇹🇻" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+380", country: "Ukraine", flag: "🇺🇦" },
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  { code: "+998", country: "Uzbekistan", flag: "🇺🇿" },
  { code: "+678", country: "Vanuatu", flag: "🇻🇺" },
  { code: "+379", country: "Vatican City", flag: "🇻🇦" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+1284", country: "Virgin Islands (British)", flag: "🇻🇬" },
  { code: "+1340", country: "Virgin Islands (US)", flag: "🇻🇮" },
  { code: "+681", country: "Wallis and Futuna", flag: "🇼🇫" },
  { code: "+212", country: "Western Sahara", flag: "🇪🇭" },
  { code: "+967", country: "Yemen", flag: "🇾🇪" },
  { code: "+260", country: "Zambia", flag: "🇿🇲" },
  { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },
];

// Helper functions
export const getMaxPhoneLength = (countryCode: string): number => {
  return phoneNumberLengths[countryCode] || 10; // Default to 10 if not found
};

export const groupCountriesByFirstLetter = (countries: CountryCode[]) => {
  return countries.reduce((groups, country) => {
    const firstLetter = country.country[0].toUpperCase();
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(country);
    return groups;
  }, {} as Record<string, CountryCode[]>);
};

export const createFlatListData = (countries: CountryCode[]) => {
  const grouped = groupCountriesByFirstLetter(countries);
  const alphabet = Object.keys(grouped).sort();

  return alphabet.reduce((acc, letter) => {
    // Add header for each letter group
    acc.push({ type: "header", letter, key: `header-${letter}` });
    // Add all countries for this letter
    grouped[letter].forEach((country, index) => {
      acc.push({ type: "country", country, key: `${letter}-${index}`, letter });
    });
    return acc;
  }, [] as Array<{ type: "header" | "country"; letter: string; country?: CountryCode; key: string }>);
};
