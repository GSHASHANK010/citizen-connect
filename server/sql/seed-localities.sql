-- Runs on every API start (idempotent via ON CONFLICT).
-- Approximate neighbourhood centroids. Constituency names are indicative
-- only and are shown to users as unverified.
INSERT INTO localities (name, lat, lng, corporation, assembly_constituency, parliamentary_constituency) VALUES
  ('Indiranagar',    12.9719, 77.6412, 'Bengaluru East City Corporation',    'C. V. Raman Nagar', 'Bangalore Central'),
  ('Domlur',         12.9609, 77.6387, 'Bengaluru Central City Corporation', 'Shanti Nagar',      'Bangalore Central'),
  ('Kodihalli',      12.9602, 77.6485, 'Bengaluru East City Corporation',    'C. V. Raman Nagar', 'Bangalore Central'),
  ('Koramangala',    12.9352, 77.6245, 'Bengaluru South City Corporation',   'BTM Layout',        'Bangalore South'),
  ('HSR Layout',     12.9116, 77.6389, 'Bengaluru South City Corporation',   'Bommanahalli',      'Bangalore South'),
  ('Jayanagar',      12.9308, 77.5838, 'Bengaluru South City Corporation',   'Jayanagar',         'Bangalore South'),
  ('JP Nagar',       12.9063, 77.5857, 'Bengaluru South City Corporation',   'Padmanabhanagar',   'Bangalore South'),
  ('Banashankari',   12.9255, 77.5468, 'Bengaluru South City Corporation',   'Padmanabhanagar',   'Bangalore South'),
  ('Basavanagudi',   12.9416, 77.5712, 'Bengaluru South City Corporation',   'Basavanagudi',      'Bangalore South'),
  ('MG Road',        12.9757, 77.6065, 'Bengaluru Central City Corporation', 'Shanti Nagar',      'Bangalore Central'),
  ('Shivajinagar',   12.9857, 77.6057, 'Bengaluru Central City Corporation', 'Shivajinagar',      'Bangalore Central'),
  ('Malleshwaram',   13.0035, 77.5647, 'Bengaluru West City Corporation',    'Malleshwaram',      'Bangalore North'),
  ('Rajajinagar',    12.9915, 77.5527, 'Bengaluru West City Corporation',    'Rajajinagar',       'Bangalore North'),
  ('Vijayanagar',    12.9719, 77.5329, 'Bengaluru West City Corporation',    'Vijayanagar',       'Bangalore Rural'),
  ('Yeshwanthpur',   13.0243, 77.5523, 'Bengaluru West City Corporation',    'Rajarajeshwarinagar', 'Bangalore North'),
  ('Hebbal',         13.0358, 77.5970, 'Bengaluru North City Corporation',   'Hebbal',            'Bangalore North'),
  ('Yelahanka',      13.1007, 77.5963, 'Bengaluru North City Corporation',   'Yelahanka',         'Chikkaballapur'),
  ('Marathahalli',   12.9591, 77.6974, 'Bengaluru East City Corporation',    'Mahadevapura',      'Bangalore Central'),
  ('Whitefield',     12.9698, 77.7500, 'Bengaluru East City Corporation',    'Mahadevapura',      'Bangalore Central'),
  ('KR Puram',       13.0076, 77.6957, 'Bengaluru East City Corporation',    'K. R. Puram',       'Bangalore Central'),
  ('Bellandur',      12.9260, 77.6762, 'Bengaluru East City Corporation',    'Mahadevapura',      'Bangalore Central'),
  ('Electronic City',12.8452, 77.6602, 'Bengaluru South City Corporation',   'Anekal',            'Bangalore Rural'),
  ('Bannerghatta Rd',12.8925, 77.5970, 'Bengaluru South City Corporation',   'Bommanahalli',      'Bangalore South'),
  ('Kengeri',        12.9081, 77.4855, 'Bengaluru West City Corporation',    'Rajarajeshwarinagar', 'Bangalore Rural')
ON CONFLICT (name) DO NOTHING;

