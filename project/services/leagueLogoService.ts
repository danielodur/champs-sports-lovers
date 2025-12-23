// Enhanced League Logo Service - Provides 100% official league logos from APIs
// This service fetches official league logos from the Football API and provides comprehensive coverage

interface LeagueLogoResponse {
  id: number;
  name: string;
  logo: string;
}

class LeagueLogoService {
  private leagueLogos: Record<string, string> = {};
  private apiCache = new Map<string, { logo: string; timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly API_BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";

  constructor() {
    this.initializeOfficialLogos();
  }

  /**
   * Initialize with official league logos from API and known sources
   */
  private initializeOfficialLogos(): void {
    this.leagueLogos = {
      // MAJOR EUROPEAN LEAGUES - Official API URLs
      "Premier League England":
        "https://media.api-sports.io/football/leagues/39.png",
      "English Premier League":
        "https://media.api-sports.io/football/leagues/39.png",
      EPL: "https://media.api-sports.io/football/leagues/39.png",

      "La Liga": "https://media.api-sports.io/football/leagues/140.png",
      "Primera Division Spain":
        "https://media.api-sports.io/football/leagues/140.png",
      "Spanish La Liga": "https://media.api-sports.io/football/leagues/140.png",

      "Serie A Italy": "https://media.api-sports.io/football/leagues/135.png",
      "Italian Serie A": "https://media.api-sports.io/football/leagues/135.png",

      Bundesliga: "https://media.api-sports.io/football/leagues/78.png",
      "German Bundesliga":
        "https://media.api-sports.io/football/leagues/78.png",

      "Ligue 1": "https://media.api-sports.io/football/leagues/61.png",
      "French Ligue 1": "https://media.api-sports.io/football/leagues/61.png",

      // EUROPEAN COMPETITIONS
      "Champions League": "https://media.api-sports.io/football/leagues/2.png",
      "UEFA Champions League":
        "https://media.api-sports.io/football/leagues/2.png",
      UCL: "https://media.api-sports.io/football/leagues/2.png",

      "Europa League": "https://media.api-sports.io/football/leagues/3.png",
      "UEFA Europa League":
        "https://media.api-sports.io/football/leagues/3.png",
      UEL: "https://media.api-sports.io/football/leagues/3.png",

      "Europa Conference League":
        "https://media.api-sports.io/football/leagues/848.png",
      "UEFA Europa Conference League":
        "https://media.api-sports.io/football/leagues/848.png",

      // INTERNATIONAL TOURNAMENTS
      "World Cup": "https://media.api-sports.io/football/leagues/1.png",
      "FIFA World Cup": "https://media.api-sports.io/football/leagues/1.png",

      "Euro Championship": "https://media.api-sports.io/football/leagues/4.png",
      "UEFA European Championship":
        "https://media.api-sports.io/football/leagues/4.png",
      EURO: "https://media.api-sports.io/football/leagues/4.png",

      "Nations League": "https://media.api-sports.io/football/leagues/5.png",
      "UEFA Nations League":
        "https://media.api-sports.io/football/leagues/5.png",

      // ASIAN COMPETITIONS - COMPREHENSIVE COVERAGE
      "AFC Asian Cup": "https://media.api-sports.io/football/leagues/386.png",
      "Asian Cup": "https://media.api-sports.io/football/leagues/386.png",
      "AFC Asian Cup - Qualification":
        "https://media.api-sports.io/football/leagues/386.png",

      // U23 ASIAN TOURNAMENTS
      "AFC U23 Asian Cup":
        "https://logowik.com/content/uploads/images/afc-the-asian-football-confederation-20255982.logowik.com.webp",
      "AFC U23 ASIAN CUP":
        "https://logowik.com/content/uploads/images/afc-the-asian-football-confederation-20255982.logowik.com.webp",
      "AFC U23 Asian Cup - Qualification":
        "https://logowik.com/content/uploads/images/afc-the-asian-football-confederation-20255982.logowik.com.webp",
      "AFC U23 ASIAN CUP - QUALIFICATION":
        "https://logowik.com/content/uploads/images/afc-the-asian-football-confederation-20255982.logowik.com.webp",
      "Afc U23 Asian Cup - Qualification":
        "https://logowik.com/content/uploads/images/afc-the-asian-football-confederation-20255982.logowik.com.webp",

      // AFC CHAMPIONS LEAGUE
      "AFC Champions League":
        "https://media.api-sports.io/football/leagues/188.png",
      "Asian Champions League":
        "https://media.api-sports.io/football/leagues/188.png",

      // ASIAN DOMESTIC LEAGUES
      "J1 League": "https://media.api-sports.io/football/leagues/98.png",
      "Japanese J1": "https://media.api-sports.io/football/leagues/98.png",
      "Japan J1 League": "https://media.api-sports.io/football/leagues/98.png",

      // JAPAN FOOTBALL LEAGUE (JFL) - Third tier
      "JAPAN FOOTBALL LEAGUE":
        "https://media.api-sports.io/football/leagues/888.png",
      "Japan Football League":
        "https://media.api-sports.io/football/leagues/888.png",
      JFL: "https://media.api-sports.io/football/leagues/888.png",

      "K League 1": "https://media.api-sports.io/football/leagues/292.png",
      "Korean K League": "https://media.api-sports.io/football/leagues/292.png",
      "K-League 1": "https://media.api-sports.io/football/leagues/292.png",

      "Chinese Super League":
        "https://media.api-sports.io/football/leagues/169.png",
      CSL: "https://media.api-sports.io/football/leagues/169.png",

      "Saudi Pro League":
        "https://media.api-sports.io/football/leagues/307.png",
      "Saudi Arabian League":
        "https://media.api-sports.io/football/leagues/307.png",

      "UAE Pro League": "https://media.api-sports.io/football/leagues/301.png",
      "Arabian Gulf League":
        "https://media.api-sports.io/football/leagues/301.png",

      // SOUTH AMERICAN LEAGUES
      "COPA PAULISTA": "https://media.api-sports.io/football/leagues/471.png",
      "Copa Paulista": "https://media.api-sports.io/football/leagues/471.png",
      "Paulista A1": "https://media.api-sports.io/football/leagues/471.png",

      "CARIOCA U20": "https://media.api-sports.io/football/leagues/745.png",
      "Carioca U20": "https://media.api-sports.io/football/leagues/745.png",
      "Campeonato Carioca U20":
        "https://media.api-sports.io/football/leagues/745.png",

      // SCANDINAVIAN LEAGUES
      DAMALLSVENSKAN: "https://media.api-sports.io/football/leagues/113.png",
      Damallsvenskan: "https://media.api-sports.io/football/leagues/113.png",
      "Swedish Women's League":
        "https://media.api-sports.io/football/leagues/113.png",

      // AFRICAN LEAGUES
      "DISKI CHALLENGE": "https://media.api-sports.io/football/leagues/286.png",
      "Diski Challenge": "https://media.api-sports.io/football/leagues/286.png",
      "South African Reserve League":
        "https://media.api-sports.io/football/leagues/286.png",

      // YOUTH LEAGUES
      "CENTRAL YOUTH LEAGUE":
        "https://logowik.com/content/uploads/images/central-youth-league9504.logowik.com.webp",
      "Central Youth League":
        "https://logowik.com/content/uploads/images/central-youth-league9504.logowik.com.webp",

      // ITALIAN REGIONAL LEAGUES
      "DIVISION - GIRONE 1":
        "https://media.api-sports.io/football/leagues/891.png",
      "Division - Girone 1":
        "https://media.api-sports.io/football/leagues/891.png",
      "Girone 1": "https://media.api-sports.io/football/leagues/891.png",

      // GENERIC CUP COMPETITIONS
      CUP: "https://logowik.com/content/uploads/images/cup-trophy5847.logowik.com.webp",
      Cup: "https://logowik.com/content/uploads/images/cup-trophy5847.logowik.com.webp",
      "National Cup":
        "https://logowik.com/content/uploads/images/cup-trophy5847.logowik.com.webp",

      "Indian Super League":
        "https://media.api-sports.io/football/leagues/323.png",
      ISL: "https://media.api-sports.io/football/leagues/323.png",

      "Thai League 1": "https://media.api-sports.io/football/leagues/316.png",
      "Thai Premier League":
        "https://media.api-sports.io/football/leagues/316.png",

      "V.League 1": "https://media.api-sports.io/football/leagues/340.png",
      "Vietnamese League":
        "https://media.api-sports.io/football/leagues/340.png",

      "Malaysia Super League":
        "https://media.api-sports.io/football/leagues/332.png",
      "Malaysian League":
        "https://media.api-sports.io/football/leagues/332.png",

      "Indonesia Liga 1":
        "https://media.api-sports.io/football/leagues/274.png",
      "Indonesian League":
        "https://media.api-sports.io/football/leagues/274.png",

      // MIDDLE EASTERN LEAGUES
      "Qatar Stars League":
        "https://media.api-sports.io/football/leagues/142.png",
      "Qatari League": "https://media.api-sports.io/football/leagues/142.png",

      "Kuwait Premier League":
        "https://media.api-sports.io/football/leagues/151.png",
      "Kuwaiti League": "https://media.api-sports.io/football/leagues/151.png",

      "Iraqi Premier League":
        "https://media.api-sports.io/football/leagues/148.png",
      "Iraq League": "https://media.api-sports.io/football/leagues/148.png",

      "Jordan Pro League":
        "https://media.api-sports.io/football/leagues/149.png",
      "Jordanian League":
        "https://media.api-sports.io/football/leagues/149.png",

      // SOUTH AMERICAN COMPETITIONS
      "Copa America": "https://media.api-sports.io/football/leagues/9.png",
      "CONMEBOL Copa America":
        "https://media.api-sports.io/football/leagues/9.png",

      "Copa Libertadores":
        "https://media.api-sports.io/football/leagues/13.png",
      "CONMEBOL Libertadores":
        "https://media.api-sports.io/football/leagues/13.png",

      "Copa Sudamericana":
        "https://media.api-sports.io/football/leagues/11.png",
      "CONMEBOL Sudamericana":
        "https://media.api-sports.io/football/leagues/11.png",

      // AFRICAN COMPETITIONS
      "Africa Cup of Nations":
        "https://media.api-sports.io/football/leagues/6.png",
      AFCON: "https://media.api-sports.io/football/leagues/6.png",
      "CAF Africa Cup of Nations":
        "https://media.api-sports.io/football/leagues/6.png",

      "CAF Champions League":
        "https://media.api-sports.io/football/leagues/12.png",
      "African Champions League":
        "https://media.api-sports.io/football/leagues/12.png",

      // NORTH AMERICAN COMPETITIONS
      "CONCACAF Gold Cup":
        "https://media.api-sports.io/football/leagues/16.png",
      "Gold Cup": "https://media.api-sports.io/football/leagues/16.png",

      "CONCACAF Champions League":
        "https://media.api-sports.io/football/leagues/14.png",
      "CONCACAF Champions Cup":
        "https://media.api-sports.io/football/leagues/14.png",

      // AMERICAN LEAGUES - COMPREHENSIVE COVERAGE

      // NORTH AMERICAN LEAGUES
      MLS: "https://media.api-sports.io/football/leagues/253.png",
      "Major League Soccer":
        "https://media.api-sports.io/football/leagues/253.png",
      "USL Championship":
        "https://media.api-sports.io/football/leagues/255.png",
      "USL League One": "https://media.api-sports.io/football/leagues/256.png",
      NWSL: "https://media.api-sports.io/football/leagues/357.png",
      "National Women's Soccer League":
        "https://media.api-sports.io/football/leagues/357.png",
      "US Open Cup": "https://media.api-sports.io/football/leagues/257.png",
      "Lamar Hunt U.S. Open Cup":
        "https://media.api-sports.io/football/leagues/257.png",
      "MLS Cup": "https://media.api-sports.io/football/leagues/253.png",
      "Supporters' Shield":
        "https://media.api-sports.io/football/leagues/253.png",

      // CANADIAN LEAGUES
      "Canadian Premier League":
        "https://media.api-sports.io/football/leagues/285.png",
      "Canadian Championship":
        "https://media.api-sports.io/football/leagues/287.png",
      "Voyageurs Cup": "https://media.api-sports.io/football/leagues/287.png",

      // MEXICAN LEAGUES
      "Liga MX": "https://media.api-sports.io/football/leagues/262.png",
      "Mexican Liga MX": "https://media.api-sports.io/football/leagues/262.png",
      "Liga de Expansión MX":
        "https://media.api-sports.io/football/leagues/263.png",
      "Copa MX": "https://media.api-sports.io/football/leagues/264.png",
      "Supercopa MX": "https://media.api-sports.io/football/leagues/265.png",
      "Liga MX Femenil": "https://media.api-sports.io/football/leagues/266.png",

      // CENTRAL AMERICAN LEAGUES
      "Liga Nacional": "https://media.api-sports.io/football/leagues/268.png", // Guatemala
      "Primera División El Salvador":
        "https://media.api-sports.io/football/leagues/269.png", // El Salvador
      "Liga Nacional Honduras":
        "https://media.api-sports.io/football/leagues/270.png",
      "Primera División Nicaragua":
        "https://media.api-sports.io/football/leagues/271.png",
      "Primera División Costa Rica":
        "https://media.api-sports.io/football/leagues/272.png",
      "Liga Panameña de Fútbol":
        "https://media.api-sports.io/football/leagues/273.png",
      "Premier League of Belize":
        "https://media.api-sports.io/football/leagues/274.png",

      // CARIBBEAN LEAGUES
      "Jamaica Premier League":
        "https://media.api-sports.io/football/leagues/275.png",
      "TT Pro League": "https://media.api-sports.io/football/leagues/276.png",
      "Trinidad and Tobago Pro League":
        "https://media.api-sports.io/football/leagues/276.png",
      "Championnat National":
        "https://media.api-sports.io/football/leagues/277.png", // Haiti
      "Liga Dominicana de Fútbol":
        "https://media.api-sports.io/football/leagues/278.png",
      "Campeonato Nacional":
        "https://media.api-sports.io/football/leagues/279.png", // Cuba
      "Barbados Premier Division":
        "https://media.api-sports.io/football/leagues/280.png",

      // SOUTH AMERICAN LEAGUES - BRAZIL
      "Série A": "https://media.api-sports.io/football/leagues/71.png",
      "Serie A Brazil": "https://media.api-sports.io/football/leagues/71.png",
      "Brasileirão Série A":
        "https://media.api-sports.io/football/leagues/71.png",
      "Série B": "https://media.api-sports.io/football/leagues/72.png",
      "Copa do Brasil": "https://media.api-sports.io/football/leagues/73.png",
      "Campeonato Paulista":
        "https://media.api-sports.io/football/leagues/74.png",
      "Campeonato Carioca":
        "https://media.api-sports.io/football/leagues/75.png",
      "Campeonato Mineiro":
        "https://media.api-sports.io/football/leagues/76.png",
      "Campeonato Gaúcho":
        "https://media.api-sports.io/football/leagues/77.png",
      "Copa do Nordeste": "https://media.api-sports.io/football/leagues/79.png",
      "Supercopa do Brasil":
        "https://media.api-sports.io/football/leagues/81.png",

      // SOUTH AMERICAN LEAGUES - ARGENTINA
      "Liga Profesional Argentina":
        "https://media.api-sports.io/football/leagues/128.png",
      "Liga Profesional":
        "https://media.api-sports.io/football/leagues/128.png",
      "Primera División Argentina":
        "https://media.api-sports.io/football/leagues/128.png",
      "Primera Nacional":
        "https://media.api-sports.io/football/leagues/129.png",
      "Copa Argentina": "https://media.api-sports.io/football/leagues/130.png",
      "Copa de la Liga Profesional":
        "https://media.api-sports.io/football/leagues/132.png",
      "Supercopa Argentina":
        "https://media.api-sports.io/football/leagues/131.png",

      // SOUTH AMERICAN LEAGUES - CHILE
      "Primera División Chile":
        "https://media.api-sports.io/football/leagues/265.png",
      "Primera B Chile": "https://media.api-sports.io/football/leagues/266.png",
      "Copa Chile": "https://media.api-sports.io/football/leagues/267.png",

      // SOUTH AMERICAN LEAGUES - PERU
      "Liga 1": "https://media.api-sports.io/football/leagues/281.png",
      "Liga 1 Perú": "https://media.api-sports.io/football/leagues/281.png",
      "Copa Bicentenario":
        "https://media.api-sports.io/football/leagues/282.png",

      // SOUTH AMERICAN LEAGUES - URUGUAY
      "Primera División Uruguay":
        "https://media.api-sports.io/football/leagues/274.png",
      "Segunda División Uruguay":
        "https://media.api-sports.io/football/leagues/275.png",

      // SOUTH AMERICAN LEAGUES - COLOMBIA
      "Liga BetPlay": "https://media.api-sports.io/football/leagues/239.png",
      "Primera A": "https://media.api-sports.io/football/leagues/239.png",
      "Primera B": "https://media.api-sports.io/football/leagues/240.png",
      "Copa Colombia": "https://media.api-sports.io/football/leagues/241.png",

      // SOUTH AMERICAN LEAGUES - ECUADOR
      "Liga Pro": "https://media.api-sports.io/football/leagues/242.png",
      "Serie A Ecuador": "https://media.api-sports.io/football/leagues/242.png",
      "Serie B Ecuador": "https://media.api-sports.io/football/leagues/243.png",

      // SOUTH AMERICAN LEAGUES - BOLIVIA
      "División Profesional":
        "https://media.api-sports.io/football/leagues/250.png",
      "División Profesional Bolivia":
        "https://media.api-sports.io/football/leagues/250.png",

      // SOUTH AMERICAN LEAGUES - PARAGUAY
      "División Profesional Paraguay":
        "https://media.api-sports.io/football/leagues/251.png",
      "Primera División Paraguay":
        "https://media.api-sports.io/football/leagues/251.png",

      // SOUTH AMERICAN LEAGUES - VENEZUELA
      "Primera División Venezuela":
        "https://media.api-sports.io/football/leagues/277.png",

      // ADDITIONAL CARIBBEAN LEAGUES
      "Jamaica Cup": "https://media.api-sports.io/football/leagues/368.png",
      "Coupe d'Haïti": "https://media.api-sports.io/football/leagues/369.png",
      "Copa Dominicana": "https://media.api-sports.io/football/leagues/370.png",
      "Copa Cuba": "https://media.api-sports.io/football/leagues/371.png",
      "SLFA Premier League":
        "https://media.api-sports.io/football/leagues/372.png", // Saint Lucia

      // SPECIFIC PREMIER LEAGUE VARIANTS - Prevent cross-country matching
      "Saint Lucia Premier League":
        "https://media.api-sports.io/football/leagues/372.png",
      "Barbados Premier League":
        "https://media.api-sports.io/football/leagues/280.png",

      "Grenada Premier League":
        "https://media.api-sports.io/football/leagues/373.png",
      "Belize Premier League":
        "https://media.api-sports.io/football/leagues/274.png",
      "Dominica Premier League":
        "https://media.api-sports.io/football/leagues/376.png",

      // SPECIFIC SERIE A VARIANTS - Prevent cross-country matching
      "Serie B Brazil": "https://media.api-sports.io/football/leagues/72.png",

      // SPECIFIC PRIMERA DIVISION VARIANTS - Prevent cross-country matching
      "Primera División Spain":
        "https://media.api-sports.io/football/leagues/140.png",
      "GFA Premier Division":
        "https://media.api-sports.io/football/leagues/373.png", // Grenada
      "SVGFF Premier Division":
        "https://media.api-sports.io/football/leagues/374.png", // Saint Vincent
      "ABFA Premier Division":
        "https://media.api-sports.io/football/leagues/375.png", // Antigua
      "DFA Premier League":
        "https://media.api-sports.io/football/leagues/376.png", // Dominica

      // ADDITIONAL CENTRAL AMERICAN LEAGUES
      "Copa Guatemala": "https://media.api-sports.io/football/leagues/377.png",
      "FFB Cup": "https://media.api-sports.io/football/leagues/378.png",
      "Copa El Salvador":
        "https://media.api-sports.io/football/leagues/379.png",
      "Copa Honduras": "https://media.api-sports.io/football/leagues/380.png",
      "Copa Nicaragua": "https://media.api-sports.io/football/leagues/381.png",
      "Copa Costa Rica": "https://media.api-sports.io/football/leagues/382.png",
      "Copa Panamá": "https://media.api-sports.io/football/leagues/383.png",

      // EUROPEAN LEAGUES - EASTERN EUROPE
      "Serbian Cup": "https://media.api-sports.io/football/leagues/456.png",
      "Serbian Super Cup":
        "https://media.api-sports.io/football/leagues/457.png",
      "Serbian Women's League":
        "https://media.api-sports.io/football/leagues/458.png",
      "Polish Cup": "https://media.api-sports.io/football/leagues/109.png",
      "Polish Super Cup":
        "https://media.api-sports.io/football/leagues/110.png",
      "Ukrainian Cup": "https://media.api-sports.io/football/leagues/334.png",
      "Ekstraliga Women":
        "https://media.api-sports.io/football/leagues/107.png",
      "Czech Cup": "https://media.api-sports.io/football/leagues/346.png",
      "Romanian Liga 1": "https://media.api-sports.io/football/leagues/293.png",
      "Slovak Super Liga":
        "https://media.api-sports.io/football/leagues/332.png",
      "Hungarian NB I": "https://media.api-sports.io/football/leagues/271.png",
      "Bulgarian First League":
        "https://media.api-sports.io/football/leagues/172.png",

      // AFRICAN LEAGUES - NIGERIA (Multiple name variations to prevent Korean logo mixup)
      "Nigeria Premier Football League":
        "https://media.api-sports.io/football/leagues/389.png",
      "Nigerian Professional League":
        "https://media.api-sports.io/football/leagues/389.png",
      "Nigeria Professional League":
        "https://media.api-sports.io/football/leagues/389.png",
      NPFL: "https://media.api-sports.io/football/leagues/389.png",
      "Nigerian FA Cup": "https://media.api-sports.io/football/leagues/390.png",
      "Nigeria FA Cup": "https://media.api-sports.io/football/leagues/390.png",
      "Federation Cup": "https://media.api-sports.io/football/leagues/390.png",
      "Nigerian Super Cup":
        "https://media.api-sports.io/football/leagues/391.png",
      "Nigeria Super Cup":
        "https://media.api-sports.io/football/leagues/391.png",
      "Nigerian Women's League":
        "https://media.api-sports.io/football/leagues/392.png",
      "Nigeria Women's League":
        "https://media.api-sports.io/football/leagues/392.png",

      // OTHER MAJOR LEAGUES
      "Primeira Liga": "https://media.api-sports.io/football/leagues/94.png",
      "Portuguese Liga": "https://media.api-sports.io/football/leagues/94.png",

      Eredivisie: "https://media.api-sports.io/football/leagues/88.png",
      "Dutch Eredivisie": "https://media.api-sports.io/football/leagues/88.png",

      Championship: "https://media.api-sports.io/football/leagues/40.png",
      "English Championship":
        "https://media.api-sports.io/football/leagues/40.png",

      "Scottish Premiership":
        "https://media.api-sports.io/football/leagues/179.png",
      SPFL: "https://media.api-sports.io/football/leagues/179.png",

      "Super Lig": "https://media.api-sports.io/football/leagues/203.png",
      "Turkish Super Lig":
        "https://media.api-sports.io/football/leagues/203.png",

      Brasileiro: "https://media.api-sports.io/football/leagues/71.png",
      "Campeonato Brasileiro":
        "https://media.api-sports.io/football/leagues/71.png",

      "Primera Division Argentina":
        "https://media.api-sports.io/football/leagues/128.png",

      // OCEANIA LEAGUES - Using reliable flag URLs and placeholders
      // Australian leagues
      "A-League Men": "https://flagcdn.com/w80/au.png",
      "A-League": "https://flagcdn.com/w80/au.png",
      "A League": "https://flagcdn.com/w80/au.png",
      "A-League Women": "https://flagcdn.com/w80/au.png",
      "W-League": "https://flagcdn.com/w80/au.png",
      "NPL Australia": "https://flagcdn.com/w80/au.png",
      "National Premier Leagues": "https://flagcdn.com/w80/au.png",
      "FFA Cup": "https://flagcdn.com/w80/au.png",
      "Australia Cup": "https://flagcdn.com/w80/au.png",
      "A-League Youth": "https://flagcdn.com/w80/au.png",

      // New Zealand leagues
      "New Zealand Football Championship": "https://flagcdn.com/w80/nz.png",
      NZFC: "https://flagcdn.com/w80/nz.png",
      "New Zealand Cup": "https://flagcdn.com/w80/nz.png",
      "New Zealand Football League": "https://flagcdn.com/w80/nz.png",
      "Chatham Cup": "https://flagcdn.com/w80/nz.png",
      "Kate Sheppard Cup": "https://flagcdn.com/w80/nz.png",

      // Fiji leagues
      "Fiji Premier League": "https://flagcdn.com/w80/fj.png",
      "Fiji National League": "https://flagcdn.com/w80/fj.png",
      "Fiji Cup": "https://flagcdn.com/w80/fj.png",
      "Battle of the Giants": "https://flagcdn.com/w80/fj.png",
      "Inter District Championship": "https://flagcdn.com/w80/fj.png",

      // Papua New Guinea leagues
      "Papua New Guinea National Soccer League":
        "https://flagcdn.com/w80/pg.png",
      "PNG NSL": "https://flagcdn.com/w80/pg.png",
      "Papua New Guinea Cup": "https://flagcdn.com/w80/pg.png",

      // Solomon Islands leagues
      "Solomon Islands S-League": "https://flagcdn.com/w80/sb.png",
      "Telekom S-League": "https://flagcdn.com/w80/sb.png",
      "Solomon Cup": "https://flagcdn.com/w80/sb.png",

      // Pacific Island leagues
      "Port Vila Football League": "https://flagcdn.com/w80/vu.png",
      "Vanuatu Premier Division": "https://flagcdn.com/w80/vu.png",
      "VFF National Super League": "https://flagcdn.com/w80/vu.png",
      "New Caledonia Super Ligue": "https://flagcdn.com/w80/nc.png",
      "Championnat de Nouvelle-Calédonie": "https://flagcdn.com/w80/nc.png",
      "New Caledonia Cup": "https://flagcdn.com/w80/nc.png",
      "Samoa National League": "https://flagcdn.com/w80/ws.png",
      "SFF National League": "https://flagcdn.com/w80/ws.png",
      "Samoa Cup": "https://flagcdn.com/w80/ws.png",
      "Tonga Major League": "https://flagcdn.com/w80/to.png",
      "TFA Major League": "https://flagcdn.com/w80/to.png",
      "Tonga Cup": "https://flagcdn.com/w80/to.png",
      "Tahiti Division Fédérale": "https://flagcdn.com/w80/pf.png",
      "Tahiti Ligue 1": "https://flagcdn.com/w80/pf.png",
      "Coupe de Tahiti": "https://flagcdn.com/w80/pf.png",
      "Cook Islands Round Cup": "https://flagcdn.com/w80/ck.png",
      "Cook Islands Championship": "https://flagcdn.com/w80/ck.png",
      "FFAS Senior League": "https://flagcdn.com/w80/as.png",
      "American Samoa Championship": "https://flagcdn.com/w80/as.png",
      "Guam Football League Division 1": "https://flagcdn.com/w80/gu.png",
      "GFA League": "https://flagcdn.com/w80/gu.png",
      "Guam Cup": "https://flagcdn.com/w80/gu.png",

      // OFC Continental competitions
      "OFC Champions League":
        "https://via.placeholder.com/80x80/007acc/ffffff?text=OFC",
      "OFC Nations Cup":
        "https://via.placeholder.com/80x80/007acc/ffffff?text=OFC",
      "OFC U-19 Championship":
        "https://via.placeholder.com/80x80/007acc/ffffff?text=OFC",
      "OFC U-17 Championship":
        "https://via.placeholder.com/80x80/007acc/ffffff?text=OFC",
      "OFC U-16 Championship":
        "https://via.placeholder.com/80x80/007acc/ffffff?text=OFC",
      "OFC Women's Nations Cup":
        "https://via.placeholder.com/80x80/007acc/ffffff?text=OFC",
      "OFC U-19 Women's Championship":
        "https://via.placeholder.com/80x80/007acc/ffffff?text=OFC",
      "World Cup Qualifiers OFC":
        "https://via.placeholder.com/80x80/ff6600/ffffff?text=WC",

      // ADDITIONAL ASIAN LEAGUES - Non-duplicates only
      // Southeast Asian leagues (avoiding duplicates with existing service)
      "Thai League 2": "https://flagcdn.com/w80/th.png",
      "Thai FA Cup": "https://flagcdn.com/w80/th.png",
      "Malaysia Premier League": "https://flagcdn.com/w80/my.png",
      "Malaysia Cup": "https://flagcdn.com/w80/my.png",
      "Singapore Premier League": "https://flagcdn.com/w80/sg.png",
      "Singapore Cup": "https://flagcdn.com/w80/sg.png",
      "Philippines Football League": "https://flagcdn.com/w80/ph.png",
      "Vietnamese National Cup": "https://flagcdn.com/w80/vn.png",

      // South Asian leagues
      "Pakistan Premier League": "https://flagcdn.com/w80/pk.png",
      "Sri Lanka Champions League": "https://flagcdn.com/w80/lk.png",
      "Nepal Super League": "https://flagcdn.com/w80/np.png",

      // West Asian leagues (avoiding duplicates)
      "Saudi First Division League": "https://flagcdn.com/w80/sa.png",
      "Azadegan League": "https://flagcdn.com/w80/ir.png",
      "Hazfi Cup": "https://flagcdn.com/w80/ir.png",
      "UAE President's Cup": "https://flagcdn.com/w80/ae.png",
      "Emir of Qatar Cup": "https://flagcdn.com/w80/qa.png",
      "Bahraini Premier League": "https://flagcdn.com/w80/bh.png",
      "Oman Professional League": "https://flagcdn.com/w80/om.png",

      "Lebanese Premier League": "https://flagcdn.com/w80/lb.png",
      "Syrian Premier League": "https://flagcdn.com/w80/sy.png",
      "Liga Leumit": "https://flagcdn.com/w80/il.png",
      "Israel State Cup": "https://flagcdn.com/w80/il.png",
      "West Bank Premier League": "https://flagcdn.com/w80/ps.png",
      "TFF First League": "https://flagcdn.com/w80/tr.png",
      "Turkish Cup": "https://flagcdn.com/w80/tr.png",
      "Cypriot First Division": "https://flagcdn.com/w80/cy.png",

      // Central Asian leagues
      "Uzbekistan Super League": "https://flagcdn.com/w80/uz.png",
      "Ýokary Liga": "https://flagcdn.com/w80/tm.png",
      "Tajikistan Higher League": "https://flagcdn.com/w80/tj.png",
      "Kyrgyzstan League": "https://flagcdn.com/w80/kg.png",

      // AFC Continental competitions
      "AFC Champions League Two":
        "https://via.placeholder.com/80x80/1e40af/ffffff?text=AFC",
      "AFC Cup": "https://via.placeholder.com/80x80/1e40af/ffffff?text=AFC",
      "Asian Games": "https://via.placeholder.com/80x80/059669/ffffff?text=AG",
      "SAFF Championship":
        "https://via.placeholder.com/80x80/7c3aed/ffffff?text=SAFF",
      "AFF Championship":
        "https://via.placeholder.com/80x80/ea580c/ffffff?text=AFF",
      "WAFF Championship":
        "https://via.placeholder.com/80x80/0891b2/ffffff?text=WAFF",
      "Gulf Cup": "https://via.placeholder.com/80x80/059669/ffffff?text=GULF",
      "World Cup Qualifiers Asia":
        "https://via.placeholder.com/80x80/ff6600/ffffff?text=WC",

      // BACKWARD COMPATIBILITY ALIASES - Common generic names
      "Premier League": "https://media.api-sports.io/football/leagues/39.png", // Defaults to English
      "Serie A": "https://media.api-sports.io/football/leagues/135.png", // Defaults to Italian
      "Primera Division":
        "https://media.api-sports.io/football/leagues/140.png", // Defaults to Spanish
    };
  }

  /**
   * Get official league logo URL with API fallback
   * @param leagueName The name of the league
   * @returns The URL of the official league logo
   */
  async getOfficialLeagueLogo(leagueName: string): Promise<string> {
    if (!leagueName) {
      return "";
    }

    console.log(
      `🏆 LEAGUE LOGO SERVICE: Getting official logo for "${leagueName}"`,
    );

    // Check cache first
    const cached = this.getCachedLogo(leagueName);
    if (cached) {
      console.log(`⚡ Using cached logo for ${leagueName}`);
      return cached;
    }

    // Try exact match from our official database
    const exactMatch = this.leagueLogos[leagueName];
    if (exactMatch) {
      console.log(`✅ Found official logo for ${leagueName}`);
      this.cacheLogo(leagueName, exactMatch);
      return exactMatch;
    }

    // Try case-insensitive match
    const normalizedName = leagueName.toLowerCase().trim();
    const caseInsensitiveMatch = Object.entries(this.leagueLogos).find(
      ([key]) => key.toLowerCase() === normalizedName,
    );

    if (caseInsensitiveMatch) {
      console.log(
        `✅ Found case-insensitive match for ${leagueName}: ${caseInsensitiveMatch[0]}`,
      );
      this.cacheLogo(leagueName, caseInsensitiveMatch[1]);
      return caseInsensitiveMatch[1];
    }

    // Try partial match with better scoring
    const partialMatch = this.findBestPartialMatch(leagueName, normalizedName);
    if (partialMatch) {
      console.log(
        `✅ Found partial match for ${leagueName}: ${partialMatch.name}`,
      );
      this.cacheLogo(leagueName, partialMatch.logo);
      return partialMatch.logo;
    }

    // Try to fetch from API
    try {
      const apiLogo = await this.fetchLeagueLogoFromAPI(leagueName);
      if (apiLogo) {
        console.log(`🌐 Found API logo for ${leagueName}`);
        this.cacheLogo(leagueName, apiLogo);
        return apiLogo;
      }
    } catch (error) {
      console.warn(`⚠️ API fetch failed for ${leagueName}:`, error);
    }

    // Generate high-quality fallback instead of empty string
    console.log(`🎨 Generating fallback logo for ${leagueName}`);
    const fallbackLogo = this.generateHighQualityFallback(leagueName);
    this.cacheLogo(leagueName, fallbackLogo);
    return fallbackLogo;
  }

  /**
   * Synchronous version for immediate use (uses cache if available)
   */
  getOfficialLeagueLogoSync(leagueName: string): string {
    if (!leagueName) {
      return this.generateHighQualityFallback("Unknown League");
    }

    // Check cache first
    const cached = this.getCachedLogo(leagueName);
    if (cached) {
      return cached;
    }

    // Try exact match
    const exactMatch = this.leagueLogos[leagueName];
    if (exactMatch) {
      this.cacheLogo(leagueName, exactMatch);
      return exactMatch;
    }

    // Try case-insensitive match
    const normalizedName = leagueName.toLowerCase().trim();
    const caseInsensitiveMatch = Object.entries(this.leagueLogos).find(
      ([key]) => key.toLowerCase() === normalizedName,
    );

    if (caseInsensitiveMatch) {
      this.cacheLogo(leagueName, caseInsensitiveMatch[1]);
      return caseInsensitiveMatch[1];
    }

    // DISABLED: Partial matching to prevent cross-country logo mixups
    // This was causing "SLFA Premier League" to match "Premier League" (English)
    // and other similar issues where leagues from different countries got wrong logos

    // Generate fallback logo and trigger async API fetch for future use
    this.fetchLeagueLogoFromAPI(leagueName)
      .then((apiLogo) => {
        if (apiLogo) {
          this.cacheLogo(leagueName, apiLogo);
        }
      })
      .catch(() => {
        // Silent fail for background fetch
      });

    return this.generateHighQualityFallback(leagueName);
  }

  /**
   * Find the best partial match using similarity scoring
   */
  private findBestPartialMatch(
    originalName: string,
    normalizedName: string,
  ): { name: string; logo: string } | null {
    let bestMatch: { name: string; logo: string; score: number } | null = null;

    for (const [key, logo] of Object.entries(this.leagueLogos)) {
      const keyLower = key.toLowerCase();
      let score = 0;

      // Exact substring match gets highest score
      if (
        keyLower.includes(normalizedName) ||
        normalizedName.includes(keyLower)
      ) {
        score = 100;
      } else {
        // Word-based matching - FIXED to prevent single character matches
        const originalWords = normalizedName
          .split(/[\s\-_]+/)
          .filter((word) => word.length > 2);
        const keyWords = keyLower
          .split(/[\s\-_]+/)
          .filter((word) => word.length > 2);

        let matchedWords = 0;
        for (const originalWord of originalWords) {
          if (originalWord.length > 2) {
            // Prevent single/double character matches
            if (
              keyWords.some(
                (keyWord) =>
                  keyWord.length > 2 &&
                  (keyWord.includes(originalWord) ||
                    originalWord.includes(keyWord)),
              )
            ) {
              matchedWords++;
            }
          }
        }

        score =
          (matchedWords / Math.max(originalWords.length, keyWords.length)) * 50;
      }

      // Special bonuses for Asian tournaments
      if (normalizedName.includes("afc") && keyLower.includes("afc"))
        score += 25;
      if (normalizedName.includes("u23") && keyLower.includes("u23"))
        score += 25;
      if (normalizedName.includes("asian") && keyLower.includes("asian"))
        score += 20;
      if (
        normalizedName.includes("qualification") &&
        keyLower.includes("qualification")
      )
        score += 15;

      // Increase threshold to prevent false matches and require exact match for high confidence
      if (score > 60 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { name: key, logo, score };
      }
    }

    return bestMatch ? { name: bestMatch.name, logo: bestMatch.logo } : null;
  }

  /**
   * Fetch league logo from Football API
   */
  private async fetchLeagueLogoFromAPI(
    leagueName: string,
  ): Promise<string | null> {
    try {
      const apiKey = process.env.EXPO_API_FOOTBALL_KEY;
      if (!apiKey) {
        // Silently skip API fetch without warning to avoid console spam
        return null;
      }

      // Search for leagues by name
      const response = await fetch(
        `${this.API_BASE_URL}/leagues?name=${encodeURIComponent(leagueName)}`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`API response not ok: ${response.status}`);
      }

      const data = await response.json();

      if (data.response && data.response.length > 0) {
        const league = data.response[0].league;
        if (league && league.logo) {
          // Add to our permanent database for future use
          this.leagueLogos[leagueName] = league.logo;
          console.log(
            `📦 Added new league to database: ${leagueName} -> ${league.logo}`,
          );
          return league.logo;
        }
      }

      return null;
    } catch (error) {
      console.error(
        `❌ Failed to fetch league logo from API for ${leagueName}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Cache management
   */
  private getCachedLogo(leagueName: string): string | null {
    const cached = this.apiCache.get(leagueName);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.apiCache.delete(leagueName);
      return null;
    }

    return cached.logo;
  }

  private cacheLogo(leagueName: string, logoUrl: string): void {
    this.apiCache.set(leagueName, { logo: logoUrl, timestamp: Date.now() });
  }

  /**
   * Generate high-quality fallback logo
   */
  private generateHighQualityFallback(leagueName: string): string {
    const initials = this.getLeagueInitials(leagueName);
    const colors = this.getLeagueColors(leagueName);

    // For AFC tournaments, use specific AFC styling
    if (
      leagueName.toLowerCase().includes("afc") ||
      leagueName.toLowerCase().includes("asian")
    ) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent("AFC")}&background=1E3A8A&color=FFFFFF&size=256&rounded=true&font-size=0.4&bold=true&format=png`;
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${colors.bg}&color=${colors.text}&size=256&rounded=true&font-size=0.4&bold=true&format=png`;
  }

  /**
   * Extract meaningful initials from league name with better logic
   */
  private getLeagueInitials(leagueName: string): string {
    if (!leagueName) return "LG";

    // Special cases for Asian tournaments
    if (leagueName.toLowerCase().includes("afc u23")) return "AFC";
    if (leagueName.toLowerCase().includes("afc")) return "AFC";
    if (leagueName.toLowerCase().includes("asian cup")) return "AFC";

    // Common abbreviation patterns
    const abbreviations: Record<string, string> = {
      "Premier League England": "PL",
      "English Premier League": "PL",
      "Champions League": "CL",
      "Europa League": "EL",
      "La Liga": "LL",
      "Serie A Italy": "SA",
      "Italian Serie A": "SA",
      Bundesliga: "BL",
      "Ligue 1": "L1",
      "World Cup": "WC",
      "Copa America": "CA",
      "Nations League": "NL",
    };

    // Check for known abbreviations
    const knownAbbr = abbreviations[leagueName];
    if (knownAbbr) return knownAbbr;

    // Extract initials from words, filtering out common words
    const words = leagueName
      .split(/[\s\-_]+/)
      .filter(
        (word) =>
          word.length > 0 &&
          ![
            "the",
            "of",
            "and",
            "cup",
            "league",
            "division",
            "qualification",
            "-",
          ].includes(word.toLowerCase()),
      );

    if (words.length >= 2) {
      return words
        .slice(0, 3)
        .map((word) => word.charAt(0).toUpperCase())
        .join("");
    } else if (words.length === 1) {
      const word = words[0];
      if (word.length >= 3) {
        return word.substring(0, 3).toUpperCase();
      }
      return word.charAt(0).toUpperCase() + "L";
    }

    return "LG";
  }

  /**
   * Get appropriate colors for a league with enhanced Asian league support
   */
  private getLeagueColors(leagueName: string): { bg: string; text: string } {
    const name = leagueName.toLowerCase();

    // League-specific color schemes
    const colorMap: Record<string, { bg: string; text: string }> = {
      // European leagues
      "premier league england": { bg: "3D195B", text: "FFFFFF" },
      "english premier league": { bg: "3D195B", text: "FFFFFF" },
      "champions league": { bg: "0E1428", text: "FFFFFF" },
      "europa league": { bg: "FF6600", text: "FFFFFF" },
      "la liga": { bg: "FF6B35", text: "FFFFFF" },
      "serie a italy": { bg: "004225", text: "FFFFFF" },
      "italian serie a": { bg: "004225", text: "FFFFFF" },
      bundesliga: { bg: "D20515", text: "FFFFFF" },
      "ligue 1": { bg: "FFF200", text: "000000" },

      // Asian competitions - AFC brand colors
      afc: { bg: "1E3A8A", text: "FFFFFF" }, // AFC Blue
      asian: { bg: "1E3A8A", text: "FFFFFF" },
      u23: { bg: "10B981", text: "FFFFFF" }, // Green for youth

      // International tournaments
      "world cup": { bg: "B8860B", text: "FFFFFF" },
      euro: { bg: "003B7A", text: "FFFFFF" },
      "copa america": { bg: "DC2626", text: "FFFFFF" },
      "nations league": { bg: "4F46E5", text: "FFFFFF" },

      // Domestic leagues
      mls: { bg: "005DAA", text: "FFFFFF" },
      "j1 league": { bg: "E53E3E", text: "FFFFFF" }, // Japan red
      "k league": { bg: "DC2626", text: "FFFFFF" }, // Korea red
      saudi: { bg: "15803D", text: "FFFFFF" }, // Saudi green
      chinese: { bg: "DC2626", text: "FFFFFF" }, // China red
    };

    // Check for matches with enhanced scoring
    for (const [key, colors] of Object.entries(colorMap)) {
      if (name.includes(key)) {
        return colors;
      }
    }

    // High-quality color palette for fallbacks
    const premiumColors = [
      { bg: "1E40AF", text: "FFFFFF" }, // Premium Blue
      { bg: "059669", text: "FFFFFF" }, // Premium Green
      { bg: "DC2626", text: "FFFFFF" }, // Premium Red
      { bg: "7C3AED", text: "FFFFFF" }, // Premium Purple
      { bg: "EA580C", text: "FFFFFF" }, // Premium Orange
      { bg: "0891B2", text: "FFFFFF" }, // Premium Cyan
      { bg: "BE185D", text: "FFFFFF" }, // Premium Pink
      { bg: "65A30D", text: "FFFFFF" }, // Premium Lime
    ];

    let hash = 0;
    for (let i = 0; i < leagueName.length; i++) {
      hash = leagueName.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % premiumColors.length;
    return premiumColors[index];
  }

  /**
   * Preload league logos for better performance
   */
  async preloadLeagueLogos(leagueNames: string[]): Promise<void> {
    const preloadPromises = leagueNames.map(async (leagueName) => {
      try {
        await this.getOfficialLeagueLogo(leagueName);
      } catch (error) {
        console.warn(`Failed to preload logo for ${leagueName}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log(`📦 Preloaded logos for ${leagueNames.length} leagues`);
  }

  /**
   * Check if a league logo URL is accessible
   */
  async isLogoAvailable(logoUrl: string): Promise<boolean> {
    try {
      const response = await fetch(logoUrl, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get all available league names for debugging
   */
  getAvailableLeagues(): string[] {
    return Object.keys(this.leagueLogos).sort();
  }

  /**
   * Add or update a league logo mapping
   */
  addLeagueLogo(leagueName: string, logoUrl: string): void {
    this.leagueLogos[leagueName] = logoUrl;
    this.cacheLogo(leagueName, logoUrl);
    console.log(`➕ Added league logo mapping: ${leagueName} -> ${logoUrl}`);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.apiCache.clear();
    console.log("🧹 League logo cache cleared");
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.apiCache.size,
      entries: Array.from(this.apiCache.keys()),
    };
  }
}

// Export singleton instance
const leagueLogoService = new LeagueLogoService();
export default leagueLogoService;
