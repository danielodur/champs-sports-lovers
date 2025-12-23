// API-Football Handler - Reuses API-Sports handler logic
import { handleApiSports } from './api-sports-handler.ts'
import type { FetchParams } from '../types.ts'

export async function handleApiFootball(
  apiKey: string,
  params: FetchParams
): Promise<any[]> {
  // API-Football uses the same endpoint structure as API-Sports
  console.log(`🔄 Using API-Football handler (same as API-Sports)`)
  return handleApiSports(apiKey, params)
}
