/**
 * Mock Data Service - COMPLETELY DISABLED
 * 🚫 ALL MOCK DATA HAS BEEN DISABLED TO ENSURE REAL API DATA ONLY
 * This service now throws errors to prevent any mock data usage
 */

import { Fixture } from "../types/football-fixtures-response";

console.error("❌ MOCK DATA SERVICE ACCESSED - This should never happen!");
console.error("🔧 All components must use real API data only");
console.error(
  "📋 Check API configuration and ensure EXPO_PUBLIC_API_FOOTBALL_KEY is set",
);

export class MockDataService {
  private static instance: MockDataService;

  static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  private throwMockDataError(method: string): never {
    const error = new Error(
      `❌ MOCK DATA DISABLED: ${method} called but mock data is completely disabled. ` +
        `Ensure real API is configured with EXPO_PUBLIC_API_FOOTBALL_KEY in .env.local`,
    );
    console.error(error.message);
    throw error;
  }

  private generateMockFixtures(): Fixture[] {
    this.throwMockDataError("generateMockFixtures");
  }

  private generateMockFixture(
    homeTeam: any,
    awayTeam: any,
    status: string,
    homeScore?: number,
    awayScore?: number,
    minute?: number,
  ): Fixture {
    this.throwMockDataError("generateMockFixture");
  }

  getMockLiveMatches(): Fixture[] {
    this.throwMockDataError("getMockLiveMatches");
  }

  getMockUpcomingMatches(): Fixture[] {
    this.throwMockDataError("getMockUpcomingMatches");
  }

  getMockFinishedMatches(): Fixture[] {
    this.throwMockDataError("getMockFinishedMatches");
  }

  getAllMockFixtures(): Fixture[] {
    this.throwMockDataError("getAllMockFixtures");
  }

  // Any other method calls should also throw errors
  [key: string]: any;
}

// Override any property access to throw errors
const mockService = new MockDataService();
const handler = {
  get(target: any, prop: string) {
    if (typeof target[prop] === "function") {
      return (...args: any[]) => {
        throw new Error(
          `❌ MOCK DATA COMPLETELY DISABLED: Cannot call ${prop}(). ` +
            `Use real API services only. Check EXPO_PUBLIC_API_FOOTBALL_KEY configuration.`,
        );
      };
    }
    throw new Error(
      `❌ MOCK DATA COMPLETELY DISABLED: Cannot access ${prop}. ` +
        `Use real API services only. Check EXPO_PUBLIC_API_FOOTBALL_KEY configuration.`,
    );
  },
};

export default new Proxy(mockService, handler);
