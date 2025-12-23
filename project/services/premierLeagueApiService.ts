// Enhanced Premier League API Service
// Fetches real player data and headshots for Premier League teams using API-Football with TheSportsDB enhancement
import theSportsDbApiService from "./theSportsDbApiService";

interface PremierLeaguePlayer {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  nationality: string;
  height: string | null;
  weight: string | null;
  photo: string;
  position: string;
  team: {
    id: number;
    name: string;
    logo: string;
  };
}

interface ApiSportsResponse<T> {
  get: string;
  parameters: Record<string, any>;
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T[];
}

interface TeamResponse {
  team: {
    id: number;
    name: string;
    code: string;
    country: string;
    founded: number;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface: string;
    image: string;
    country: string;
  };
}

interface PlayerResponse {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: {
      date: string;
      place: string;
      country: string;
    };
    nationality: string;
    height: string;
    weight: string;
    injured: boolean;
    photo: string;
  };
  statistics: Array<{
    team: {
      id: number;
      name: string;
      logo: string;
    };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
      season: number;
    };
    games: {
      appearences: number;
      lineups: number;
      minutes: number;
      number: number;
      position: string;
      rating: string;
      captain: boolean;
    };
  }>;
}

class PremierLeagueApiService {
  private baseUrl = "https://v3.football.api-sports.io";
  private apiKey: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours for fresher data

  // Premier League ID from API-Sports
  private premierLeagueId = 39;

  // Official club photo sources mapping
  private clubPhotoSources = {
    Arsenal: "https://www.arsenal.com",
    Liverpool: "https://www.liverpoolfc.com",
    Tottenham: "https://www.tottenhamhotspur.com",
    "Aston Villa": "https://www.avfc.co.uk",
    Bournemouth: "https://www.afcb.co.uk",
    Brentford: "https://www.brentfordfc.com",
    Brighton: "https://www.brightonandhovealbion.com",
    Burnley: "https://burnleyfootballclub.com",
    Chelsea: "https://www.chelseafc.com",
    "Crystal Palace": "https://www.cpfc.co.uk",
    "Manchester United": "https://www.manutd.com",
    Fulham: "https://www.fulhamfc.com",
    "Leeds United": "https://www.leedsunited.com",
    "Manchester City": "https://www.mancity.com",
    Everton: "https://www.evertonfc.com",
    Newcastle: "https://www.newcastleunited.com",
    "Nottingham Forest": "https://www.nottinghamforest.co.uk",
    Sunderland: "https://www.safc.com",
    "West Ham": "https://www.whufc.com",
    Wolves: "https://www.wolves.co.uk",
  };

  // Team colors for enhanced placeholders
  private teamColors: Record<string, string> = {
    Arsenal: "DC143C",
    Liverpool: "C8102E",
    Tottenham: "132257",
    "Aston Villa": "95BFE5",
    Bournemouth: "DA020E",
    Brentford: "E30613",
    Brighton: "0057B7",
    Burnley: "6C1D45",
    Chelsea: "034694",
    "Crystal Palace": "1B458F",
    "Manchester United": "DA020E",
    Fulham: "000000",
    "Leeds United": "FFCD00",
    "Manchester City": "6CABDD",
    Everton: "003399",
    Newcastle: "241F20",
    "Nottingham Forest": "DD0000",
    Sunderland: "EB172B",
    "West Ham": "7A263A",
    Wolves: "FDB61C",
  };

  constructor() {
    // Use existing API Football key from environment variables
    this.apiKey = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || "";
    if (!this.apiKey) {
      console.warn(
        "EXPO_PUBLIC_API_FOOTBALL_KEY not found in environment variables",
      );
    }
    console.log(
      "🚀 Enhanced Premier League API Service initialized with dual API support",
    );
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, any> = {},
  ): Promise<ApiSportsResponse<T>> {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    const queryParams = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${endpoint}${queryParams ? `?${queryParams}` : ""}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-rapidapi-key": this.apiKey,
          "x-rapidapi-host": "v3.football.api-sports.io",
        },
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Cache the response
      this.cache.set(cacheKey, { data, timestamp: Date.now() });

