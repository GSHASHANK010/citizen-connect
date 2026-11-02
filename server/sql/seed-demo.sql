-- Demo reports. The API runs this only when the issues table is empty and
-- SEED_DEMO_DATA is not 'false'. Do not seed demo data in production.
BEGIN;

-- 100 anonymous neighbours (numbers 1-100) whose votes make the demo look
-- lived-in. Reporter numbers below are deliberately outside this range.
-- They have no token, so nobody can log in as them.
INSERT INTO users (number)
SELECT n FROM generate_series(1, 100) AS n;

-- Reporters of the sample issues with the display numbers used in the UI.
INSERT INTO users (number) VALUES (482), (109), (721), (314), (565);

-- Real visitors start at Neighbour #1001. Sequences are not transactional,
-- so never assume the sequence is still at its starting value.
SELECT setval('users_number_seq', GREATEST(1000, (SELECT max(number) FROM users)));

INSERT INTO issues (id, title, description, category, status, lat, lng, address, locality, reporter_id, created_at, resolved_at)
VALUES
  ('BLR-1042', 'Deep pothole near 12th Main',
   'Large pothole in the left lane. Difficult to spot after dark and dangerous for two-wheelers.',
   'pothole', 'open', 12.9718, 77.6412, '12th Main Rd, Indiranagar', 'Indiranagar',
   (SELECT id FROM users WHERE number = 482), now() - interval '18 minutes', NULL),
  ('BLR-1038', 'Streetlight not working',
   'The light outside the bus stop has been off for three nights.',
   'streetlight', 'open', 12.9786, 77.6376, 'CMH Road, near Metro', 'Indiranagar',
   (SELECT id FROM users WHERE number = 109), now() - interval '2 hours', NULL),
  ('BLR-1021', 'Garbage pile by playground',
   'Mixed waste has not been collected since the weekend.',
   'garbage', 'in-progress', 12.9608, 77.6382, 'Defence Colony Park', 'Domlur',
   (SELECT id FROM users WHERE number = 721), now() - interval '1 day', NULL),
  ('BLR-1007', 'Broken footpath slab',
   'A slab is missing, leaving an open gap along the pedestrian path.',
   'footpath', 'resolved', 12.9654, 77.6419, '100 Feet Road, HAL 2nd Stage', 'Indiranagar',
   (SELECT id FROM users WHERE number = 314), now() - interval '4 days', now() - interval '1 day'),
  ('BLR-0998', 'Drain overflowing after rain',
   'Water reaches the road after even a short spell of rain.',
   'drainage', 'open', 12.9601, 77.6484, '1st Cross, Kodihalli', 'Kodihalli',
   (SELECT id FROM users WHERE number = 565), now() - interval '5 days', NULL);

-- Helper: the first N anonymous neighbours vote on an issue.
INSERT INTO issue_votes (issue_id, user_id)
SELECT 'BLR-1042', id FROM users WHERE number BETWEEN 1 AND 38;
INSERT INTO issue_votes (issue_id, user_id)
SELECT 'BLR-1038', id FROM users WHERE number BETWEEN 1 AND 21;
INSERT INTO issue_votes (issue_id, user_id)
SELECT 'BLR-1021', id FROM users WHERE number BETWEEN 1 AND 54;
INSERT INTO issue_votes (issue_id, user_id)
SELECT 'BLR-1007', id FROM users WHERE number BETWEEN 1 AND 29;
INSERT INTO issue_votes (issue_id, user_id)
SELECT 'BLR-0998', id FROM users WHERE number BETWEEN 1 AND 17;

INSERT INTO resolution_votes (issue_id, user_id)
SELECT 'BLR-1042', id FROM users WHERE number BETWEEN 1 AND 2;
INSERT INTO resolution_votes (issue_id, user_id)
SELECT 'BLR-1021', id FROM users WHERE number BETWEEN 1 AND 6;
INSERT INTO resolution_votes (issue_id, user_id)
SELECT 'BLR-1007', id FROM users WHERE number BETWEEN 1 AND 18;
INSERT INTO resolution_votes (issue_id, user_id)
SELECT 'BLR-0998', id FROM users WHERE number BETWEEN 1 AND 1;

COMMIT;
