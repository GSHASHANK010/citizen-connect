export const CATEGORIES = [
  { id: 'pothole', label: 'Pothole', icon: 'construction', color: '#dc5b50' },
  { id: 'streetlight', label: 'Streetlight', icon: 'lamp', color: '#e6a53d' },
  { id: 'garbage', label: 'Garbage', icon: 'trash', color: '#536f5e' },
  { id: 'footpath', label: 'Footpath', icon: 'footprints', color: '#5877a2' },
  { id: 'drainage', label: 'Drainage', icon: 'waves', color: '#478ba1' },
  { id: 'other', label: 'Other', icon: 'circle-alert', color: '#765f91' },
]

// Demo reports are seeded by the API from server/sql/seed.sql.

// Fallback shown when the civic-directory endpoint cannot be reached.
export const SAMPLE_REPRESENTATIVES = {
  locality: 'Indiranagar',
  assemblyConstituency: 'C. V. Raman Nagar',
  parliamentaryConstituency: 'Bangalore Central',
  corporation: 'Bengaluru East City Corporation',
  ward: 'Sample ward mapping',
  contacts: [
    { role: 'GBA civic helpline', name: 'Greater Bengaluru Authority', phone: '1533', verified: true },
    { role: 'Ward engineer', name: 'To be verified from GBA', phone: null, verified: false },
    { role: 'Member of Legislative Assembly', name: 'Official-data connection pending', phone: null, verified: false },
    { role: 'Member of Parliament', name: 'Official-data connection pending', phone: null, verified: false },
  ],
}