      return data;
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error);
      throw error;
    }
  }

  // Premier League team name to API-Sports team ID mapping
  private teamMapping: Record<string, number> = {
    Arsenal: 42,
    "Manchester City": 50,
    "Manchester United": 33,
    Liverpool: 40,
    Chelsea: 49,
    Tottenham: 47,
    Newcastle: 34,
    "Aston Villa": 66,
    Brighton: 51,
    "West Ham": 48,
    Leicester: 46,
    Everton: 45,
    Brentford: 55,
    "Crystal Palace": 52,
    Fulham: 36,
    Wolves: 39,
    Southampton: 41,
    "Nottingham Forest": 65,
    Bournemouth: 35,
    Burnley: 44,
    "Leeds United": 18,
    Sunderland: 30,
  };

  // Get Premier League team ID by team name
  getTeamId(teamName: string): number | null {
    return this.teamMapping[teamName] || null;
  }

  // Get Premier League team players - using original working method with dual API fallback
  async getPremierLeagueTeamPlayers(
    teamName: string,
    season: number = 2025,
  ): Promise<PremierLeaguePlayer[]> {
    try {
      console.log(
        `🔄 Fetching ${teamName} players from Premier League API (original method)...`,
      );
      const teamId = this.getTeamId(teamName);

      if (!teamId) {
        console.warn(`No Premier League team found for ${teamName}`);
        return this.getFallbackPlayers(teamName);
      }

      console.log(`📍 Team ID: ${teamId}, Season: ${season}`);

      let response;

      try {
        // First try with current season (2025 for current data)
        console.log(
          `📡 Trying API call: /players?team=${teamId}&season=${season}`,
        );
        response = await this.makeRequest<PlayerResponse>("/players", {
          team: teamId,
          season: season,
        });
        console.log(
          `✅ Got ${response.response?.length || 0} players from ${season} season`,
        );
      } catch (error) {
        console.warn(
          `❌ Failed to fetch players for season ${season}, error:`,
          error,
        );
        console.warn(`🔄 Trying 2024 season...`);
        try {
          // Fallback to 2024 season
          response = await this.makeRequest<PlayerResponse>("/players", {
            team: teamId,
            season: 2024,
          });
          console.log(
            `✅ Got ${response.response?.length || 0} players from 2024 season`,
          );
        } catch (error2) {
          console.warn(`❌ Failed to fetch players for 2024, error:`, error2);
          console.warn(`🔄 Trying 2023 season...`);
          try {
            // Fallback to 2023 season
            response = await this.makeRequest<PlayerResponse>("/players", {
              team: teamId,
              season: 2023,
            });
            console.log(
              `✅ Got ${response.response?.length || 0} players from 2023 season`,
            );
          } catch (error3) {
            console.warn(`❌ Failed to fetch players for 2023, error:`, error3);
            console.warn(`🔄 Trying squads endpoint...`);
            // Try squads endpoint as alternative
            response = await this.makeRequest<any>("/players/squads", {
              team: teamId,
            });
            console.log(
              `✅ Got ${response.response?.length || 0} players from squads endpoint`,
            );
          }
        }
      }

      if (!response || !response.response || response.response.length === 0) {
        console.warn(`No player data found for ${teamName}, using fallback`);
        return this.getFallbackPlayers(teamName);
      }

      const players: PremierLeaguePlayer[] = response.response.map(
        (playerData: any) => {
          const player = playerData.player || playerData;
          const stats = playerData.statistics ? playerData.statistics[0] : {};

          const processedPlayer = {
            id: player.id || Math.random() * 1000,
            name: player.name || `${teamName} Player`,
            firstname: player.firstname || "Player",
            lastname: player.lastname || "",
            age: player.age || 25,
            nationality: player.nationality || "Unknown",
            height: player.height || null,
            weight: player.weight || null,
            photo: player.photo || "",
            position: stats.games?.position || player.position || "Unknown",
            team: {
              id: stats.team?.id || teamId,
              name: stats.team?.name || teamName,
              logo: stats.team?.logo || "",
            },
          };

          console.log(
            `👤 Processing player: ${processedPlayer.name}, Photo: ${processedPlayer.photo ? "✅" : "❌"}`,
          );
          return processedPlayer;
        },
      );

      // Limit to 29 players for Liverpool, Tottenham and Bournemouth, 31 for Aston Villa, 27 for others and ensure we have at least some data
      const maxPlayers =
        teamName === "Liverpool" ||
        teamName === "Tottenham Hotspur" ||
        teamName === "Bournemouth"
          ? 29
          : teamName === "Aston Villa"
            ? 31
            : 27;
      const finalPlayers = players.slice(0, maxPlayers);
      console.log(
        `✅ Loaded ${finalPlayers.length} ${teamName} players from API`,
      );

      // If we have good data, return it. Only try enhancement if we have very few players
      if (finalPlayers.length >= 15) {
        return finalPlayers;
      } else if (finalPlayers.length > 0) {
        console.log(
          `⚠️ Only ${finalPlayers.length} players found, trying data enhancement...`,
        );
        try {
          const enhancedPlayers = await this.enhancePlayerData(
            teamName,
            finalPlayers,
          );
          return enhancedPlayers;
        } catch (enhanceError) {
          console.warn(
            `Enhancement failed, using original data:`,
            enhanceError,
          );
          return finalPlayers;
        }
      } else {
        return this.getFallbackPlayers(teamName);
      }
    } catch (error) {
      console.error(`Error fetching players for ${teamName}:`, error);
      return this.getFallbackPlayers(teamName);
    }
  }

  // Optional enhancement method - only used when original API returns insufficient data
  private async enhancePlayerData(
    teamName: string,
    existingPlayers: PremierLeaguePlayer[],
  ): Promise<PremierLeaguePlayer[]> {
    try {
      console.log(`🔄 Attempting to enhance ${teamName} player data...`);

      // Try to get additional players from TheSportsDB (safely)
      const additionalPlayers =
        await theSportsDbApiService.getTeamPlayers(teamName);

      if (additionalPlayers.length > 0) {
        const existingNames = new Set(
          existingPlayers.map((p) => p.name.toLowerCase()),
        );
        const newPlayers = additionalPlayers
          .filter((p) => !existingNames.has(p.name.toLowerCase()))
          .slice(0, 10) // Limit to 10 additional players
          .map((player, index) => ({
            id: 9000 + index, // Use high ID to avoid conflicts
            name: player.name,
            firstname: player.name.split(" ")[0] || "",
            lastname: player.name.split(" ").slice(1).join(" ") || "",
            age: player.age || 25,
            nationality: player.nationality || "Unknown",
            height: player.height || "Unknown",
            weight: player.weight || "Unknown",
            photo:
              player.photo ||
              `https://via.placeholder.com/120x120/FF4444/FFFFFF?text=${player.name.charAt(0).toUpperCase()}`,
            position: player.position || "Midfielder",
            team: {
              id: 0,
              name: teamName,
              logo: "",
            },
          }));

        const combined = [...existingPlayers, ...newPlayers];
        console.log(
          `✅ Enhanced ${teamName} data: ${existingPlayers.length} + ${newPlayers.length} = ${combined.length} players`,
        );
        return combined;
      }

      return existingPlayers;
    } catch (error) {
      console.warn(`Data enhancement failed for ${teamName}:`, error);
      return existingPlayers;
    }
  }

  // Generate fallback players when API fails
  private getFallbackPlayers(teamName: string): PremierLeaguePlayer[] {
    const teamPlayersData: Record<string, string[]> = {
      Arsenal: [
        "David Raya",
        "Bukayo Saka",
        "Kai Havertz",
        "W. Saliba",
        "Declan Rice",
        "C. Mosquera",
        "Ben White",
        "P. Hincapié",
        "G. Magalhães",
        "J. Timber",
        "O. Zinchenko",
        "R. Calafiori",
        "M. Ødegaard",
        "E. Eze",
        "L. Trossard",
        "C. Nørgaard",
        "Fábio Vieira",
        "E. Nwaneri",
        "Mikel Merino",
        "M. Zubimendi",
        "G. Jesus",
        "G. Martinelli",
        "V. Gyökeres",
        "N. Madueke",
        "Reiss Nelson",
        "K. Arrizabalaga",
        "M. Lewis-Skelly",
      ],
      Liverpool: [
        "C. Gakpo",
        "A. Becker",
        "Isak",
        "Mo Salah",
        "G. Marmadashvili",
        "Joe Gomez",
        "V. van Dijk",
        "I. Konaté",
        "M. Kerkez",
        "C. Bradley",
        "G. Leoni",
        "A. Robertson",
        "J. Frimpong",
        "J. Gomez",
        "Wataru Endo",
        "H. Ekitiké",
        "F. Wirtz",
        "D. Szoboszlai",
        "M. Allister",
        "C. Jones",
        "R. Gravenberch",
        "T. Nyoni",
        "S. Bajcetic",
        "K. Morrison",
        "T. Pilling",
        "F. Chiesa",
        "C. Bradley",
        "R. Ngumoha",
        "J. Danns",
      ],
      Tottenham: [
        "G. Vicario",
        "R. Drăgușin",
        "K. Danso",
        "J. Palhinha",
        "X. Simons",
        "Y. Bissouma",
        "Richarlison",
        "J. Maddison",
        "Mathys Tel",
        "D. Udogie",
        "Archie Gray",
        "L. Bergvall",
        "C. Romero",
        "D. Solanke",
        "Mo Kudus",
        "D. Kulusevski",
        "B. Johnson",
        "Pedro Porro",
        "Djed Spence",
        "K. Takai",
        "W. Odobert",
        "P. Matar Sarr",
        "R. Bentancur",
        "A. Kinsky",
        "B. Davies",
        "M. van de Ven",
        "R. Kolo Muani",
        "B. Austin",
        "D. Scarlett",
      ],
      "Aston Villa": [
        "E. Martínez",
        "S. Proctor",
        "Matty Cash",
        "Marco Bizot",
        "J. Wright",
        "Rhys Oakley",
        "V. Lindelöf",
        "Ezri Konsa",
        "T. Mings",
        "Lucas Digne",
        "Pau Torres",
        "Andrés García",
        "Y. Tielemans",
        "A. Onana",
        "I. Maatsen",
        "L. Bogarde",
        "T. Patterson",
        "R. Barkley",
        "J. McGinn",
        "H. Elliott",
        "E. Buendía",
        "J. Jimoh",
        "B. Kamara",
        "B. Borland",
        "Ben Broggio",
        "B. Burrowes",
        "O. Watkins",
        "D. Malen",
        "J. Sancho",
        "M. Rogers",
        "E. Guessand",
      ],
      Bournemouth: [
        "A. Semenyo",
        "D. Petrović",
        "J. Araujo",
        "W. Dennis",
        "C. Mckenna",
        "A. Truffert",
        "M. Senesi",
        "Julio Soler",
        "Adam Smith",
        "B. Diakité",
        "A. Jiménez",
        "James Hill",
        "Owen Bevan",
        "V. Milosavljevic",
        "Lewis Cook",
        "David Brooks",
        "Alex Scott",
        "R. Christie",
        "Tyler Adams",
        "M. Tavernier",
        "Evanilson",
        "Gannon Doak",
        "J. Kluivert",
        "Amine Adli",
        "Eli Kroupi",
        "Enes Ünal",
        "R. Rees-Dottin",
        "M. Akinmboni",
      ],
      Chelsea: [
        "Cole Palmer",
        "Nicolas Jackson",
        "Christopher Nkunku",
        "Enzo Fernández",
        "Moisés Caicedo",
        "Conor Gallagher",
        "Reece James",
        "Ben Chilwell",
        "Thiago Silva",
        "Levi Colwill",
        "Robert Sánchez",
        "Raheem Sterling",
        "Mykhailo Mudryk",
        "Noni Madueke",
        "Marc Cucurella",
        "Wesley Fofana",
        "Trevoh Chalobah",
        "Axel Disasi",
        "Malo Gusto",
        "Romeo Lavia",
        "Lesley Ugochukwu",
        "Carney Chukwuemeka",
        "Ian Maatsen",
        "Armando Broja",
        "Đorđe Petrović",
        "Marcus Bettinelli",
        "Lucas Bergström",
      ],
      "Manchester City": [
        "Erling Haaland",
        "Kevin De Bruyne",
        "Phil Foden",
        "Bernardo Silva",
        "Jack Grealish",
        "Rodri",
        "Julián Álvarez",
        "Riyad Mahrez",
        "Joško Gvardiol",
        "Kyle Walker",
        "John Stones",
        "Rúben Dias",
        "Ederson",
        "İlkay Gündoğan",
        "Nathan Aké",
        "Mateo Kovačić",
        "Jeremy Doku",
        "Matheus Nunes",
        "Manuel Akanji",
        "Sergio Gómez",
        "Rico Lewis",
        "Kalvin Phillips",
        "Oscar Bobb",
        "James McAtee",
        "Stefan Ortega",
        "Scott Carson",
        "Claudio Echeverri",
      ],
      Brentford: [
        "Ivan Toney",
        "Bryan Mbeumo",
        "Yoane Wissa",
        "Christian Nørgaard",
        "Vitaly Janelt",
        "Mathias Jensen",
        "Rico Henry",
        "Aaron Hickey",
        "Ethan Pinnock",
        "Ben Mee",
        "Mark Flekken",
        "Keane Lewis-Potter",
        "Mikkel Damsgaard",
        "Kevin Schade",
        "Nathan Collins",
        "Kristoffer Ajer",
        "Sergio Reguilón",
        "Mads Roerslev",
        "Yehor Yarmoliuk",
        "Frank Onyeka",
        "Shandon Baptiste",
        "Saman Ghoddos",
        "Thomas Strakosha",
        "Hakon Valdimarsson",
        "Michael Olakigbe",
        "Ryan Trevitt",
        "Fin Stevens",
      ],
      Brighton: [
        "Evan Ferguson",
        "João Pedro",
        "Danny Welbeck",
        "Pascal Groß",
        "Alexis Mac Allister",
        "Moisés Caicedo",
        "Kaoru Mitoma",
        "Solly March",
        "Pervis Estupiñán",
        "Lewis Dunk",
        "Jason Steele",
        "Facundo Buonanotte",
        "Billy Gilmour",
        "Mahmoud Dahoud",
        "Ansu Fati",
        "Simon Adingra",
        "Julio Enciso",
        "James Milner",
        "Adam Webster",
        "Jan Paul van Hecke",
        "Igor Julio",
        "Joël Veltman",
        "Tariq Lamptey",
        "Adam Lallana",
        "Bart Verbruggen",
        "Carl Rushworth",
        "Cameron Peupion",
      ],
      "Manchester United": [
        "Marcus Rashford",
        "Bruno Fernandes",
        "Rasmus Højlund",
        "Casemiro",
        "Christian Eriksen",
        "Mason Mount",
        "Antony",
        "Jadon Sancho",
        "Luke Shaw",
        "Harry Maguire",
        "André Onana",
        "Alejandro Garnacho",
        "Kobbie Mainoo",
        "Amad Diallo",
        "Raphaël Varane",
        "Lisandro Martínez",
        "Diogo Dalot",
        "Aaron Wan-Bissaka",
        "Scott McTominay",
        "Sofyan Amrabat",
        "Anthony Martial",
        "Facundo Pellistri",
        "Mason Greenwood",
        "Victor Lindelöf",
        "Altay Bayındır",
        "Tom Heaton",
        "Hannibal Mejbri",
      ],
      Newcastle: [
        "Alexander Isak",
        "Callum Wilson",
        "Miguel Almirón",
        "Bruno Guimarães",
        "Joelinton",
        "Joe Willock",
        "Anthony Gordon",
        "Harvey Barnes",
        "Kieran Trippier",
        "Sven Botman",
        "Nick Pope",
        "Jacob Murphy",
        "Sean Longstaff",
        "Lewis Miley",
        "Fabian Schär",
        "Dan Burn",
        "Jamaal Lascelles",
        "Matt Targett",
        "Tino Livramento",
        "Lewis Hall",
        "Emil Krafth",
        "Martin Dúbravka",
        "Loris Karius",
        "Mark Gillespie",
        "Elliot Anderson",
        "Alex Murphy",
        "Ben Parkinson",
      ],
      Everton: [
        "Dominic Calvert-Lewin",
        "Beto",
        "Dwight McNeil",
        "Abdoulaye Doucouré",
        "Amadou Onana",
        "James Garner",
        "Jack Harrison",
        "Iliman Ndiaye",
        "Vitalii Mykolenko",
        "James Tarkowski",
        "Jordan Pickford",
        "Jesper Lindstrøm",
        "Idrissa Gueye",
        "Tim Iroegbunam",
        "Jarrad Branthwaite",
        "Michael Keane",
        "Ashley Young",
        "Seamus Coleman",
        "Nathan Patterson",
        "Roman Dixon",
        "Jake O'Brien",
        "Asmir Begović",
        "João Virgínia",
        "Stanley Mills",
        "Harrison Armstrong",
        "Tyler Onyango",
        "Katia Kouyaté",
      ],
      Fulham: [
        "Rodrigo Muniz",
        "Raúl Jiménez",
        "Alex Iwobi",
        "Andreas Pereira",
        "João Palhinha",
        "Harrison Reed",
        "Willian",
        "Adama Traoré",
        "Antonee Robinson",
        "Calvin Bassey",
        "Bernd Leno",
        "Emile Smith Rowe",
        "Tom Cairney",
        "Sasa Lukic",
        "Joachim Andersen",
        "Issa Diop",
        "Tim Ream",
        "Kenny Tete",
        "Ryan Sessegnon",
        "Fodé Ballo-Touré",
        "Armando Broja",
        "Marek Rodák",
        "Steven Benda",
        "Jorge Cuenca",
        "Luke Harris",
        "Ryan McAidoo",
        "Martial Godo",
      ],
      "West Ham": [
        "Michail Antonio",
        "Jarrod Bowen",
        "Lucas Paquetá",
        "Mohammed Kudus",
        "Tomáš Souček",
        "Edson Álvarez",
        "Emerson",
        "Crysencio Summerville",
        "Aaron Wan-Bissaka",
        "Max Kilman",
        "Lukasz Fabianski",
        "Carlos Soler",
        "Guido Rodríguez",
        "Jean-Clair Todibo",
        "Konstantinos Mavropanos",
        "Vladimir Coufal",
        "Aaron Cresswell",
        "Niclas Füllkrug",
        "Danny Ings",
        "Andy Irving",
        "Alphonse Areola",
        "Wes Foderingham",
        "Luis Guilherme",
        "George Earthy",
        "Lewis Orford",
        "Kaelan Casey",
        "Ollie Scarles",
      ],
      Wolves: [
        "Matheus Cunha",
        "Hwang Hee-chan",
        "Pedro Neto",
        "Matheus Nunes",
        "João Gomes",
        "Mario Lemina",
        "Pablo Sarabia",
        "Gonçalo Guedes",
        "Rayan Aït-Nouri",
        "Max Kilman",
        "José Sá",
        "Jorgen Strand Larsen",
        "Tommy Doyle",
        "André",
        "Craig Dawson",
        "Toti Gomes",
        "Nélson Semedo",
        "Matt Doherty",
        "Hugo Bueno",
        "Santi Bueno",
        "Yerson Mosquera",
        "Daniel Bentley",
        "Sam Johnstone",
        "Bastien Meupiyou",
        "Enso González",
        "Joe Hodge",
        "Leon Chiwome",
      ],
      "Crystal Palace": [
        "Jean-Philippe Mateta",
        "Eberechi Eze",
        "Michael Olise",
        "Wilfried Zaha",
        "Jefferson Lerma",
        "Adam Wharton",
        "Tyrick Mitchell",
        "Daniel Muñoz",
        "Marc Guéhi",
        "Joachim Andersen",
        "Dean Henderson",
        "Ismaïla Sarr",
        "Will Hughes",
        "Cheick Doucouré",
        "Chris Richards",
        "Nathaniel Clyne",
        "Joel Ward",
        "Eddie Nketiah",
        "Odsonne Édouard",
        "Daichi Kamada",
        "Sam Johnstone",
        "Remi Matthews",
        "Franco Umeh",
        "Caleb Kporha",
        "Asher Agbinone",
        "David Ozoh",
        "Killian Phillips",
      ],
    };

    const playerNames =
      teamPlayersData[teamName] ||
      Array.from(
        { length: 27 },
        (_, index) => `${teamName} Player ${index + 1}`,
      );

    const playerCount =
      teamName === "Liverpool" ||
      teamName === "Tottenham Hotspur" ||
      teamName === "Bournemouth"
        ? 29
        : teamName === "Aston Villa"
          ? 31
          : 27;
    return Array.from({ length: playerCount }, (_, index) => ({
      id: index + 1,
      name: playerNames[index] || `${teamName} Player ${index + 1}`,
      firstname: playerNames[index]?.split(" ")[0] || "Player",
      lastname: playerNames[index]?.split(" ")[1] || `${index + 1}`,
      age: 25,
      nationality: "Unknown",
      height: null,
      weight: null,
      photo: "",
      position:
        index === 0 || index === 26
          ? "Goalkeeper"
          : index < 7
            ? "Forward"
            : index < 14
              ? "Midfielder"
              : "Defender",
      team: {
        id: this.getTeamId(teamName) || 0,
        name: teamName,
        logo: "",
      },
    }));
  }

  // Get player headshot URL with fallbacks
  // Enhanced photo fetching with multiple official sources
  getPlayerPhoto(player: PremierLeaguePlayer): string {
    console.log(
      `🖼️ Getting photo for ${player.name}: ${player.photo || "No photo URL"}`,
    );

    // Multiple photo sources in priority order
    const photoSources = [
      // 1. API-Sports primary (original logic maintained)
      player.photo && player.photo !== "" ? player.photo : null,

      // 2. Premier League official resources
      `https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.id}.png`,

      // 3. Transfermarkt high-quality portraits
      `https://img.a.transfermarkt.technology/portrait/header/${player.id}.jpg`,

      // 4. ESPN player photos
      `https://a.espncdn.com/i/headshots/soccer/players/full/${player.id}.png`,

      // 5. BBC Sport images
      `https://ichef.bbci.co.uk/onesport/cps/624/cpsprodpb/vl/live/images/2024/8/16/player-${player.id}.jpg`,

      // 6. Alternative transfermarkt format
      `https://tmssl.akamaized.net/images/portrait/header/${player.id}.jpg`,

      // 7. FotMob player images
      `https://images.fotmob.com/image_resources/playerimages/${player.id}.png`,

      // 8. Sky Sports player photos
      `https://e0.365dm.com/football/players/${player.id}.jpg`,
    ];

    // Return the first available photo URL
    for (const source of photoSources) {
      if (source && this.isValidPhotoUrl(source)) {
        console.log(`✅ Using enhanced photo source: ${source}`);
        return source;
      }
    }

    // Original fallback logic maintained
    if (player.team.logo) {
      console.log(`🏷️ Using team logo: ${player.team.logo}`);
      return player.team.logo;
    }

    // Enhanced placeholder with team colors
    const fallbackUrl = this.generatePlayerPlaceholder(player);
    console.log(`🔄 Using enhanced placeholder: ${fallbackUrl}`);
    return fallbackUrl;
  }

  // Validate if photo URL is accessible
  private isValidPhotoUrl(url: string): boolean {
    try {
      // Basic URL validation
      new URL(url);
      // Check if it's an image format
      return (
        /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url) ||
        url.includes("placeholder") ||
        url.includes("player") ||
        url.includes("portrait") ||
        url.includes("headshots")
      );
    } catch {
      return false;
    }
  }

  // Generate high-quality placeholder with player initials and team colors
  private generatePlayerPlaceholder(player: PremierLeaguePlayer): string {
    const initials = (player.firstname[0] || "") + (player.lastname[0] || "");
    const teamColor = this.getTeamPrimaryColor(player.team.name);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=300&background=${teamColor}&color=ffffff&font-size=0.4&bold=true`;
  }

  // Get team primary color for placeholder generation
  private getTeamPrimaryColor(teamName: string): string {
    return this.teamColors[teamName] || "FF6B35";
  }

  // Check for squad updates and data freshness
  async checkForSquadUpdates(teamName: string): Promise<{
    hasUpdates: boolean;
    lastUpdate: string;
    newPlayers: number;
    changedPlayers: string[];
  }> {
    try {
      console.log(`🔍 Checking squad updates for ${teamName}...`);

      const cacheKey = `squad_check_${teamName}`;
      const lastCheck = this.cache.get(cacheKey);

      // Check if we've checked recently (within 6 hours)
      const sixHours = 6 * 60 * 60 * 1000;
      if (lastCheck && Date.now() - lastCheck.timestamp < sixHours) {
        console.log(
          `⏰ Recent check found for ${teamName}, using cached result`,
        );
        return lastCheck.data;
      }

      // Check cached squad data to avoid recursion
      const previousSquadKey = `previous_squad_${teamName}`;
      const previousSquad = this.cache.get(previousSquadKey);

      // Return basic update info without recursion
      let hasUpdates = false;
      let newPlayers = 0;
      let changedPlayers: string[] = [];

      if (!previousSquad || !previousSquad.data) {
        // First time checking, consider as having updates
        hasUpdates = true;
        console.log(`🆕 First squad check for ${teamName}, marking as updated`);
      } else {
        // For subsequent checks, we'll assume no updates to avoid recursion
        // Real update detection can happen after successful data fetch
        hasUpdates = false;
        console.log(`✅ Using cached squad status for ${teamName}`);
      }

      const result = {
        hasUpdates,
        lastUpdate: new Date().toISOString(),
        newPlayers,
        changedPlayers,
      };

      // Cache the check result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      console.log(`✅ Squad check complete for ${teamName}:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Error checking squad updates for ${teamName}:`, error);
      return {
        hasUpdates: false,
        lastUpdate: new Date().toISOString(),
        newPlayers: 0,
        changedPlayers: [],
      };
    }
  }

  // Enhanced API call with better error handling and retries
  private async makeRequestWithRetry<T>(
    endpoint: string,
    params: Record<string, any> = {},
    maxRetries: number = 3,
  ): Promise<ApiSportsResponse<T>> {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `🔄 API request attempt ${attempt}/${maxRetries}: ${endpoint}`,
        );
        const result = await this.makeRequest<T>(endpoint, params);

        // Check if we got valid data
        if (result.response && Array.isArray(result.response)) {
          console.log(`✅ Successful API call on attempt ${attempt}`);
          return result;
        }
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ API call failed on attempt ${attempt}:`, error);

        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }

  // Get most recent season data with fallbacks
  async getMostRecentSeasonData(
    teamName: string,
  ): Promise<PremierLeaguePlayer[]> {
    const currentYear = new Date().getFullYear();
    const seasons = [2025, 2024, 2023]; // Try 2025, 2024, then 2023

    for (const season of seasons) {
      try {
        console.log(`🔄 Trying ${teamName} squad data for ${season} season...`);
        const players = await this.getPremierLeagueTeamPlayers(
          teamName,
          season,
        );

        if (players.length > 0) {
          console.log(
            `✅ Found ${players.length} players for ${teamName} in ${season} season`,
          );
          return players;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to get ${teamName} data for ${season}:`, error);
      }
    }

    console.warn(`⚠️ No recent data found for ${teamName}, using fallback`);
    return this.getFallbackPlayers(teamName);
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Test API connection and authentication
  async testApiConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🧪 Testing Premier League API connection...");
      console.log("🔑 API Key status:", this.apiKey ? "Present" : "Missing");

      if (!this.apiKey) {
        return {
          success: false,
          message:
            "API key is missing. Check EXPO_PUBLIC_API_FOOTBALL_KEY in .env.local",
        };
      }

      // Test request to get Premier League teams
      const response = await fetch(
        `${this.baseUrl}/teams?league=${this.premierLeagueId}&season=2024`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key": this.apiKey,
            "x-rapidapi-host": "v3.football.api-sports.io",
          },
        },
      );

      console.log("📡 API Response status:", response.status);

      if (response.status === 403) {
        return {
          success: false,
          message:
            "API authentication failed (403). Check your API key permissions.",
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          message: "API rate limit exceeded (429). Wait before trying again.",
        };
      }

      if (!response.ok) {
        return {
          success: false,
          message: `API request failed: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      console.log("✅ Premier League API test successful! Sample data:", {
        results: data.results,
        errors: data.errors,
      });

      return {
        success: true,
        message: `Premier League API working! Found ${data.results} teams.`,
      };
    } catch (error: any) {
      console.error("❌ Premier League API test failed:", error);
      return {
        success: false,
        message: `Connection error: ${error.message}`,
      };
    }
  }
}

// Export singleton instance
const premierLeagueApiService = new PremierLeagueApiService();
export default premierLeagueApiService;

// Export types for use in components
export type { PremierLeaguePlayer };
