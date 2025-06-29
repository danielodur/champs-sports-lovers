import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView, Alert, FlatList, Vibration, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trophy, ChevronDown } from 'lucide-react-native';
import { useTheme, useThemeMode } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';
import { formatPhoneNumber, formatPhoneNumberWithoutCountryCode, formatPhoneNumberByCountry } from '@/utils/phoneFormatter';

export default function RegisterAndLoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { theme: themeMode } = useThemeMode();
  const { t } = useTranslation();
  const { setLoggedIn } = useAuth();
  const [countryCode, setCountryCode] = useState('+256'); // Uganda default
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [hasInitiatedVerification, setHasInitiatedVerification] = useState(false);
  const countryListRef = useRef<FlatList>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Phone number lengths by country code
  const phoneNumberLengths: Record<string, number> = {
    '+93': 9,   // Afghanistan
    '+355': 9,  // Albania
    '+213': 9,  // Algeria
    '+1684': 7, // American Samoa
    '+376': 6,  // Andorra
    '+244': 9,  // Angola
    '+1264': 7, // Anguilla
    '+672': 6,  // Antarctica/Norfolk Island (taking Norfolk Island length)
    '+1268': 7, // Antigua and Barbuda
    '+54': 10,  // Argentina
    '+374': 8,  // Armenia
    '+297': 7,  // Aruba
    '+61': 9,   // Australia/Christmas Island/Cocos Islands
    '+43': 10,  // Austria
    '+994': 9,  // Azerbaijan
    '+1242': 7, // Bahamas
    '+973': 8,  // Bahrain
    '+880': 10, // Bangladesh
    '+1246': 7, // Barbados
    '+375': 9,  // Belarus
    '+32': 9,   // Belgium
    '+501': 7,  // Belize
    '+229': 8,  // Benin
    '+1441': 7, // Bermuda
    '+975': 8,  // Bhutan
    '+591': 8,  // Bolivia
    '+387': 8,  // Bosnia and Herzegovina
    '+267': 8,  // Botswana
    '+55': 11,  // Brazil
    '+246': 7,  // British Indian Ocean Territory
    '+673': 7,  // Brunei
    '+359': 9,  // Bulgaria
    '+226': 8,  // Burkina Faso
    '+257': 8,  // Burundi
    '+855': 9,  // Cambodia
    '+237': 9,  // Cameroon
    '+1': 10,   // Canada/United States
    '+238': 7,  // Cape Verde
    '+1345': 7, // Cayman Islands
    '+236': 8,  // Central African Republic
    '+235': 8,  // Chad
    '+56': 9,   // Chile
    '+86': 11,  // China
    '+57': 10,  // Colombia
    '+269': 7,  // Comoros
    '+242': 9,  // Congo
    '+243': 9,  // Congo (DRC)
    '+682': 5,  // Cook Islands
    '+506': 8,  // Costa Rica
    '+225': 10, // Côte d'Ivoire
    '+385': 9,  // Croatia
    '+53': 8,   // Cuba
    '+599': 7,  // Curaçao
    '+357': 8,  // Cyprus
    '+420': 9,  // Czech Republic
    '+45': 8,   // Denmark
    '+253': 8,  // Djibouti
    '+1767': 7, // Dominica
    '+1809': 7, // Dominican Republic
    '+593': 9,  // Ecuador
    '+20': 10,  // Egypt
    '+503': 8,  // El Salvador
    '+240': 9,  // Equatorial Guinea
    '+291': 7,  // Eritrea
    '+372': 7,  // Estonia
    '+251': 9,  // Ethiopia
    '+500': 5,  // Falkland Islands
    '+298': 6,  // Faroe Islands
    '+679': 7,  // Fiji
    '+358': 9,  // Finland
    '+33': 9,   // France
    '+594': 9,  // French Guiana
    '+689': 8,  // French Polynesia
    '+241': 7,  // Gabon
    '+220': 7,  // Gambia
    '+995': 9,  // Georgia
    '+49': 11,  // Germany
    '+233': 9,  // Ghana
    '+350': 8,  // Gibraltar
    '+30': 10,  // Greece
    '+299': 6,  // Greenland
    '+1473': 7, // Grenada
    '+590': 9,  // Guadeloupe/Saint Barthélemy/Saint Martin
    '+1671': 7, // Guam
    '+502': 8,  // Guatemala
    '+44': 10,  // United Kingdom/Guernsey/Isle of Man/Jersey
    '+224': 9,  // Guinea
    '+245': 7,  // Guinea-Bissau
    '+592': 7,  // Guyana
    '+509': 8,  // Haiti
    '+504': 8,  // Honduras
    '+852': 8,  // Hong Kong
    '+36': 9,   // Hungary
    '+354': 7,  // Iceland
    '+91': 10,  // India
    '+62': 10,  // Indonesia
    '+98': 10,  // Iran
    '+964': 10, // Iraq
    '+353': 9,  // Ireland
    '+972': 9,  // Israel
    '+39': 10,  // Italy
    '+1876': 7, // Jamaica
    '+81': 10,  // Japan
    '+962': 9,  // Jordan
    '+7': 10,   // Kazakhstan/Russia
    '+254': 9,  // Kenya
    '+686': 5,  // Kiribati
    '+850': 10, // Korea (North)
    '+82': 10,  // Korea (South)
    '+965': 8,  // Kuwait
    '+996': 9,  // Kyrgyzstan
    '+856': 10, // Laos
    '+371': 8,  // Latvia
    '+961': 8,  // Lebanon
    '+266': 8,  // Lesotho
    '+231': 7,  // Liberia
    '+218': 9,  // Libya
    '+423': 7,  // Liechtenstein
    '+370': 8,  // Lithuania
    '+352': 9,  // Luxembourg
    '+853': 8,  // Macao
    '+389': 8,  // Macedonia
    '+261': 9,  // Madagascar
    '+265': 9,  // Malawi
    '+60': 10,  // Malaysia
    '+960': 7,  // Maldives
    '+223': 8,  // Mali
    '+356': 8,  // Malta
    '+692': 7,  // Marshall Islands
    '+596': 9,  // Martinique
    '+222': 8,  // Mauritania
    '+230': 8,  // Mauritius
    '+262': 9,  // Mayotte/Réunion
    '+52': 10,  // Mexico
    '+691': 7,  // Micronesia
    '+373': 8,  // Moldova
    '+377': 8,  // Monaco
    '+976': 8,  // Mongolia
    '+382': 8,  // Montenegro
    '+1664': 7, // Montserrat
    '+212': 9,  // Morocco/Western Sahara
    '+258': 9,  // Mozambique
    '+95': 9,   // Myanmar
    '+264': 9,  // Namibia
    '+674': 7,  // Nauru
    '+977': 10, // Nepal
    '+31': 9,   // Netherlands
    '+687': 6,  // New Caledonia
    '+64': 9,   // New Zealand
    '+505': 8,  // Nicaragua
    '+227': 8,  // Niger
    '+234': 10, // Nigeria
    '+683': 4,  // Niue
    '+1670': 7, // Northern Mariana Islands
    '+47': 8,   // Norway/Svalbard and Jan Mayen
    '+968': 8,  // Oman
    '+92': 10,  // Pakistan
    '+680': 7,  // Palau
    '+970': 9,  // Palestine
    '+507': 8,  // Panama
    '+675': 8,  // Papua New Guinea
    '+595': 9,  // Paraguay
    '+51': 9,   // Peru
    '+63': 10,  // Philippines
    '+48': 9,   // Poland
    '+351': 9,  // Portugal
    '+1787': 7, // Puerto Rico
    '+974': 8,  // Qatar
    '+40': 9,   // Romania
    '+250': 9,  // Rwanda
    '+290': 4,  // Saint Helena
    '+1869': 7, // Saint Kitts and Nevis
    '+1758': 7, // Saint Lucia
    '+508': 6,  // Saint Pierre and Miquelon
    '+1784': 7, // Saint Vincent and the Grenadines
    '+685': 7,  // Samoa
    '+378': 8,  // San Marino
    '+239': 7,  // São Tomé and Príncipe
    '+966': 9,  // Saudi Arabia
    '+221': 9,  // Senegal
    '+381': 9,  // Serbia
    '+248': 7,  // Seychelles
    '+232': 8,  // Sierra Leone
    '+65': 8,   // Singapore
    '+1721': 7, // Sint Maarten
    '+421': 9,  // Slovakia
    '+386': 8,  // Slovenia
    '+677': 7,  // Solomon Islands
    '+252': 8,  // Somalia
    '+27': 9,   // South Africa
    '+211': 9,  // South Sudan
    '+34': 9,   // Spain
    '+94': 9,   // Sri Lanka
    '+249': 9,  // Sudan
    '+597': 7,  // Suriname
    '+268': 8,  // Swaziland
    '+46': 9,   // Sweden
    '+41': 9,   // Switzerland
    '+963': 9,  // Syria
    '+886': 9,  // Taiwan
    '+992': 9,  // Tajikistan
    '+255': 9,  // Tanzania
    '+66': 9,   // Thailand
    '+670': 8,  // Timor-Leste
    '+228': 8,  // Togo
    '+690': 4,  // Tokelau
    '+676': 7,  // Tonga
    '+1868': 7, // Trinidad and Tobago
    '+216': 8,  // Tunisia
    '+90': 10,  // Turkey
    '+993': 8,  // Turkmenistan
    '+1649': 7, // Turks and Caicos Islands
    '+688': 6,  // Tuvalu
    '+256': 9,  // Uganda
    '+380': 9,  // Ukraine
    '+971': 9,  // United Arab Emirates
    '+598': 8,  // Uruguay
    '+998': 9,  // Uzbekistan
    '+678': 7,  // Vanuatu
    '+379': 8,  // Vatican City
    '+58': 10,  // Venezuela
    '+84': 9,   // Vietnam
    '+1284': 7, // Virgin Islands (British)
    '+1340': 7, // Virgin Islands (US)
    '+681': 6,  // Wallis and Futuna
    '+967': 9,  // Yemen
    '+260': 9,  // Zambia
    '+263': 9,  // Zimbabwe
  };

  const countryCodes = [
    { code: '+93', country: 'Afghanistan', flag: '🇦🇫' },
    { code: '+355', country: 'Albania', flag: '🇦🇱' },
    { code: '+213', country: 'Algeria', flag: '🇩🇿' },
    { code: '+1684', country: 'American Samoa', flag: '🇦🇸' },
    { code: '+376', country: 'Andorra', flag: '🇦🇩' },
    { code: '+244', country: 'Angola', flag: '🇦🇴' },
    { code: '+1264', country: 'Anguilla', flag: '🇦🇮' },
    { code: '+672', country: 'Antarctica', flag: '🇦🇶' },
    { code: '+1268', country: 'Antigua and Barbuda', flag: '🇦🇬' },
    { code: '+54', country: 'Argentina', flag: '🇦🇷' },
    { code: '+374', country: 'Armenia', flag: '🇦🇲' },
    { code: '+297', country: 'Aruba', flag: '🇦🇼' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+43', country: 'Austria', flag: '🇦🇹' },
    { code: '+994', country: 'Azerbaijan', flag: '🇦🇿' },
    { code: '+1242', country: 'Bahamas', flag: '🇧🇸' },
    { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
    { code: '+1246', country: 'Barbados', flag: '🇧🇧' },
    { code: '+375', country: 'Belarus', flag: '🇧🇾' },
    { code: '+32', country: 'Belgium', flag: '🇧🇪' },
    { code: '+501', country: 'Belize', flag: '🇧🇿' },
    { code: '+229', country: 'Benin', flag: '🇧🇯' },
    { code: '+1441', country: 'Bermuda', flag: '🇧🇲' },
    { code: '+975', country: 'Bhutan', flag: '🇧🇹' },
    { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
    { code: '+387', country: 'Bosnia and Herzegovina', flag: '🇧🇦' },
    { code: '+267', country: 'Botswana', flag: '🇧🇼' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+246', country: 'British Indian Ocean Territory', flag: '🇮🇴' },
    { code: '+673', country: 'Brunei', flag: '🇧🇳' },
    { code: '+359', country: 'Bulgaria', flag: '🇧🇬' },
    { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
    { code: '+257', country: 'Burundi', flag: '🇧🇮' },
    { code: '+855', country: 'Cambodia', flag: '🇰🇭' },
    { code: '+237', country: 'Cameroon', flag: '🇨🇲' },
    { code: '+1', country: 'Canada', flag: '🇨🇦' },
    { code: '+238', country: 'Cape Verde', flag: '🇨🇻' },
    { code: '+1345', country: 'Cayman Islands', flag: '🇰🇾' },
    { code: '+236', country: 'Central African Republic', flag: '🇨🇫' },
    { code: '+235', country: 'Chad', flag: '🇹🇩' },
    { code: '+56', country: 'Chile', flag: '🇨🇱' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+61', country: 'Christmas Island', flag: '🇨🇽' },
    { code: '+61', country: 'Cocos Islands', flag: '🇨🇨' },
    { code: '+57', country: 'Colombia', flag: '🇨🇴' },
    { code: '+269', country: 'Comoros', flag: '🇰🇲' },
    { code: '+242', country: 'Congo', flag: '🇨🇬' },
    { code: '+243', country: 'Congo (DRC)', flag: '🇨🇩' },
    { code: '+682', country: 'Cook Islands', flag: '🇨🇰' },
    { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
    { code: '+225', country: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { code: '+385', country: 'Croatia', flag: '🇭🇷' },
    { code: '+53', country: 'Cuba', flag: '🇨🇺' },
    { code: '+599', country: 'Curaçao', flag: '🇨🇼' },
    { code: '+357', country: 'Cyprus', flag: '🇨🇾' },
    { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
    { code: '+45', country: 'Denmark', flag: '🇩🇰' },
    { code: '+253', country: 'Djibouti', flag: '🇩🇯' },
    { code: '+1767', country: 'Dominica', flag: '🇩🇲' },
    { code: '+1809', country: 'Dominican Republic', flag: '🇩🇴' },
    { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
    { code: '+20', country: 'Egypt', flag: '🇪🇬' },
    { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
    { code: '+240', country: 'Equatorial Guinea', flag: '🇬🇶' },
    { code: '+291', country: 'Eritrea', flag: '🇪🇷' },
    { code: '+372', country: 'Estonia', flag: '🇪🇪' },
    { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
    { code: '+500', country: 'Falkland Islands', flag: '🇫🇰' },
    { code: '+298', country: 'Faroe Islands', flag: '🇫🇴' },
    { code: '+679', country: 'Fiji', flag: '🇫🇯' },
    { code: '+358', country: 'Finland', flag: '🇫🇮' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+594', country: 'French Guiana', flag: '🇬🇫' },
    { code: '+689', country: 'French Polynesia', flag: '🇵🇫' },
    { code: '+241', country: 'Gabon', flag: '🇬🇦' },
    { code: '+220', country: 'Gambia', flag: '🇬🇲' },
    { code: '+995', country: 'Georgia', flag: '🇬🇪' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+233', country: 'Ghana', flag: '🇬🇭' },
    { code: '+350', country: 'Gibraltar', flag: '🇬🇮' },
    { code: '+30', country: 'Greece', flag: '🇬🇷' },
    { code: '+299', country: 'Greenland', flag: '🇬🇱' },
    { code: '+1473', country: 'Grenada', flag: '🇬🇩' },
    { code: '+590', country: 'Guadeloupe', flag: '🇬🇵' },
    { code: '+1671', country: 'Guam', flag: '🇬🇺' },
    { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
    { code: '+44', country: 'Guernsey', flag: '🇬🇬' },
    { code: '+224', country: 'Guinea', flag: '🇬🇳' },
    { code: '+245', country: 'Guinea-Bissau', flag: '🇬🇼' },
    { code: '+592', country: 'Guyana', flag: '🇬🇾' },
    { code: '+509', country: 'Haiti', flag: '🇭🇹' },
    { code: '+504', country: 'Honduras', flag: '🇭🇳' },
    { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
    { code: '+36', country: 'Hungary', flag: '🇭🇺' },
    { code: '+354', country: 'Iceland', flag: '🇮🇸' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
    { code: '+98', country: 'Iran', flag: '🇮🇷' },
    { code: '+964', country: 'Iraq', flag: '🇮🇶' },
    { code: '+353', country: 'Ireland', flag: '🇮🇪' },
    { code: '+44', country: 'Isle of Man', flag: '🇮🇲' },
    { code: '+972', country: 'Israel', flag: '🇮🇱' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+1876', country: 'Jamaica', flag: '🇯🇲' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+44', country: 'Jersey', flag: '🇯🇪' },
    { code: '+962', country: 'Jordan', flag: '🇯🇴' },
    { code: '+7', country: 'Kazakhstan', flag: '🇰🇿' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+686', country: 'Kiribati', flag: '🇰🇮' },
    { code: '+850', country: 'Korea (North)', flag: '🇰🇵' },
    { code: '+82', country: 'Korea (South)', flag: '🇰🇷' },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
    { code: '+996', country: 'Kyrgyzstan', flag: '🇰🇬' },
    { code: '+856', country: 'Laos', flag: '🇱🇦' },
    { code: '+371', country: 'Latvia', flag: '🇱🇻' },
    { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
    { code: '+266', country: 'Lesotho', flag: '🇱🇸' },
    { code: '+231', country: 'Liberia', flag: '🇱🇷' },
    { code: '+218', country: 'Libya', flag: '🇱🇾' },
    { code: '+423', country: 'Liechtenstein', flag: '🇱🇮' },
    { code: '+370', country: 'Lithuania', flag: '🇱🇹' },
    { code: '+352', country: 'Luxembourg', flag: '🇱🇺' },
    { code: '+853', country: 'Macao', flag: '🇲🇴' },
    { code: '+389', country: 'Macedonia', flag: '🇲🇰' },
    { code: '+261', country: 'Madagascar', flag: '🇲🇬' },
    { code: '+265', country: 'Malawi', flag: '🇲🇼' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+960', country: 'Maldives', flag: '🇲🇻' },
    { code: '+223', country: 'Mali', flag: '🇲🇱' },
    { code: '+356', country: 'Malta', flag: '🇲🇹' },
    { code: '+692', country: 'Marshall Islands', flag: '🇲🇭' },
    { code: '+596', country: 'Martinique', flag: '🇲🇶' },
    { code: '+222', country: 'Mauritania', flag: '🇲🇷' },
    { code: '+230', country: 'Mauritius', flag: '🇲🇺' },
    { code: '+262', country: 'Mayotte', flag: '🇾🇹' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
    { code: '+691', country: 'Micronesia', flag: '🇫🇲' },
    { code: '+373', country: 'Moldova', flag: '🇲🇩' },
    { code: '+377', country: 'Monaco', flag: '🇲🇨' },
    { code: '+976', country: 'Mongolia', flag: '🇲🇳' },
    { code: '+382', country: 'Montenegro', flag: '🇲🇪' },
    { code: '+1664', country: 'Montserrat', flag: '🇲🇸' },
    { code: '+212', country: 'Morocco', flag: '🇲🇦' },
    { code: '+258', country: 'Mozambique', flag: '🇲🇿' },
    { code: '+95', country: 'Myanmar', flag: '🇲🇲' },
    { code: '+264', country: 'Namibia', flag: '🇳🇦' },
    { code: '+674', country: 'Nauru', flag: '🇳🇷' },
    { code: '+977', country: 'Nepal', flag: '🇳🇵' },
    { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
    { code: '+687', country: 'New Caledonia', flag: '🇳🇨' },
    { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
    { code: '+505', country: 'Nicaragua', flag: '🇳🇮' },
    { code: '+227', country: 'Niger', flag: '🇳🇪' },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+683', country: 'Niue', flag: '🇳��' },
    { code: '+1670', country: 'Northern Mariana Islands', flag: '🇲🇵' },
    { code: '+47', country: 'Norway', flag: '🇳🇴' },
    { code: '+968', country: 'Oman', flag: '🇴🇲' },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
    { code: '+680', country: 'Palau', flag: '🇵🇼' },
    { code: '+970', country: 'Palestine', flag: '🇵🇸' },
    { code: '+507', country: 'Panama', flag: '🇵🇦' },
    { code: '+675', country: 'Papua New Guinea', flag: '🇵🇬' },
    { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
    { code: '+51', country: 'Peru', flag: '🇵🇪' },
    { code: '+63', country: 'Philippines', flag: '🇵🇭' },
    { code: '+48', country: 'Poland', flag: '🇵🇱' },
    { code: '+351', country: 'Portugal', flag: '🇵🇹' },
    { code: '+1787', country: 'Puerto Rico', flag: '🇵🇷' },
    { code: '+974', country: 'Qatar', flag: '🇶🇦' },
    { code: '+262', country: 'Réunion', flag: '🇷🇪' },
    { code: '+40', country: 'Romania', flag: '🇷🇴' },
    { code: '+7', country: 'Russia', flag: '🇷🇺' },
    { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
    { code: '+590', country: 'Saint Barthélemy', flag: '🇧🇱' },
    { code: '+290', country: 'Saint Helena', flag: '🇸🇭' },
    { code: '+1869', country: 'Saint Kitts and Nevis', flag: '🇰🇳' },
    { code: '+1758', country: 'Saint Lucia', flag: '🇱🇨' },
    { code: '+590', country: 'Saint Martin', flag: '🇲🇫' },
    { code: '+508', country: 'Saint Pierre and Miquelon', flag: '🇵🇲' },
    { code: '+1784', country: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
    { code: '+685', country: 'Samoa', flag: '🇼🇸' },
    { code: '+378', country: 'San Marino', flag: '🇸🇲' },
    { code: '+239', country: 'São Tomé and Príncipe', flag: '🇸🇹' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+221', country: 'Senegal', flag: '🇸🇳' },
    { code: '+381', country: 'Serbia', flag: '🇷🇸' },
    { code: '+248', country: 'Seychelles', flag: '🇸🇨' },
    { code: '+232', country: 'Sierra Leone', flag: '🇸🇱' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+1721', country: 'Sint Maarten', flag: '🇸🇽' },
    { code: '+421', country: 'Slovakia', flag: '🇸🇰' },
    { code: '+386', country: 'Slovenia', flag: '🇸🇮' },
    { code: '+677', country: 'Solomon Islands', flag: '🇸🇧' },
    { code: '+252', country: 'Somalia', flag: '🇸🇴' },
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+211', country: 'South Sudan', flag: '🇸🇸' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
    { code: '+249', country: 'Sudan', flag: '🇸🇩' },
    { code: '+597', country: 'Suriname', flag: '🇸🇷' },
    { code: '+47', country: 'Svalbard and Jan Mayen', flag: '🇸🇯' },
    { code: '+268', country: 'Swaziland', flag: '🇸🇿' },
    { code: '+46', country: 'Sweden', flag: '🇸🇪' },
    { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
    { code: '+963', country: 'Syria', flag: '🇸🇾' },
    { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
    { code: '+992', country: 'Tajikistan', flag: '🇹🇯' },
    { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
    { code: '+66', country: 'Thailand', flag: '🇹🇭' },
    { code: '+670', country: 'Timor-Leste', flag: '🇹🇱' },
    { code: '+228', country: 'Togo', flag: '🇹🇬' },
    { code: '+690', country: 'Tokelau', flag: '🇹🇰' },
    { code: '+676', country: 'Tonga', flag: '🇹🇴' },
    { code: '+1868', country: 'Trinidad and Tobago', flag: '🇹🇹' },
    { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
    { code: '+90', country: 'Turkey', flag: '🇹🇷' },
    { code: '+993', country: 'Turkmenistan', flag: '🇹🇲' },
    { code: '+1649', country: 'Turks and Caicos Islands', flag: '🇹🇨' },
    { code: '+688', country: 'Tuvalu', flag: '🇹🇻' },
    { code: '+256', country: 'Uganda', flag: '🇺🇬' },
    { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
    { code: '+971', country: 'United Arab Emirates', flag: '🇦��' },
    { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
    { code: '+998', country: 'Uzbekistan', flag: '🇺🇿' },
    { code: '+678', country: 'Vanuatu', flag: '🇻🇺' },
    { code: '+379', country: 'Vatican City', flag: '🇻🇦' },
    { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
    { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
    { code: '+1284', country: 'Virgin Islands (British)', flag: '🇻🇬' },
    { code: '+1340', country: 'Virgin Islands (US)', flag: '🇻🇮' },
    { code: '+681', country: 'Wallis and Futuna', flag: '🇼🇫' },
    { code: '+212', country: 'Western Sahara', flag: '🇪🇭' },
    { code: '+967', country: 'Yemen', flag: '🇾🇪' },
    { code: '+260', country: 'Zambia', flag: '🇿🇲' },
    { code: '+263', country: 'Zimbabwe', flag: '🇿🇼' },
  ];

  // Group countries by first letter
  const groupedCountries = countryCodes.reduce((groups, country) => {
    const firstLetter = country.country[0].toUpperCase();
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(country);
    return groups;
  }, {} as Record<string, typeof countryCodes>);

  const alphabet = Object.keys(groupedCountries).sort();
  
  // Create flattened data for FlatList with section headers for better navigation
  const flatListData = alphabet.reduce((acc, letter) => {
    // Add header for each letter group
    acc.push({ type: 'header', letter, key: `header-${letter}` });
    // Add all countries for this letter
    groupedCountries[letter].forEach((country, index) => {
      acc.push({ type: 'country', country, key: `${letter}-${index}`, letter });
    });
    return acc;
  }, [] as Array<{ type: 'header' | 'country'; letter: string; country?: any; key: string }>);

  // Debug: Log available letters to ensure all are present
  React.useEffect(() => {
    console.log('=== COUNTRY PICKER DEBUG INFO ===');
    console.log('Available alphabet letters:', alphabet);
    console.log('Total countries grouped:', Object.values(groupedCountries).flat().length);
    console.log('Total flatListData items:', flatListData.length);
    
    // Log the first few items of flatListData for debugging
    console.log('First 10 flatListData items:', flatListData.slice(0, 10));
    
    // Check if all alphabet letters have corresponding headers in flatListData
    const headerLetters = flatListData
      .filter(item => item.type === 'header')
      .map(item => item.letter);
    console.log('Header letters in flatListData:', headerLetters);
    
    const missingLetters = alphabet.filter(letter => !headerLetters.includes(letter));
    if (missingLetters.length > 0) {
      console.log('❌ Missing letters in flatListData:', missingLetters);
    } else {
      console.log('✅ All alphabet letters are present in flatListData');
    }
  }, [flatListData, alphabet]);

  // Constants for item heights (matching actual styles)
  const HEADER_HEIGHT = 28; // Reduced spacing: paddingVertical: 8*2 + marginTop: 4 + marginBottom: 4 = 24
  const COUNTRY_HEIGHT = 48; // paddingVertical: 12*2 + borderBottomWidth: 0.5 ≈ 24.5, rounded up

  // Pre-calculate item layout data for better performance
  const itemLayoutData = React.useMemo(() => {
    const layouts: Array<{ length: number; offset: number; index: number }> = [];
    let offset = 0;
    
    flatListData.forEach((item, index) => {
      const length = item.type === 'header' ? HEADER_HEIGHT : COUNTRY_HEIGHT;
      layouts.push({ length, offset, index });
      offset += length;
    });
    
    return layouts;
  }, [flatListData]);

  // Optimized scroll to letter function with enhanced debugging
  const scrollToLetter = (letter: string) => {
    console.log(`=== SCROLLING TO LETTER: ${letter} ===`);
    
    // Find all instances of this letter to debug
    const allMatches = flatListData
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.type === 'header' && item.letter === letter);
    
    console.log(`All matches for ${letter}:`, allMatches);
    
    const headerIndex = flatListData.findIndex(item => item.type === 'header' && item.letter === letter);
    console.log(`Found header index for ${letter}:`, headerIndex);
    console.log(`Available alphabet:`, alphabet);
    console.log(`FlatListData length:`, flatListData.length);
    
    if (headerIndex === -1) {
      console.log(`❌ Letter ${letter} not found in flatListData`);
      // Debug: Show what letters are actually available
      const availableLetters = flatListData
        .filter(item => item.type === 'header')
        .map(item => item.letter);
      console.log(`Available header letters in flatListData:`, availableLetters);
      return;
    }

    if (!countryListRef.current) {
      console.log('❌ CountryListRef is not available');
      return;
    }

    // Use pre-calculated layout data for accurate scrolling
    const targetLayout = itemLayoutData[headerIndex];
    if (!targetLayout) {
      console.log(`❌ Layout data not found for index ${headerIndex}`);
      return;
    }

    console.log(`✅ Target layout:`, targetLayout);

    // Always use scrollToOffset for more reliable scrolling
    try {
      countryListRef.current.scrollToOffset({
        offset: Math.max(0, targetLayout.offset),
        animated: true
      });
      console.log(`✅ ScrollToOffset used for ${letter} with offset ${targetLayout.offset}`);
    } catch (error) {
      console.log(`❌ ScrollToOffset failed for ${letter}:`, error);
    }
  };

  // Get maximum phone number length for current country
  const getMaxPhoneLength = () => {
    return phoneNumberLengths[countryCode] || 10; // Default to 10 if not found
  };

  // Handle phone number input with length validation
  const handlePhoneNumberChange = (text: string) => {
    // Use the comprehensive formatting function for all countries
    const formattedNumber = formatPhoneNumberByCountry(text, countryCode);
    setPhoneNumber(formattedNumber);
  };

  // Start countdown timer
  const startCountdown = () => {
    setCountdown(40);
    setIsCountdownActive(true);
    setHasInitiatedVerification(true);
    
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsCountdownActive(false);
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clear countdown on unmount
  React.useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [phoneNumber, verificationCode, hasInitiatedVerification]);

  const handleSendVerificationCode = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    const cleanPhoneNumber = phoneNumber.replace(/\s/g, '');
    const maxLength = getMaxPhoneLength();
    if (cleanPhoneNumber.length < maxLength) {
      Alert.alert('Error', `Phone number must be ${maxLength} digits for ${countryCode}`);
      return;
    }

    if (isCountdownActive) {
      return; // Prevent multiple sends during countdown
    }

    startCountdown();
    Alert.alert(
      'Verification Code Sent',
      `Verification code has been sent to ${countryCode} ${phoneNumber}`,
      [{ text: 'OK' }]
    );
  };

  const handleLogin = () => {
    if (!agreedToTerms) {
      Alert.alert('Error', 'Please agree to the terms and conditions');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }
    
    // For development/testing, accept specific test credentials
    const cleanPhoneNumber = phoneNumber.replace(/\s/g, '');
    // Accept both formatted number (772908010) and full number with leading 0 (0772908010)
    const isValidTestNumber = (cleanPhoneNumber === '772908010' || cleanPhoneNumber === '0772908010');
    if (isValidTestNumber && verificationCode === '1234') {
      console.log('Login successful with test credentials:', { countryCode, phoneNumber, verificationCode });
      // Set logged in state with user info - generate professional Dicebear avatar
      const finalUsername = 'DefaultUser123';
      const backgroundColors = ['ffdfbf', 'f0f0f0', 'e8f4fd', 'fff2e6', 'f8f8ff', 'f0fff0', 'fffacd', 'f5f5dc'];
      const seedHash = finalUsername.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const colorIndex = Math.abs(seedHash) % backgroundColors.length;
      const backgroundColor = backgroundColors[colorIndex];
      const avatarUrl = `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(finalUsername)}&backgroundColor=${backgroundColor}&size=160`;
      
      setLoggedIn(true, {
        username: finalUsername,
        avatar: avatarUrl
      });
      // Navigate to profile tab to show signed-in state
      router.replace('/(tabs)/profile');
      return;
    }
    
    // For other cases, show error message with test credentials info
    Alert.alert(
      'Error', 
      'Invalid credentials. For development testing, use:\nPhone: 7729 080 10\nCode: 1234',
      [{ text: 'OK' }]
    );
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`${provider} login pressed`);
    // Add your social login logic here
  };

  const handleDidntReceiveCode = () => {
          // Navigate to Help Center screen with modal parameter
            router.push('/help-center?showModal=didntReceiveCode');
  };

  const handleBackPress = () => {
    // Check if user has started verification process or entered any data
    const hasEnteredData = phoneNumber.trim() !== '' || verificationCode.trim() !== '';
    
    if (hasEnteredData || hasInitiatedVerification) {
      Alert.alert(
        'Exit Verification',
        'Are you sure you want to exit? Your progress will be lost.',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => {
              // Reset states and navigate back
              setPhoneNumber('');
              setVerificationCode('');
              setHasInitiatedVerification(false);
              setIsCountdownActive(false);
              setCountdown(0);
              if (countdownRef.current) {
                clearInterval(countdownRef.current);
              }
              router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
            },
          },
        ]
      );
    } else {
      // No data entered, navigate back normally
      router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
    }
  };

  const renderCountryItem = ({ item }: { item: any }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.groupHeader}>
          <Text style={styles.groupHeaderText}>
            {item.letter}
          </Text>
        </View>
      );
    }

    // Handle long country names to prevent overlap with alphabet index
    const countryName = item.country.country;
    const countryCode = item.country.code;
    
    let displayText;
    if (countryName.length >= 17) {
      // Truncate long names and add "..." + country code
      const truncatedName = countryName.substring(0, 14) + '...';
      displayText = `${truncatedName} (${countryCode})`;
    } else {
      displayText = `${countryName} (${countryCode})`;
    }

    return (
      <TouchableOpacity
        style={[styles.countryOption, { borderBottomColor: theme.colors.border }]}
        onPress={() => {
          setCountryCode(item.country.code);
          setPhoneNumber(''); // Reset phone number when country changes
          setShowCountryPicker(false);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.countryFlag}>{item.country.flag}</Text>
        <Text 
          style={[styles.countryText, { color: theme.colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayText}
        </Text>
      </TouchableOpacity>
    );
  };

  const CountryPicker = () => (
    <View style={styles.countryPickerOverlay}>
      <TouchableOpacity 
        style={styles.overlayBackground}
        activeOpacity={1}
        onPress={() => setShowCountryPicker(false)}
      />
      <View style={[styles.countryPickerModal, { backgroundColor: theme.colors.backgroundSecondary }]}>
        {/* Header */}
        <View style={[styles.pickerHeader, { backgroundColor: theme.colors.backgroundSecondary, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.pickerHeaderTitle, { color: theme.colors.text }]}>
            {t('Select Country')}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowCountryPicker(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeButtonText, { color: theme.colors.primary }]}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>
        
                  <View style={styles.listContainer}>
            <FlatList
              ref={countryListRef}
              data={flatListData}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.key}
              style={styles.countryList}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
              initialNumToRender={50}
              maxToRenderPerBatch={50}
              windowSize={21}
              getItemLayout={(data, index) => {
                // Use pre-calculated layout data for optimal performance
                const layout = itemLayoutData[index];
                if (layout) {
                  return layout;
                }
                // Fallback calculation
                const item = flatListData[index];
                const length = item?.type === 'header' ? HEADER_HEIGHT : COUNTRY_HEIGHT;
                return { length, offset: index * COUNTRY_HEIGHT, index };
              }}
              onScrollToIndexFailed={(info) => {
                console.log('❌ ScrollToIndexFailed for index:', info.index);
                
                // Use pre-calculated layout data for fallback
                const maxIndex = Math.min(info.index, itemLayoutData.length - 1);
                const fallbackLayout = itemLayoutData[maxIndex];
                
                if (fallbackLayout) {
                  console.log('✅ Using fallback offset:', fallbackLayout.offset);
                  
                  setTimeout(() => {
                    if (countryListRef.current) {
                      countryListRef.current.scrollToOffset({ 
                        offset: Math.max(0, fallbackLayout.offset),
                        animated: true 
                      });
                    }
                  }, 200);
                } else {
                  console.log('❌ No fallback layout data available for index:', info.index);
                }
              }}
            />
            
            {/* Alphabetical Index with Scrolling */}
            <ScrollView 
              style={styles.alphabetIndex}
              contentContainerStyle={styles.alphabetIndexContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {alphabet.map((letter) => (
                <TouchableOpacity
                  key={letter}
                  style={[
                    styles.alphabetItem,
                    { 
                      backgroundColor: theme.colors.backgroundSecondary + 'F0' // Semi-transparent circular background
                    }
                  ]}
                  onPress={() => {
                    // Add haptic feedback for better UX
                    if (Platform.OS === 'ios') {
                      Vibration.vibrate(10);
                    }
                    scrollToLetter(letter);
                  }}
                  activeOpacity={0.4}
                >
                  <Text style={[styles.alphabetText, { color: theme.colors.primary }]}>
                    {letter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBackPress} 
            style={[styles.backButton, { marginTop: 40 }]}
            activeOpacity={0.7}
          >
            <ChevronLeft size={28} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoBackground, { backgroundColor: theme.colors.primary }]}>
              <Trophy size={40} color="#FFFFFF" />
            </View>
            <Text style={[styles.appName, { color: theme.colors.text }]}>{t('Champs')}</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Country Code and Phone Number */}
            <View style={styles.phoneInputContainer}>
              <TouchableOpacity
                style={[
                  styles.countryCodeButton,
                  {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border
                  }
                ]}
                onPress={() => setShowCountryPicker(!showCountryPicker)}
                activeOpacity={0.7}
              >
                <Text style={[styles.countryCodeText, { color: theme.colors.text }]}>
                  {countryCode}
                </Text>
                <ChevronDown size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              
              <TextInput
                style={[
                  styles.phoneInput,
                  {
                    backgroundColor: theme.colors.backgroundSecondary,
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  },
                  Platform.select({ web: { outlineStyle: 'none' } as any })
                ]}
                placeholder={countryCode === '+256' ? '7729 080 10' : `${t('Enter Phone Number')} (${getMaxPhoneLength()} ${t('digits')})`}
                placeholderTextColor={theme.colors.textSecondary}
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                keyboardType="phone-pad"
                maxLength={countryCode === '+256' ? 12 : getMaxPhoneLength() + 4}
              />
            </View>

            {/* Verification Code Input with Send Button */}
            <View style={styles.verificationContainer}>
              <TextInput
                style={[
                  styles.verificationInput,
                  {
                    backgroundColor: theme.colors.backgroundSecondary,
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  },
                  Platform.select({ web: { outlineStyle: 'none' } as any })
                ]}
                placeholder={t('Enter Verification Code')}
                placeholderTextColor={theme.colors.textSecondary}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={4}
              />
              
              <TouchableOpacity
                style={[
                  styles.sendCodeButton, 
                  { 
                    backgroundColor: isCountdownActive ? '#CCCCCC' : theme.colors.primary,
                    opacity: isCountdownActive ? 0.6 : 1
                  }
                ]}
                onPress={handleSendVerificationCode}
                activeOpacity={0.8}
                disabled={isCountdownActive}
              >
                <Text style={[
                  styles.sendCodeButtonText,
                  { color: isCountdownActive ? '#999999' : '#FFFFFF' }
                ]}>
                  {isCountdownActive 
                    ? `${t('Resend')} (${countdown}s)` 
                    : hasInitiatedVerification 
                      ? t('Resend Code')
                      : t('Send Code')
                  }
                </Text>
              </TouchableOpacity>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkboxInner,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: agreedToTerms ? theme.colors.primary : 'transparent'
                  }
                ]} />
              </TouchableOpacity>
              <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
                {t('I have read and agree to the')}  {''}
                <Text style={{ color: theme.colors.primary }}>{t('Champs User Service Agreement')}</Text>
                {' '}{t('and')}{' '}
                <Text style={{ color: theme.colors.primary }}>{t('Champs Privacy Policy.')}</Text>
              </Text>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton, 
                { 
                  backgroundColor: agreedToTerms ? '#EF5350' : '#CCCCCC',
                  opacity: agreedToTerms ? 1 : 0.6
                }
              ]}
              disabled={!agreedToTerms}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.loginButtonText,
                { color: agreedToTerms ? '#FFFFFF' : '#999999' }
              ]}>
                {t('Login/Register')}
              </Text>
            </TouchableOpacity>

            {/* Account Password Login Button */}
            <TouchableOpacity 
              style={styles.passwordLoginButton}
                              onPress={() => router.push('/login-register')}
              activeOpacity={0.7}
            >
              <Text style={[styles.passwordLoginButtonText, { color: theme.colors.textSecondary }]}>
                {t('Account Password Login')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />

        {/* Didn't Receive Code */}
        <TouchableOpacity 
          style={styles.didntReceiveContainer}
          onPress={handleDidntReceiveCode}
          activeOpacity={0.7}
        >
          <Text style={[styles.didntReceiveText, { color: theme.colors.primary }]}>
            {t('Didn\'t receive code?')}
          </Text>
        </TouchableOpacity>

        {/* Social Login Icons at Bottom */}
        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: '#000000' }]}
            onPress={() => handleSocialLogin('X')}
            activeOpacity={0.7}
          >
            <Text style={styles.xIcon}>𝕏</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: '#25D366' }]}
            onPress={() => handleSocialLogin('WhatsApp')}
            activeOpacity={0.7}
          >
            <Text style={styles.whatsappIcon}>💬</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
            onPress={() => handleSocialLogin('Facebook')}
            activeOpacity={0.7}
          >
            <Text style={styles.facebookIcon}>f</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Country Picker Modal - Outside ScrollView for full screen coverage */}
      {showCountryPicker && <CountryPicker />}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 40,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 500,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    position: 'relative',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  countryCodeButton: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  countryCodeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
  },
  countryPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: -20,
    right: -20,
    bottom: -40,
    zIndex: 9999,
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  countryPickerModal: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    bottom: 40,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pickerHeaderTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  listContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  countryList: {
    flex: 1,
  },
  alphabetIndex: {
    position: 'absolute',
    right: 8,
    top: 20,
    bottom: 20,
    paddingHorizontal: 6,
  },
  alphabetIndexContent: {
    flexGrow: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 12,
  },
  alphabetItem: {
    width: 28,
    height: 28,
    borderRadius: 14, // Perfect circle
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alphabetText: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF5350',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50, // Add right padding to avoid alphabet index overlap
    borderBottomWidth: 0.5,
    minHeight: 48,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  countryText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    flex: 1, // Allow text to take remaining space
    marginRight: 8, // Small margin from the right edge
  },
  groupHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  groupHeaderText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    fontWeight: 'bold',
    color: '#000000',
  },

  verificationContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  verificationInput: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
  },
  sendCodeButton: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  sendCodeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  checkboxInner: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderRadius: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  loginButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  passwordLoginButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  passwordLoginButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  bottomSpacer: {
    height: 40,
  },
  didntReceiveContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 8,
  },
  didntReceiveText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingBottom: 20,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  xIcon: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  whatsappIcon: {
    fontSize: 20,
  },
  facebookIcon: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
}); 