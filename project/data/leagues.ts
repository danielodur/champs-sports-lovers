import { League } from '@/types/league';

export const leagues: Record<string, League[]> = {
  football: [
    // A
    { id: 'a-league', name: 'A-League Men', country: 'Australia' },
    { id: 'absa-premiership', name: 'ABSA Premiership', country: 'South Africa' },
    { id: 'afghan-premier', name: 'Afghan Premier League', country: 'Afghanistan' },
    { id: 'afc-asian-cup', name: 'AFC Asian Cup', country: 'Asia' },
    { id: 'afc-champions', name: 'AFC Champions League', country: 'Asia' },
    { id: 'africa-cup', name: 'Africa Cup of Nations', country: 'Africa' },
    { id: 'algerian-ligue-1', name: 'Algerian Ligue 1', country: 'Algeria' },
    { id: 'algerian-ligue-2', name: 'Algerian Ligue 2', country: 'Algeria' },
    { id: 'allsvenskan', name: 'Allsvenskan', country: 'Sweden' },
    { id: 'andorran-primera', name: 'Andorran Primera Divisió', country: 'Andorra' },
    { id: 'angolan-girabola', name: 'Angolan Girabola', country: 'Angola' },
    { id: 'argentine-primera', name: 'Argentine Primera División', country: 'Argentina' },
    { id: 'armenian-premier', name: 'Armenian Premier League', country: 'Armenia' },
    { id: 'azerbaijani-premier', name: 'Azerbaijan Premier League', country: 'Azerbaijan' },

    // B
    { id: 'bahraini-premier', name: 'Bahraini Premier League', country: 'Bahrain' },
    { id: 'bangladeshi-premier', name: 'Bangladesh Premier League', country: 'Bangladesh' },
    { id: 'belarusian-premier', name: 'Belarusian Premier League', country: 'Belarus' },
    { id: 'belgian-pro', name: 'Belgian Pro League', country: 'Belgium' },
    { id: 'belgian-challenger', name: 'Belgian Challenger Pro League', country: 'Belgium' },
    { id: 'benin-premier', name: 'Benin Premier League', country: 'Benin' },
    { id: 'bhutan-premier', name: 'Bhutan Premier League', country: 'Bhutan' },
    { id: 'bolivian-primera', name: 'Bolivian Primera División', country: 'Bolivia' },
    { id: 'bosnian-premier', name: 'Premier League of Bosnia', country: 'Bosnia' },
    { id: 'botswana-premier', name: 'Botswana Premier League', country: 'Botswana' },
    { id: 'brasileirao-a', name: 'Brasileirão Série A', country: 'Brazil' },
    { id: 'brasileirao-b', name: 'Brasileirão Série B', country: 'Brazil' },
    { id: 'bundesliga', name: 'Bundesliga', country: 'Germany' },
    { id: 'bundesliga-2', name: 'Bundesliga 2', country: 'Germany' },
    { id: 'bundesliga-3', name: 'Bundesliga 3', country: 'Germany' },
    { id: 'bulgarian-first', name: 'Bulgarian First League', country: 'Bulgaria' },
    { id: 'burkinabe-premier', name: 'Burkinabe Premier League', country: 'Burkina Faso' },
    { id: 'burundi-premier', name: 'Burundi Premier League', country: 'Burundi' },

    // C
    { id: 'cambodian-premier', name: 'Cambodian Premier League', country: 'Cambodia' },
    { id: 'cameroon-elite-one', name: 'Cameroon Elite One', country: 'Cameroon' },
    { id: 'canadian-premier', name: 'Canadian Premier League', country: 'Canada' },
    { id: 'cape-verde-premier', name: 'Cape Verdean Premier Division', country: 'Cape Verde' },
    { id: 'caf-champions', name: 'CAF Champions League', country: 'Africa' },
    { id: 'caf-confederation', name: 'CAF Confederation Cup', country: 'Africa' },
    { id: 'central-african-league', name: 'Central African Republic League', country: 'CAR' },
    { id: 'chad-premier', name: 'Chad Premier League', country: 'Chad' },
    { id: 'chilean-primera', name: 'Chilean Primera División', country: 'Chile' },
    { id: 'chinese-super', name: 'Chinese Super League', country: 'China' },
    { id: 'colombian-primera-a', name: 'Categoría Primera A', country: 'Colombia' },
    { id: 'comoros-premier', name: 'Comoros Premier League', country: 'Comoros' },
    { id: 'concacaf-champions', name: 'CONCACAF Champions League', country: 'North America' },
    { id: 'congo-premier', name: 'Congolese Premier League', country: 'Congo' },
    { id: 'costa-rica-primera', name: 'Costa Rican Primera División', country: 'Costa Rica' },
    { id: 'croatian-first', name: 'Croatian First Football League', country: 'Croatia' },
    { id: 'cuban-premier', name: 'Cuban Premier League', country: 'Cuba' },
    { id: 'cypriot-first', name: 'Cypriot First Division', country: 'Cyprus' },
    { id: 'czech-first', name: 'Czech First League', country: 'Czech Republic' },

    // D
    { id: 'danish-super', name: 'Danish Superliga', country: 'Denmark' },
    { id: 'djibouti-premier', name: 'Djibouti Premier League', country: 'Djibouti' },
    { id: 'dominican-primera', name: 'Dominican Primera División', country: 'Dominican Republic' },
    { id: 'dr-congo-super', name: 'DR Congo Super League', country: 'DR Congo' },

    // E
    { id: 'ecuadorian-serie-a', name: 'Ecuadorian Serie A', country: 'Ecuador' },
    { id: 'egyptian-premier', name: 'Egyptian Premier League', country: 'Egypt' },
    { id: 'english-premier', name: 'Premier League', country: 'England' },
    { id: 'english-championship', name: 'EFL Championship', country: 'England' },
    { id: 'english-league-one', name: 'EFL League One', country: 'England' },
    { id: 'english-league-two', name: 'EFL League Two', country: 'England' },
    { id: 'equatorial-guinea-premier', name: 'Equatorial Guinea Premier League', country: 'Equatorial Guinea' },
    { id: 'eritrean-premier', name: 'Eritrean Premier League', country: 'Eritrea' },
    { id: 'estonian-premium', name: 'Estonian Premium Liiga', country: 'Estonia' },
    { id: 'eswatini-premier', name: 'Eswatini Premier League', country: 'Eswatini' },
    { id: 'ethiopian-premier', name: 'Ethiopian Premier League', country: 'Ethiopia' },

    // F
    { id: 'faroe-premier', name: 'Faroe Islands Premier League', country: 'Faroe Islands' },
    { id: 'fijian-premier', name: 'Fijian Premier League', country: 'Fiji' },
    { id: 'finnish-premier', name: 'Finnish Premier League', country: 'Finland' },
    { id: 'french-ligue-1', name: 'Ligue 1', country: 'France' },
    { id: 'french-ligue-2', name: 'Ligue 2', country: 'France' },

    // G
    { id: 'gabonese-premier', name: 'Gabonese Premier League', country: 'Gabon' },
    { id: 'gambian-premier', name: 'Gambian Premier League', country: 'Gambia' },
    { id: 'georgian-premier', name: 'Georgian Premier League', country: 'Georgia' },
    { id: 'german-bundesliga', name: 'Bundesliga', country: 'Germany' },
    { id: 'german-bundesliga-2', name: '2. Bundesliga', country: 'Germany' },
    { id: 'ghanaian-premier', name: 'Ghana Premier League', country: 'Ghana' },
    { id: 'gibraltar-premier', name: 'Gibraltar Premier Division', country: 'Gibraltar' },
    { id: 'greek-super', name: 'Greek Super League', country: 'Greece' },
    { id: 'guatemalan-liga', name: 'Liga Nacional de Guatemala', country: 'Guatemala' },
    { id: 'guinean-premier', name: 'Guinean Premier League', country: 'Guinea' },

    // H
    { id: 'haitian-premier', name: 'Haitian Premier League', country: 'Haiti' },
    { id: 'honduran-liga', name: 'Liga Nacional de Honduras', country: 'Honduras' },
    { id: 'hong-kong-premier', name: 'Hong Kong Premier League', country: 'Hong Kong' },
    { id: 'hungarian-nb-i', name: 'Hungarian NB I', country: 'Hungary' },

    // I
    { id: 'icelandic-premier', name: 'Icelandic Premier League', country: 'Iceland' },
    { id: 'indian-super', name: 'Indian Super League', country: 'India' },
    { id: 'indonesian-liga-1', name: 'Liga 1', country: 'Indonesia' },
    { id: 'iranian-pro', name: 'Persian Gulf Pro League', country: 'Iran' },
    { id: 'iraqi-premier', name: 'Iraqi Premier League', country: 'Iraq' },
    { id: 'irish-premier', name: 'League of Ireland Premier', country: 'Ireland' },
    { id: 'israeli-premier', name: 'Israeli Premier League', country: 'Israel' },
    { id: 'italian-serie-a', name: 'Serie A', country: 'Italy' },
    { id: 'italian-serie-b', name: 'Serie B', country: 'Italy' },
    { id: 'ivory-coast-premier', name: 'Ivory Coast Premier League', country: 'Ivory Coast' },

    // J
    { id: 'jamaican-premier', name: 'Jamaican Premier League', country: 'Jamaica' },
    { id: 'japanese-j1', name: 'J1 League', country: 'Japan' },
    { id: 'japanese-j2', name: 'J2 League', country: 'Japan' },
    { id: 'jordanian-pro', name: 'Jordanian Pro League', country: 'Jordan' },

    // K
    { id: 'kazakh-premier', name: 'Kazakhstan Premier League', country: 'Kazakhstan' },
    { id: 'kenyan-premier', name: 'Kenyan Premier League', country: 'Kenya' },
    { id: 'korean-k-league-1', name: 'K League 1', country: 'South Korea' },
    { id: 'korean-k-league-2', name: 'K League 2', country: 'South Korea' },
    { id: 'kuwaiti-premier', name: 'Kuwait Premier League', country: 'Kuwait' },
    { id: 'kyrgyz-premier', name: 'Kyrgyzstan Premier League', country: 'Kyrgyzstan' },

    // L
    { id: 'laos-premier', name: 'Laos Premier League', country: 'Laos' },
    { id: 'latvian-higher', name: 'Latvian Higher League', country: 'Latvia' },
    { id: 'lebanese-premier', name: 'Lebanese Premier League', country: 'Lebanon' },
    { id: 'lesotho-premier', name: 'Lesotho Premier League', country: 'Lesotho' },
    { id: 'liberian-premier', name: 'Liberian Premier League', country: 'Liberia' },
    { id: 'libyan-premier', name: 'Libyan Premier League', country: 'Libya' },
    { id: 'liechtenstein-cup', name: 'Liechtenstein Cup', country: 'Liechtenstein' },
    { id: 'lithuanian-a-lyga', name: 'A Lyga', country: 'Lithuania' },
    { id: 'luxembourg-national', name: 'Luxembourg National Division', country: 'Luxembourg' },

    // M
    { id: 'macau-premier', name: 'Macau Premier League', country: 'Macau' },
    { id: 'madagascar-premier', name: 'Malagasy Premier League', country: 'Madagascar' },
    { id: 'malawian-super', name: 'Malawian Super League', country: 'Malawi' },
    { id: 'malaysian-super', name: 'Malaysian Super League', country: 'Malaysia' },
    { id: 'maldives-premier', name: 'Maldives Premier League', country: 'Maldives' },
    { id: 'malian-premier', name: 'Malian Premier League', country: 'Mali' },
    { id: 'maltese-premier', name: 'Maltese Premier League', country: 'Malta' },
    { id: 'mauritanian-premier', name: 'Mauritanian Premier League', country: 'Mauritania' },
    { id: 'mauritian-premier', name: 'Mauritian Premier League', country: 'Mauritius' },
    { id: 'mexican-liga-mx', name: 'Liga MX', country: 'Mexico' },
    { id: 'moldovan-national', name: 'Moldovan National Division', country: 'Moldova' },
    { id: 'mongolian-premier', name: 'Mongolian Premier League', country: 'Mongolia' },
    { id: 'montenegrin-first', name: 'Montenegrin First League', country: 'Montenegro' },
    { id: 'moroccan-botola', name: 'Botola Pro', country: 'Morocco' },
    { id: 'mozambican-mocambola', name: 'Moçambola', country: 'Mozambique' },
    { id: 'myanmar-national', name: 'Myanmar National League', country: 'Myanmar' },

    // N
    { id: 'namibian-premier', name: 'Namibia Premier League', country: 'Namibia' },
    { id: 'nepalese-a-division', name: 'Nepalese A-Division League', country: 'Nepal' },
    { id: 'netherlands-eredivisie', name: 'Eredivisie', country: 'Netherlands' },
    { id: 'new-zealand-premiership', name: 'New Zealand Premiership', country: 'New Zealand' },
    { id: 'nicaraguan-primera', name: 'Nicaraguan Primera División', country: 'Nicaragua' },
    { id: 'nigerian-premier', name: 'Nigerian Premier League', country: 'Nigeria' },
    { id: 'north-macedonian-first', name: 'North Macedonia First League', country: 'North Macedonia' },
    { id: 'northern-irish-premiership', name: 'NIFL Premiership', country: 'Northern Ireland' },
    { id: 'norwegian-eliteserien', name: 'Eliteserien', country: 'Norway' },

    // O
    { id: 'omani-professional', name: 'Oman Professional League', country: 'Oman' },

    // P
    { id: 'pakistani-premier', name: 'Pakistan Premier League', country: 'Pakistan' },
    { id: 'palestinian-west-bank', name: 'West Bank Premier League', country: 'Palestine' },
    { id: 'panamanian-liga', name: 'Liga Panameña de Fútbol', country: 'Panama' },
    { id: 'papua-new-guinea-premier', name: 'Papua New Guinea Premier League', country: 'Papua New Guinea' },
    { id: 'paraguayan-primera', name: 'Paraguayan Primera División', country: 'Paraguay' },
    { id: 'peruvian-primera', name: 'Peruvian Primera División', country: 'Peru' },
    { id: 'philippine-premier', name: 'Philippines Football League', country: 'Philippines' },
    { id: 'polish-ekstraklasa', name: 'Ekstraklasa', country: 'Poland' },
    { id: 'portuguese-primeira', name: 'Primeira Liga', country: 'Portugal' },

    // Q
    { id: 'qatar-stars', name: 'Qatar Stars League', country: 'Qatar' },

    // R
    { id: 'romanian-liga-1', name: 'Liga I', country: 'Romania' },
    { id: 'russian-premier', name: 'Russian Premier League', country: 'Russia' },
    { id: 'rwandan-premier', name: 'Rwanda Premier League', country: 'Rwanda' },

    // S
    { id: 'salvadoran-primera', name: 'Salvadoran Primera División', country: 'El Salvador' },
    { id: 'samoan-premier', name: 'Samoa Premier League', country: 'Samoa' },
    { id: 'san-marino-championship', name: 'Campionato Sammarinese', country: 'San Marino' },
    { id: 'saudi-pro', name: 'Saudi Pro League', country: 'Saudi Arabia' },
    { id: 'scottish-premiership', name: 'Scottish Premiership', country: 'Scotland' },
    { id: 'scottish-championship', name: 'Scottish Championship', country: 'Scotland' },
    { id: 'senegalese-premier', name: 'Senegalese Premier League', country: 'Senegal' },
    { id: 'serbian-super', name: 'Serbian SuperLiga', country: 'Serbia' },
    { id: 'seychelles-premier', name: 'Seychelles Premier League', country: 'Seychelles' },
    { id: 'sierra-leone-premier', name: 'Sierra Leone Premier League', country: 'Sierra Leone' },
    { id: 'singapore-premier', name: 'Singapore Premier League', country: 'Singapore' },
    { id: 'sky-bet-championship', name: 'Sky Bet Championship', country: 'England' },
    { id: 'slovak-super', name: 'Slovak Super Liga', country: 'Slovakia' },
    { id: 'slovenian-prvaliga', name: 'Slovenian PrvaLiga', country: 'Slovenia' },
    { id: 'solomon-islands-premier', name: 'Solomon Islands S-League', country: 'Solomon Islands' },
    { id: 'somali-premier', name: 'Somali Premier League', country: 'Somalia' },
    { id: 'south-african-premier', name: 'South African Premier Division', country: 'South Africa' },
    { id: 'south-sudanese-premier', name: 'South Sudan Premier League', country: 'South Sudan' },
    { id: 'spanish-la-liga', name: 'La Liga', country: 'Spain' },
    { id: 'spanish-segunda', name: 'La Liga 2', country: 'Spain' },
    { id: 'spanish-primera-rfef', name: 'Primera RFEF', country: 'Spain' },
    { id: 'sri-lankan-premier', name: 'Sri Lankan Premier League', country: 'Sri Lanka' },
    { id: 'sudanese-premier', name: 'Sudan Premier League', country: 'Sudan' },
    { id: 'surinamese-premier', name: 'SVB Eerste Divisie', country: 'Suriname' },
    { id: 'swedish-allsvenskan', name: 'Allsvenskan', country: 'Sweden' },
    { id: 'swedish-superettan', name: 'Superettan', country: 'Sweden' },
    { id: 'swiss-super', name: 'Swiss Super League', country: 'Switzerland' },
    { id: 'swiss-challenge', name: 'Swiss Challenge League', country: 'Switzerland' },
    { id: 'syrian-premier', name: 'Syrian Premier League', country: 'Syria' },

    // T
    { id: 'tajik-higher', name: 'Tajik Higher League', country: 'Tajikistan' },
    { id: 'tanzanian-premier', name: 'Tanzanian Premier League', country: 'Tanzania' },
    { id: 'thai-league-1', name: 'Thai League 1', country: 'Thailand' },
    { id: 'timor-leste-premier', name: 'Liga Futebol Timor-Leste', country: 'Timor-Leste' },
    { id: 'togolese-premier', name: 'Togolese Premier League', country: 'Togo' },
    { id: 'tongan-premier', name: 'Tonga Major League', country: 'Tonga' },
    { id: 'trinidad-pro', name: 'TT Pro League', country: 'Trinidad and Tobago' },
    { id: 'tunisian-ligue-1', name: 'Tunisian Ligue 1', country: 'Tunisia' },
    { id: 'turkish-super', name: 'Süper Lig', country: 'Turkey' },
    { id: 'turkmenistan-higher', name: 'Ýokary Liga', country: 'Turkmenistan' },

    // U
    { id: 'uae-pro', name: 'UAE Pro-League', country: 'UAE' },
    { id: 'ugandan-premier', name: 'Ugandan Premier League', country: 'Uganda' },
    { id: 'ukrainian-premier', name: 'Ukrainian Premier League', country: 'Ukraine' },
    { id: 'uruguayan-primera', name: 'Uruguayan Primera División', country: 'Uruguay' },
    { id: 'us-mls', name: 'Major League Soccer', country: 'USA' },
    { id: 'uzbek-super', name: 'Uzbekistan Super League', country: 'Uzbekistan' },

    // V
    { id: 'vanuatu-premier', name: 'Vanuatu Premier League', country: 'Vanuatu' },
    { id: 'venezuelan-primera', name: 'Venezuelan Primera División', country: 'Venezuela' },
    { id: 'vietnamese-v-league-1', name: 'V.League 1', country: 'Vietnam' },

    // Y
    { id: 'yemeni-premier', name: 'Yemeni Premier League', country: 'Yemen' },

    // Z
    { id: 'zambian-super', name: 'Zambian Super League', country: 'Zambia' },
    { id: 'zimbabwe-premier', name: 'Zimbabwe Premier Soccer League', country: 'Zimbabwe' },

    // International Competitions
    { id: 'fifa-world-cup', name: 'FIFA World Cup', country: 'International' },
    { id: 'uefa-champions', name: 'UEFA Champions League', country: 'Europe' },
    { id: 'uefa-europa', name: 'UEFA Europa League', country: 'Europe' },
    { id: 'uefa-conference', name: 'UEFA Europa Conference League', country: 'Europe' },
    { id: 'uefa-nations', name: 'UEFA Nations League', country: 'Europe' },
    { id: 'copa-libertadores', name: 'Copa Libertadores', country: 'South America' },
    { id: 'copa-sudamericana', name: 'Copa Sudamericana', country: 'South America' },
  ],

  basketball: [
    // A
    { id: 'acb', name: 'ACB Liga Endesa', country: 'Spain' },

    // B
    { id: 'bbl', name: 'Basketball Bundesliga', country: 'Germany' },
    { id: 'b-league', name: 'B.League', country: 'Japan' },

    // C
    { id: 'cba', name: 'Chinese Basketball Association', country: 'China' },

    // E
    { id: 'euroleague', name: 'EuroLeague', country: 'Europe' },
    { id: 'eurocup', name: 'EuroCup', country: 'Europe' },

    // F
    { id: 'fiba-americas', name: 'FIBA AmeriCup', country: 'Americas' },
    { id: 'fiba-asia', name: 'FIBA Asia Cup', country: 'Asia' },
    { id: 'fiba-euro', name: 'FIBA EuroBasket', country: 'Europe' },
    { id: 'fiba-world-cup', name: 'FIBA World Cup', country: 'International' },

    // G
    { id: 'g-league', name: 'G League', country: 'USA' },
    { id: 'greek-basket', name: 'Greek Basket League', country: 'Greece' },

    // K
    { id: 'kbl', name: 'Korean Basketball League', country: 'South Korea' },

    // L
    { id: 'lega-basket', name: 'Lega Basket Serie A', country: 'Italy' },

    // N
    { id: 'nba', name: 'NBA', country: 'USA' },
    { id: 'nbl', name: 'NBL', country: 'Australia' },
    { id: 'ncaa-d1', name: 'NCAA Division I', country: 'USA' },

    // T
    { id: 'turkish-super', name: 'Turkish Super League', country: 'Turkey' },

    // V
    { id: 'vtb-league', name: 'VTB United League', country: 'Russia' },

    // W
    { id: 'wnba', name: 'WNBA', country: 'USA' },
  ],

  rugby: [
    // C
    { id: 'champions-cup', name: 'Champions Cup', country: 'Europe' },
    { id: 'challenge-cup', name: 'Challenge Cup', country: 'Europe' },
    { id: 'currie-cup', name: 'Currie Cup', country: 'South Africa' },

    // M
    { id: 'mitre-10', name: 'Mitre 10 Cup', country: 'New Zealand' },

    // N
    { id: 'nrc', name: 'National Rugby Championship', country: 'Australia' },
    { id: 'nrl', name: 'National Rugby League', country: 'Australia' },

    // P
    { id: 'premiership-rugby', name: 'Premiership Rugby', country: 'England' },
    { id: 'pro14', name: 'Pro14', country: 'Multiple' },

    // R
    { id: 'rugby-championship', name: 'Rugby Championship', country: 'Multiple' },
    { id: 'rugby-world-cup', name: 'Rugby World Cup', country: 'International' },

    // S
    { id: 'six-nations', name: 'Six Nations Championship', country: 'Europe' },
    { id: 'super-league', name: 'Super League', country: 'England' },
    { id: 'super-rugby', name: 'Super Rugby Pacific', country: 'Multiple' },

    // T
    { id: 'top14', name: 'Top 14', country: 'France' },
  ],

  boxing: [
    // B
    { id: 'bantamweight', name: 'Bantamweight Division', country: 'Global' },

    // C
    { id: 'cruiserweight', name: 'Cruiserweight Division', country: 'Global' },

    // F
    { id: 'featherweight', name: 'Featherweight Division', country: 'Global' },
    { id: 'flyweight', name: 'Flyweight Division', country: 'Global' },

    // H
    { id: 'heavyweight', name: 'Heavyweight Division', country: 'Global' },

    // I
    { id: 'ibf', name: 'International Boxing Federation (IBF)', country: 'Global' },
    { id: 'ibo', name: 'International Boxing Organization (IBO)', country: 'Global' },

    // L
    { id: 'light-heavyweight', name: 'Light Heavyweight Division', country: 'Global' },
    { id: 'lightweight', name: 'Lightweight Division', country: 'Global' },

    // M
    { id: 'middleweight', name: 'Middleweight Division', country: 'Global' },

    // S
    { id: 'super-bantamweight', name: 'Super Bantamweight Division', country: 'Global' },
    { id: 'super-featherweight', name: 'Super Featherweight Division', country: 'Global' },
    { id: 'super-flyweight', name: 'Super Flyweight Division', country: 'Global' },
    { id: 'super-lightweight', name: 'Super Lightweight Division', country: 'Global' },
    { id: 'super-middleweight', name: 'Super Middleweight Division', country: 'Global' },
    { id: 'super-welterweight', name: 'Super Welterweight Division', country: 'Global' },

    // W
    { id: 'wba', name: 'World Boxing Association (WBA)', country: 'Global' },
    { id: 'wbc', name: 'World Boxing Council (WBC)', country: 'Global' },
    { id: 'wbo', name: 'World Boxing Organization (WBO)', country: 'Global' },
    { id: 'welterweight', name: 'Welterweight Division', country: 'Global' },
  ],
};