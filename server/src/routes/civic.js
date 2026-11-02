import { Router } from 'express'
import { query } from '../db.js'
import { asyncRoute, badRequest } from '../lib/errors.js'
import { findNearest, isInsideBengaluru, isValidPosition } from '../lib/geo.js'
import { findRepresentatives, findWard } from '../lib/wards.js'

const router = Router()

const GBA_HELPLINE = {
  role: 'GBA civic helpline',
  name: 'Greater Bengaluru Authority',
  phone: '1533',
  verified: true,
  sourceUrl: 'https://bbmp.gov.in',
}

const WARD_CONTACTS_SOURCE = 'https://nammakasa.in'

// GET /v1/civic-area?lat=…&lng=…
// Matches the contract in docs/CIVIC_DATA_PLAN.md. The coordinate is placed
// inside an official GBA ward polygon; outside every ward it falls back to
// the nearest locality centroid.
router.get(
  '/',
  asyncRoute(async (request, response) => {
    const position = {
      lat: Number.parseFloat(request.query.lat),
      lng: Number.parseFloat(request.query.lng),
    }

    if (!isValidPosition(position)) {
      throw badRequest('lat and lng query parameters are required.')
    }

    if (!isInsideBengaluru(position)) {
      throw badRequest('Coordinate is outside Bengaluru coverage.')
    }

    const ward = await findWard(position)

    if (ward) {
      response.json(await describeWard(ward))
      return
    }

    const { rows } = await query('SELECT * FROM localities')
    const nearest = findNearest(position, rows)

    response.json({
      locality: nearest?.name ?? 'Bengaluru',
      ward: 'Outside GBA ward limits',
      corporation: nearest?.corporation ?? 'Greater Bengaluru Authority',
      assemblyConstituency: nearest?.assembly_constituency ?? 'Unknown',
      parliamentaryConstituency: nearest?.parliamentary_constituency ?? 'Unknown',
      matchDistanceMetres: nearest?.distanceMetres ?? null,
      boundaryConfidence: 'approximate',
      verificationNote:
        'This point is outside the 369 GBA wards, so the area is matched to the nearest known neighbourhood centre. Only the GBA helpline is verified.',
      contacts: [GBA_HELPLINE],
    })
  }),
)

async function describeWard(ward) {
  const { mla, mp } = await findRepresentatives(ward)

  return {
    locality: ward.name,
    ward: `Ward ${ward.ward_number} · ${ward.name}`,
    wardNumber: ward.ward_number,
    wardNameKannada: ward.name_kn,
    corporation: `Bengaluru ${ward.corporation} City Corporation`,
    zone: ward.zone,
    assemblyConstituency: ward.assembly_constituency,
    parliamentaryConstituency: ward.parliamentary_constituency,
    population: ward.population,
    boundaryConfidence: 'official-ward',
    verificationNote:
      'Ward from the official GBA 369-ward boundaries. MLA/MP from the 2023 Assembly and 2024 Lok Sabha results; ward staff numbers are community-sourced and unverified. GBA corporator elections are yet to be held.',
    contacts: [
      GBA_HELPLINE,
      representativeContact('Member of Legislative Assembly', mla),
      representativeContact('Member of Parliament', mp),
      {
        role: 'Ward engineer (AEE)',
        name: `Ward ${ward.ward_number} Assistant Executive Engineer`,
        phone: ward.engineer_phone,
        verified: false,
        sourceUrl: WARD_CONTACTS_SOURCE,
      },
      {
        role: 'Health inspector (JHI)',
        name: `Ward ${ward.ward_number} Junior Health Inspector`,
        phone: ward.health_inspector_phone,
        verified: false,
        sourceUrl: WARD_CONTACTS_SOURCE,
      },
    ],
  }
}

function representativeContact(role, representative) {
  if (!representative) {
    return { role, name: 'Not on record', phone: null, verified: false }
  }

  const party = representative.party ? ` (${representative.party})` : ''

  return {
    role: `${role} · ${representative.constituency}`,
    name: `${representative.name}${party}`,
    phone: null,
    note: representative.note,
    verified: true,
    sourceUrl: representative.source_url,
    verifiedAt: representative.verified_at,
  }
}

export default router
