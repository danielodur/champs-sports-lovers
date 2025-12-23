const SOFA_BASE_URL = "https://api.sofascore.com/api/v1";
const SOFA_IMAGE_BASE = "https://api.sofascore.app/api/v1";

export interface SofaScoreResponse<T> {
  data: T;
  [key: string]: any;
}

async function sofaGet<T = any>(endpoint: string): Promise<T> {
  const url = `${SOFA_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ChampsSportsApp/1.0",
    },
  });

  if (!response.ok) {
    const message = `SofaScore API Error: ${response.status} ${response.statusText} (${endpoint})`;
    throw new Error(message);
  }

  return response.json();
}

export { sofaGet, SOFA_BASE_URL, SOFA_IMAGE_BASE };


