# Bengaluru civic and elected-representative data plan

The frontend is wired to call:

```text
GET /v1/civic-area?lat=12.97180&lng=77.64120
```

The endpoint should return:

```json
{
  "locality": "Indiranagar",
  "ward": "official ward id and name",
  "corporation": "Bengaluru East City Corporation",
  "assemblyConstituency": "C. V. Raman Nagar",
  "parliamentaryConstituency": "Bangalore Central",
  "contacts": [
    {
      "role": "Ward engineer",
      "name": "Official name",
      "phone": "officially published number",
      "sourceUrl": "https://official-government-source.example/record",
      "verifiedAt": "2026-08-21"
    }
  ]
}
```

## What is implemented today

- `server/data/gba-wards.geojson`: the 369 GBA ward polygons (2025 delimitation) with corporation, zone, AC/PC, population and two ward-staff phone numbers (AEE engineer, JHI health inspector). Boundaries and staff numbers come from nammakasa.in (fetched 2026-11-01); the phone numbers are unverified.
- `server/sql/seed-representatives.sql`: one MLA per Assembly constituency (2023) and one MP per Parliamentary constituency (2024). Edit this file after any by-election or defection.
- Both are loaded into the `wards` and `representatives` tables on every API start. `/v1/civic-area` finds the ward with a bounding-box query plus a point-in-polygon test in `server/src/lib/geo.js`, so PostGIS is not required yet. Points outside all wards (e.g. Electronic City) fall back to the nearest locality.

## Correct lookup model

A typed locality name is not reliable enough because neighbourhood names overlap and do not align perfectly with administrative boundaries. Store official ward, Assembly Constituency (AC), and Parliamentary Constituency (PC) polygons in PostGIS. For every report coordinate, run `ST_Covers(boundary.geom, point)` for each boundary type, then join the returned stable IDs to current representative and department-contact tables.

Suggested tables:

- `administrative_boundaries`: stable ID, type (`gba_ward`, `assembly`, `parliament`), official name, corporation, geometry, source URL, effective dates.
- `representatives`: boundary ID, role, public name, party when relevant, official phone/email, source URL, verified date, effective dates.
- `department_routes`: issue category + ward/corporation to responsible department, helpline, escalation target, source URL.
- `source_runs`: fetch/import log, checksum, row count, warnings, reviewer.

Keep historical rows. Constituency, ward, office-holder, and contact changes must never silently rewrite the audit trail for old reports.

## Source hierarchy

Use only authoritative/public records for the directory:

1. Greater Bengaluru Authority site for the five city corporations, ward delimitation, officers, and official helplines.
2. Karnataka Legislative Assembly’s current member/contact directory for MLAs.
3. Lok Sabha/Sansad or Election Commission results for MPs and constituency names.
4. Official department and corporation directories for engineers and category-specific routing.

Do not scrape private-number aggregators. A phone number may be shown only when the government source explicitly publishes it for public contact. Every displayed record should carry a source link and last-verified date; stale records should be hidden or flagged.

## Production validation

- Import boundary files through a reviewed ETL job; reject invalid geometries and overlaps.
- Test known landmarks near every boundary and especially boundary edges.
- Refresh elected representatives after elections/by-elections and contacts on a regular schedule.
- Provide a correction channel for public officials and residents.
- Keep the GBA `1533` helpline as a safe fallback when no exact ward route is verified.
