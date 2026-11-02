import { SAMPLE_REPRESENTATIVES } from '../data/issues'
import { fetchCivicArea } from './api'

/**
 * Asks the API which locality, corporation, and constituency contain a
 * coordinate. The server currently matches the nearest known neighbourhood
 * centre; docs/CIVIC_DATA_PLAN.md describes the official-polygon version.
 */
export async function lookupCivicDirectory(position) {
  if (!position) {
    return { ...SAMPLE_REPRESENTATIVES, mode: 'sample' }
  }

  try {
    const directory = await fetchCivicArea(position)
    return { ...directory, mode: 'live' }
  } catch {
    return { ...SAMPLE_REPRESENTATIVES, mode: 'sample' }
  }
}
