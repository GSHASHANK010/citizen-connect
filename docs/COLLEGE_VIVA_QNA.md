# Citizen Connect — College Viva Questions and Simple Answers

This sheet contains questions a teacher may ask during a project demonstration or viva. The answers are intentionally simple. Understand the idea instead of memorizing every sentence word for word.

When answering:

1. Start with one direct sentence.
2. Give one example from Citizen Connect.
3. Be honest about what is built and what still needs to be built.

---

## Project introduction

### 1. What is the name of your project?

The project is called **Citizen Connect**. It is a Bengaluru-focused platform where residents can report and track public-infrastructure problems on a map.

### 2. What problem does Citizen Connect solve?

People see potholes, broken streetlights, garbage, damaged footpaths, and drainage problems, but they may not know where to report them or who is responsible. Citizen Connect puts the issue, location, evidence, community support, and responsible authority in one place.

### 3. Who are the intended users?

The main users are Bengaluru residents. Government departments, ward-level officials, elected representatives, and community organizations could also use the reports to understand local problems.

### 4. Why did you restrict it to Bengaluru?

Starting with one city keeps the first version focused. Bengaluru also has its own wards, city corporations, constituencies, and civic authorities, so the location and authority data must be designed specifically for the city.

### 5. Explain the project in one sentence.

Citizen Connect lets a Bengaluru resident capture a civic problem using a live photo and live location, place it on a public map, and let the community track and confirm its resolution.

### 6. What are the main features?

- Interactive issue map.
- Search and category/status filters.
- Live-camera evidence.
- Mandatory fresh location for every report.
- Bengaluru boundary validation on both the browser and the server.
- Community voting with one vote per neighbour, enforced by the database.
- Majority-based resolution confirmation, decided on the server.
- Shareable report links.
- Neighbours can flag a report; a moderator with a secret token can hide it or mark it acknowledged.
- Civic authority, MLA, and MP directory (approximate nearest-locality lookup).
- OpenStreetMap with optional Google Maps support.
- Express REST API with PostgreSQL storage, rate limits, and security headers.
- Hosted as one service (web app plus API) on Render with a Neon database.

### 7. What makes this different from a normal complaint form?

A normal form is usually private and isolated. Citizen Connect connects the complaint to a map, makes public issues visible to neighbours, shows community support, and tracks whether people agree that the issue was fixed.

### 8. Is this project completely finished?

The frontend and a working backend are complete. Reports, votes, flags, and photos are stored by an Express API in PostgreSQL, and the database enforces one vote per neighbour. There are basic rate limits and a token-protected moderation API. A public production version still needs verified user accounts (phone or email), automatic face and number-plate blurring, a moderation screen, and official government boundary/contact data.

This is a good answer because it is honest. Do not claim that an anonymous per-browser identity is the same as a verified user account.

---

## Technology choices

### 9. Which technologies did you use?

I used React with JavaScript for the interface, Tailwind CSS for styling, Vite for development and building, Leaflet for map interaction, and OpenStreetMap for the default map data. Google Maps is also supported as an optional provider. The backend is Node.js with Express (plus `helmet` and `express-rate-limit`), PostgreSQL 16 for the database, and Docker to run the database locally and to package the app for hosting. The hosted version runs on Render with a Neon PostgreSQL database.

### 10. Why did you choose React?

The screen has many parts that change independently, such as filters, map markers, report details, votes, and a multi-step form. React makes it easier to divide them into components and update the screen when state changes.

### 11. Could you build it using only HTML, CSS, and JavaScript?

Yes, but managing many UI updates manually would become harder. React is still JavaScript; it provides a structured way to build and update reusable interface components.

### 12. What is JSX?

JSX is HTML-like syntax written inside JavaScript. React converts it into normal JavaScript instructions that create browser elements.

Example:

```jsx
<button onClick={openReportModal}>Report an issue</button>
```

### 13. Why did you use Tailwind CSS?

Tailwind provides small reusable CSS classes. It makes responsive styling faster and keeps the spacing, colors, and typography consistent across components.

### 14. Does Tailwind replace CSS completely?

No. Most interface styles use Tailwind classes, but custom marker styles, animations, Leaflet overrides, and global styles are written in `src/styles.css`.

### 15. What is Vite?

Vite is the tool that starts the local development server and creates the optimized production build. It also refreshes the page quickly when code changes.

### 16. What is npm?

npm is the package manager used to install and manage project libraries. The required packages and commands are listed in `package.json`.

### 17. What does `npm install` do?

It reads `package.json` and downloads the required packages into the `node_modules` folder.

### 18. What does `npm run dev` do?

It starts the Vite development server so the web app can be opened locally in a browser. `npm run dev:all` starts the API and the web app together, after `npm run db:up` has started the database.

### 19. What does `npm run build` do?

It creates an optimized production version of the application in the `dist` folder. `npm start` runs that build and then starts the API, which serves `dist` and the `/v1` endpoints from one address.

### 20. What does linting mean?

Linting checks the source code for common mistakes and inconsistent patterns. This project uses ESLint and runs it with `npm run lint`.

---

## React questions

### 21. What is a React component?

A component is a JavaScript function that returns part of the interface. For example, `IssueCard` displays one civic issue and `MapView` displays the selected map provider.

### 22. Why did you divide the project into components?

Each component has one main responsibility. This makes the code easier to understand, test, reuse, and change without editing one very large file.

### 23. What are props?

Props are values passed from a parent component to a child component.

For example, `App` passes an issue and an `onVote` function to `IssueCard`.

```jsx
<IssueCard issue={issue} onVote={handleAffectedVote} />
```

### 24. What is state?

State is information that can change while the application is running. When state changes, React updates the relevant part of the interface.

Examples are the selected issue, search text, user location, open report modal, and issue list.

### 25. What is the difference between props and state?

State is owned and changed by a component. Props are values a component receives from its parent.

### 26. What is `useState`?

`useState` is a React Hook that creates a state value and a function to change it.

```jsx
const [searchText, setSearchText] = useState('')
```

### 27. What is `useEffect`?

`useEffect` runs code when React must synchronize with something outside normal rendering.

This project uses effects for:

- Loading every report from the API when the app opens.
- Creating and removing maps.
- Updating map markers.
- Loading civic-directory information.

### 28. Why does an effect sometimes return a function?

The returned function is cleanup. It stops or removes something created by the effect, such as a camera stream, map instance, or outdated network request.

### 29. What is `useRef`?

`useRef` stores a value without causing another render. It is useful for real browser or library objects such as a video element, camera stream, Leaflet map, or marker layer.

### 30. What is `useMemo`?

`useMemo` remembers a calculated value until its dependencies change. Citizen Connect uses it for filtered issues.

### 31. What does “lifting state up” mean?

It means shared state is kept in the nearest common parent. `App.jsx` owns the shared issue list and user position, then passes them to the sidebar, map, details panel, and report form.

### 32. Why should React state not be changed directly?

React may not detect a direct mutation. We create a new array or object and use the setter function so React knows the interface must update.

Wrong:

```js
issues.push(newIssue)
```

Correct:

```js
setIssues((currentIssues) => [newIssue, ...currentIssues])
```

### 33. Why do list items need a `key`?

The key helps React identify which item was added, removed, or updated. Citizen Connect uses the unique issue ID as the key.

### 34. Why is `App.jsx` important?

`App.jsx` is the coordinator. It owns shared state, handles major actions (including `handleFlag`), calculates visible reports, and connects the header, sidebar, map, details panel, report modal, and the "How it works" modal. It also tracks whether the mobile list overlay (`isMobileListOpen`) and the help modal (`isHowItWorksOpen`) are open.

---

## Map questions

### 35. What is OpenStreetMap?

OpenStreetMap is open geographic map data created and maintained by contributors around the world.

### 36. Is OpenStreetMap completely free?

The map data is open, but the public tile servers are a shared service with usage rules and no guaranteed service level. For a large production app, we should use a suitable hosted tile provider or host our own tiles.

### 37. What is Leaflet?

Leaflet is an open-source JavaScript library used to display interactive maps, tiles, markers, zoom controls, and map movement.

### 38. Why do you need Leaflet if you already use OpenStreetMap?

OpenStreetMap provides geographic data and tiles. Leaflet is the JavaScript library that displays and controls them in our web application.

### 39. Why does the project support both OpenStreetMap and Google Maps?

OpenStreetMap allows development without a Google key and provides an open-data option. Google Maps can be enabled later if its services or map style are preferred.

### 40. Do you need a Google Maps API key during development?

No. OpenStreetMap is the working default. A Google key and map ID are only required when the Google Maps layer is selected.

### 41. What is a Google Maps API key?

It is a project identifier that authorizes the browser to use enabled Google Maps services. It should be restricted to approved APIs and website domains.

### 42. Why can users see a Google Maps browser key?

Browser JavaScript must download it to call Google Maps. Security comes from API restrictions, allowed website referrers, quotas, and billing alerts—not from hiding the browser key.

### 43. What is a map marker?

A map marker is a visual point connected to a latitude and longitude. Citizen Connect uses colored markers for civic issues and a blue marker for the user’s live position.

### 44. How do all map providers use the same issues?

Every report stores its location in a simple provider-independent format:

```js
position: {
  lat: 12.9718,
  lng: 77.6412
}
```

`MapView` sends the same issue and position data to OpenStreetMap, Google Maps, or the preview map.

### 45. What does `MapView` do?

`MapView` remembers the selected provider, checks whether Google Maps is configured, displays the correct map component, and shows the map-layer controls.

### 46. Why is OpenStreetMap attribution displayed?

The OpenStreetMap license requires visible credit to OpenStreetMap contributors. Removing it would violate the usage requirements.

---

## Location questions

### 47. How does the application get the user’s location?

It uses the browser Geolocation API:

```js
navigator.geolocation.getCurrentPosition(...)
```

The browser asks the user for permission before sharing the position.

### 48. Why do you request a fresh location for every report?

It reduces false or incorrectly placed reports. The report must be connected to where the resident is currently standing, not an old map position.

### 49. What does `maximumAge: 0` mean?

It tells the browser that the application wants a fresh reading instead of intentionally accepting a cached position.

### 50. Can the application force the permission popup to appear every time?

No. The browser controls permission prompts and may remember the user’s earlier choice. Citizen Connect still requests a fresh position for every report.

### 51. Why does location work on localhost but may fail on an ordinary HTTP website?

Location and camera are sensitive browser features. Production browsers normally require HTTPS, while localhost is treated as secure for development.

### 52. How do you check that a location is in Bengaluru?

Both the browser (`src/lib/location.js`) and the server (`server/src/lib/geo.js`) check whether the latitude and longitude fall inside a rough Bengaluru rectangle. The server check is the one that counts. A production version should use an official GBA polygon for accurate validation.

### 53. What is latitude and longitude?

Latitude represents north/south position and longitude represents east/west position. Together they identify a point on Earth.

### 54. How does the blue location marker appear?

The report form captures a position and calls `onLocationCaptured`. `App` saves it as `userPosition`. `MapView` passes it to the active map, which creates the blue marker and recenters.

### 55. What happens if the user is outside Bengaluru?

The form shows an outside-coverage message and does not enable the next reporting step.

### 56. What happens if location permission is denied?

The application shows an error and keeps report progression disabled. It does not silently use a different location.

---

## Camera questions

### 57. How does live-camera capture work?

The application uses `navigator.mediaDevices.getUserMedia` to request a camera stream. It shows the stream in a `<video>` element and copies the current frame into a temporary `<canvas>` when the user presses the shutter.

### 58. Why do you use a canvas?

Canvas lets the application capture one frame from the live video, resize it, and convert it into a compressed JPEG image.

### 59. Why is gallery upload not available?

The project requires live evidence to make it harder to upload an unrelated old photo. This does not completely prevent fraud, so production moderation is still necessary.

### 60. Why do you request `audio: false`?

The project only needs an image. It should not request microphone permission when audio is unnecessary.

### 61. Why do you stop the camera tracks?

Stopping tracks releases the physical camera and removes the browser’s active-camera indicator. The project stops them after capture and when the component closes.

### 62. How large is the captured photo?

The browser resizes it to a maximum width of 960 pixels and sends it to the API as a compressed JPEG data URL inside the JSON body. The server decodes it and stores the bytes in the `photos` table (or as a file in `server/uploads/` when `PHOTO_STORAGE=disk`).

### 63. What photo privacy protection is still needed?

Before public launch, the system should remove unnecessary metadata and automatically blur faces and vehicle number plates before publishing images.

---

## Issue and voting questions

### 64. What information does one issue contain?

An issue contains an ID, title, description, category, status, vote counts, resolution threshold, creation time, address, locality, latitude/longitude, reporter label ("Neighbour #N"), a photo URL, and booleans saying whether the current viewer has voted, confirmed, or flagged it.

### 65. What issue categories are supported?

The project includes potholes, streetlights, garbage, footpaths, drainage, and other issues. Categories are listed in `src/data/issues.js` for the interface and in `CATEGORY_IDS` in `server/src/lib/issues.js` for server validation.

### 66. What statuses are supported?

- `open`: reported but not fixed.
- `in-progress`: acknowledged or being handled. Shown as "Acknowledged". Only a moderator can set it, through `POST /v1/admin/issues/:id/status`.
- `resolved`: confirmed fixed by the community (or set by a moderator).

### 67. What is the difference between the two vote types?

“This affects me” shows how many residents are affected. “I can confirm it is fixed” is used to decide whether the issue can be marked resolved.

### 68. How is the resolution majority calculated?

The project requires more than half of the affected votes and at least three fix confirmations. The calculation runs on the server in `server/src/lib/issues.js` and the result is sent to the browser as `resolutionThreshold`.

```js
Math.max(3, Math.floor(votes / 2) + 1)
```

### 69. Give an example of the resolution calculation.

If an issue has 38 affected votes, more than half is 20. Therefore, it needs 20 residents to confirm that it is fixed.

### 70. Why require a majority to resolve an issue?

One person may close a report incorrectly. Requiring several community confirmations makes false closure harder.

### 71. Is the current voting system secure?

Partly. The server stores one vote per neighbour per report, and the database primary key makes a duplicate impossible. Per-IP rate limits slow down automation (600 requests per 15 minutes, 30 sessions per hour). What is still missing is verified identity (today one browser is one neighbour) and an audit history.

### 72. Can someone repeatedly click the vote button now?

They can click, but it does not add votes. “This affects me” toggles: the first click adds a vote and the second removes it. “I can confirm it is fixed” is one-way, so repeated clicks do nothing. The button is also disabled while its request is in flight.

### 73. Where is the resolution formula stored?

The authoritative copy is `getResolutionThreshold` in `server/src/lib/issues.js`, because only the server may change a report's status. The server sends the result as `resolutionThreshold`, and the frontend displays that value. `src/lib/issues.js` keeps a mirror of the formula only as a fallback for display.

---

## Data and storage questions

### 74. Where are the demo issues stored?

They are inserted by `server/sql/seed-demo.sql` into the PostgreSQL `issues` table when the API starts with an empty `issues` table and `SEED_DEMO_DATA` is not `false`. The locality list comes from `server/sql/seed-localities.sql`, which runs on every start. `src/data/issues.js` now holds only the categories and fallback representative contacts.

### 75. Where are new reports stored?

The browser sends them to `POST /v1/issues`. The server stores the report as a row in the `issues` table and the photo as a row in the `photos` table. Every visitor then sees the report through `GET /v1/issues`.

### 76. What is `localStorage`?

It is a small key/value storage area inside one browser profile. Citizen Connect uses it for only two things: the anonymous session token (`citizen-connect-session-v1`) and the preferred map provider.

### 77. Why are reports not kept in `localStorage`?

- It only exists on one browser/device.
- The user can clear or modify it.
- It has a small size limit.
- Different citizens cannot share reports through it.

Shared data must live on the server, so reports and votes moved to PostgreSQL.

### 78. Why are photos stored in the database and not in `localStorage` or on disk?

A photo arrives as a long text data URL, which is larger than the binary image. Storing it in a browser would hit the small quota and nobody else could see it. The server decodes it once into binary and inserts it into a separate `photos` table (`id`, `content_type`, `bytes`). The `issues` row stores only `photo_url`, which points at `/v1/photos/<id>`. Keeping the bytes in PostgreSQL means the API has no files to lose when a hosting provider replaces the server. `PHOTO_STORAGE=disk` still writes files if a persistent disk is available.

### 79. What database do you use?

PostgreSQL 16, running in Docker through `docker-compose.yml` on a laptop and on Neon when hosted. It stores users, reports, votes, flags, photos, and approximate localities. For production, the PostGIS extension would be added so official ward and constituency polygons can be queried.

### 80. Where should production photos be stored?

Today they are rows in the `photos` table, which is enough for a pilot and keeps the API stateless. A large deployment should move them to private object storage with signed URLs. In both cases the `issues` row stores only the image URL.

---

## MLA, MP, ward, and authority questions

### 81. How will the application find the MLA or MP for a report?

The backend will compare the report coordinate with official Assembly and Parliamentary constituency polygons. It will return the representative connected to the matching boundary ID.

### 82. Why not find representatives using only the locality name?

Locality names are informal, overlap, and may cross official boundaries. Coordinates and official polygons provide a more accurate match.

### 83. What is a point-in-polygon query?

It checks whether one coordinate point lies inside a geographic boundary polygon. In this project, the point is the report and the polygons are wards or constituencies.

### 84. What is PostGIS?

PostGIS is an extension for PostgreSQL that adds geographic data types and spatial operations such as point-in-polygon checks.

### 85. Where will you get MLA and MP data?

The project should use authoritative public sources such as the Karnataka Legislative Assembly, Lok Sabha/Sansad, and Election Commission records.

### 86. Where will you get GBA authority information?

It should come from official Greater Bengaluru Authority and city-corporation directories, ward records, department pages, and published helplines.

### 87. Why are most contacts currently placeholders?

Representative and ward contact details can change and may contain personal information. The project avoids presenting unverified numbers as official facts.

### 88. How will you keep contacts accurate?

Every record should store an official source URL, verification date, effective dates, and import history. Stale records should be reviewed, hidden, or clearly marked.

### 89. Why is the GBA helpline included?

The official GBA helpline provides a safe general fallback when an exact verified ward or department contact is unavailable.

---

## Frontend and backend questions

### 90. What is a frontend?

The frontend is the part users see and interact with in the browser: forms, maps, buttons, filters, and report details.

### 91. What is a backend?

The backend is the trusted server-side system. It validates requests, manages users, stores shared data, controls votes, handles images, and communicates with the database.

### 92. Why does this project need a backend?

A browser cannot securely enforce identity, votes, moderation, shared persistence, or official-data correctness. Those responsibilities require a trusted server. The `server/` folder is that server: an Express API in front of PostgreSQL.

### 93. What is an API?

An API is a defined way for the frontend and backend to exchange data, usually through HTTP requests and JSON responses.

### 94. Give an example API for this project.

```text
GET /v1/civic-area?lat=12.9718&lng=77.6412
```

This returns the nearest known locality with its corporation, Assembly Constituency, Parliamentary Constituency, the verified GBA helpline, and a note that the match is approximate. A production version would use official polygons.

### 95. What is JSON?

JSON is a text format for exchanging structured data. It looks similar to a JavaScript object.

### 96. Which operations does the API provide?

Already built:

- `POST /v1/session`: create an anonymous neighbour.
- `GET /v1/issues` and `GET /v1/issues/:id`: read reports.
- `POST /v1/issues`: create a report with its photo.
- `POST /v1/issues/:id/votes`: add or remove the viewer's vote.
- `POST /v1/issues/:id/resolution-votes`: add a resolution confirmation.
- `POST /v1/issues/:id/flags`: flag a report for review (one per neighbour).
- `GET /v1/photos/:id`: read a photo from the database.
- `GET /v1/civic-area`: look up the nearest locality and contacts.
- `GET /v1/admin/issues?flagged=true`, `POST /v1/admin/issues/:id/hide`, `POST /v1/admin/issues/:id/status`: moderator endpoints behind the `X-Admin-Token` header.
- `GET /health`: checks the API and runs `SELECT 1` on the database.

Still needed for production: server-side search, merging duplicates, reopening, and audit endpoints.

### 97. What is authentication?

Authentication proves who a user is, for example through a verified phone number, email, or trusted login provider. Citizen Connect currently uses a lighter form: an anonymous random token per browser, which proves "the same browser as before" but not a real identity.

### 98. What is authorization?

Authorization decides what an authenticated user is allowed to do. For example, a resident can vote and flag, while only a caller with the correct `X-Admin-Token` header may hide a report or change its status.

---

## Security, privacy, and ethics

### 99. What sensitive data does the project use?

It uses precise location and camera evidence. These must be treated carefully because they can reveal where a person was and may capture faces, vehicles, or homes.

### 100. How do you protect the reporter’s identity?

The public issue should show the problem, not unnecessary personal identity. A production system should minimize collected data and keep account details separate from public report content.

### 101. What is input validation?

Input validation checks whether submitted data is allowed and correctly formatted. The frontend checks required fields and length, but the backend must repeat every important validation.

### 102. Why must the backend validate again?

Users can modify frontend JavaScript or call an API directly. Therefore, frontend checks improve usability but cannot provide security.

### 103. What abuse could happen?

- Fake or duplicate reports.
- Spam and automated voting.
- Unrelated or offensive photos.
- False resolution confirmations.
- Harassment through descriptions.
- Exposure of faces, plates, or private information.

### 104. How would you reduce fake reports?

Use verified accounts, fresh location, live evidence, rate limits, duplicate detection, moderation, device/account reputation, and a community reporting system.

### 105. How would you handle duplicate reports?

The backend could compare category, distance, time, and image similarity. It could suggest that the user support an existing nearby issue instead of creating another one.

### 106. Should the exact reporter location always be public?

The issue needs a useful map position, but the system should avoid exposing more precision than necessary and should never publish a resident’s movement history.

### 107. What legal or ethical review may be required?

The project should receive appropriate privacy, data-retention, moderation, accessibility, and legal review before handling real public data in India.

---

## Testing and quality questions

### 108. How did you test the project?

I used ESLint for code checks, `npm test` (Node's built-in `node --test`) for unit tests of the frontend rules and the server logic, Vite’s production build to confirm bundling, and browser interaction checks for loading, searching, issue selection, voting, resolution confirmation, map switching, and report-form validation.

### 109. What is manual testing?

Manual testing means a person uses the application and checks whether the visible behavior is correct.

### 110. What is automated testing?

Automated testing uses code to repeat checks and compare actual results with expected results.

### 111. What tests should be added next?

- Component tests for the report steps.
- Integration tests that call the API against a test database.
- Browser tests for complete user journeys.
- Accessibility tests.
- Backend security and load tests.

### 112. What is a unit test?

A unit test checks one small function in isolation. For example, it can verify that 38 affected votes require 20 resolution confirmations.

### 113. How do you know the project can build for production?

`npm run build` completes successfully and creates optimized files in the `dist` folder.

### 114. What is responsive design?

Responsive design makes the interface adapt to different screen sizes. Citizen Connect has a sidebar layout on larger screens and map-focused controls on mobile screens.

### 115. What accessibility work is already present?

Buttons have readable labels, images have alternate text, interactive controls use real button elements, the modal identifies itself as a dialog, and map markers include accessible names.

### 116. What accessibility work can be improved?

The project still needs deeper keyboard testing, focus trapping and restoration for the modal, screen-reader testing, contrast review, reduced-motion support, and clear validation announcements.

---

## Architecture and code-quality questions

### 117. How is the code organized?

- `src/components`: visible interface pieces.
- `src/data`: categories and fallback contacts.
- `src/lib`: plain business rules, browser APIs, and the API client (`api.js`).
- `src/App.jsx`: shared state, API calls, and coordination.
- `server/src`: Express routes (including `admin.js` and `photos.js`), database access, validation, and auth.
- `server/sql`: schema, locality seed, and demo seed.
- `docs`: learning, civic-data, hosting, and viva documentation.
- Root `Dockerfile` and `.env.production`: package the web app and API as one deployable service.

### 118. Why are business rules separated from components?

Rules such as filtering and resolution calculations do not need React. Keeping them in plain JavaScript makes them easier to understand, reuse, and test.

### 119. What is separation of concerns?

It means different parts of the system have different responsibilities. For example, the map displays coordinates, the report form collects evidence, and the backend will enforce identity and security.

### 120. What is an adapter?

An adapter hides the details of an external service behind one consistent function. `civicDirectory.js` calls the API's `/v1/civic-area` endpoint and falls back to labelled sample data when the API is unreachable. The issue-details component does not know which one it received.

### 121. Why do map components use refs?

Leaflet and Google Maps create their own map and marker objects. Refs let React keep access to those objects without trying to store them as visible UI state.

### 122. Why is cleanup important?

Without cleanup, camera tracks, maps, event listeners, markers, or old network results can remain active and cause memory leaks or incorrect behavior.

### 123. What was a technical challenge in this project?

A strong answer is:

> Connecting browser-controlled features such as camera and location with React state and external map libraries was challenging. I solved it by separating each responsibility, using refs for external objects, effects for setup and cleanup, and shared state in `App` for the user position.

Another valid example is the Leaflet stacking issue, where internal map layers initially covered React overlays. It was fixed by isolating the Leaflet stacking context in CSS.

### 124. Why is the code written in a beginner-readable style?

The project uses descriptive names, small components, expanded JSX, focused comments, and plain JavaScript helpers. This makes the code teachable without removing good engineering practices.

---

## Limitations and future scope

### 125. What are the current limitations?

- Identity is one anonymous token per browser, not a verified person.
- Only per-IP rate limits; no further bot protection.
- Photos are rows in PostgreSQL, not private object storage, and are not blurred.
- Civic lookup matches the nearest neighbourhood centre, not official polygons.
- Civic contacts are mostly placeholders.
- Bengaluru validation uses a rough rectangle.
- Moderation is a token-protected API used with `curl`; there is no moderation screen or duplicate detection.
- No real department notification workflow.

### 126. What is the first feature you would build next?

A good answer is:

> The report API, PostgreSQL storage, rate limits, and a first moderation API already exist, so I would add phone or email verification on top of the existing `users` table, then a moderation screen on top of the `/v1/admin` endpoints, because trustworthy identity is what every other safety feature depends on.

### 127. How would you scale the project?

Use a backend API, database indexes, object storage, a production tile provider, caching, background moderation jobs, rate limiting, monitoring, and separate deployment environments.

### 128. How would authorities receive reports?

The backend could route reports by issue category and official geographic boundary. It could provide authority dashboards and send email, SMS, or API notifications while keeping an audit trail.

### 129. How would you notify residents?

Residents could follow a report and receive updates when it is acknowledged, assigned, resolved, reopened, or commented on.

### 130. How would you support more cities?

Store city configuration, boundaries, authority types, categories, and contact sources as data instead of hardcoding Bengaluru rules. Each city would require authoritative boundary and department mappings.

### 131. Could this become a mobile application?

Yes. It can first be made a Progressive Web App, or the same backend could support a React Native or native mobile client. Camera, location, notifications, and offline behavior would need platform-specific work.

### 132. What is your project’s future vision?

The long-term goal is a trusted public infrastructure map where residents can report issues easily, authorities can route and update work, and communities can verify real outcomes.

---

## Questions based on a live demonstration

### 133. Show where the sample data is stored.

Open `server/sql/seed-demo.sql` for the five demo reports, `server/sql/seed-localities.sql` for the locality list, and `server/sql/schema.sql` for the tables. Then open `src/data/issues.js` and show `CATEGORIES` and the fallback `SAMPLE_REPRESENTATIVES`.

### 134. Show where the issue list is filtered.

Open `src/lib/issues.js` and show `filterIssues`. Then show where `App.jsx` calls it inside `useMemo`.

### 135. Show where a report is created.

Show the submission in `ReportModal.jsx`, then follow the `onSubmit` prop to `handleCreateIssue` in `App.jsx`, `createIssue` in `src/lib/api.js`, and finally the `POST /` handler in `server/src/routes/issues.js` where the row is inserted.

### 136. Show where fresh location is requested.

Open `src/components/report/ReportEvidenceStep.jsx` and show `requestFreshLocation`. Then open `src/lib/location.js` and show `getCurrentPosition` with `maximumAge: 0`.

### 137. Show how location reaches the map.

Follow this path:

```text
ReportEvidenceStep
→ onLocationCaptured
→ App.setUserPosition
→ MapView
→ OpenStreetMap or GoogleMap
→ blue location marker
```

### 138. Show where the camera is stopped.

Open `ReportEvidenceStep.jsx`, find `stopCamera`, and show the `useEffect` cleanup and the call after capturing a frame.

### 139. Show the resolution formula.

Open `server/src/lib/issues.js` and show `getResolutionThreshold`. Then open `server/src/routes/issues.js` and show the `resolution-votes` handler that counts confirmations and sets `status = 'resolved'`.

### 140. Show how OpenStreetMap and Google Maps are switched.

Open `src/components/MapView.jsx` and show `selectedProvider`, `chooseProvider`, `getAvailableProvider`, and `ActiveMap`.

### 141. Show how reports remain after refresh.

Open `App.jsx` and show `loadIssues`, which calls `fetchIssues` from `src/lib/api.js` when the app opens. Then run `npm run db:shell` and `SELECT id, title FROM issues;` to show the same reports in PostgreSQL. Explain that any browser sees them because they live on the server.

### 142. Show where civic authority lookup connects.

Open `src/lib/civicDirectory.js` and show the call to `fetchCivicArea`. Then open `server/src/routes/civic.js` to show the nearest-locality lookup, and `docs/CIVIC_DATA_PLAN.md` for the official-polygon design.

---

## Difficult follow-up questions

### 143. What happens if two reports get the same generated ID?

They cannot. IDs come from a PostgreSQL sequence (`issue_number_seq`, starting at 1100), so each new report gets the next number, such as `BLR-1100`, and `id` is the table's primary key.

### 144. What happens if GPS accuracy is poor?

The browser returns an accuracy value and the server stores it in the `accuracy` column, but no maximum is enforced yet. Production should display accuracy, reject very inaccurate readings, or allow a carefully controlled confirmation step.

### 145. What if someone reports from inside a building next to the problem?

Strict live location can still be slightly different from the exact issue position. A future design could capture live location, show the accuracy radius, and allow a small nearby adjustment while recording both original and adjusted positions.

### 146. Can live-camera-only evidence still be faked?

Yes. No client-side control completely prevents manipulation. It raises the effort, but verified identity, server checks, metadata analysis, duplicate detection, and moderation are still needed.

### 147. What if the majority incorrectly marks an issue resolved?

Production should allow reopening with new live evidence, track every status change, detect suspicious voting, and allow moderator or authority review.

### 148. What if an MLA or official changes?

Representative records should have start and end dates. New records should be added without deleting history, so older reports keep the correct historical context.

### 149. Why not send reports directly to every official immediately?

Unverified reports could create spam. The system should deduplicate, moderate, route by responsibility, and use agreed official channels before sending notifications.

### 150. Why is a frontend API key different from a backend secret?

A frontend key is downloaded by the browser and must be restricted by allowed APIs and domains. A backend secret stays on the server and must never be included in frontend code.

---

## Backend and database questions

### 151. Why did you add a backend?

The first version kept reports in one browser, so no two residents could see the same data and anyone could click the vote button many times. A backend gives one shared source of truth and a place to enforce rules the browser cannot.

### 152. What is REST?

REST is a style of API where each URL names a resource and the HTTP method says what to do. `GET /v1/issues` reads reports, `POST /v1/issues` creates one, and `POST /v1/issues/BLR-1042/votes` acts on one report's votes.

### 153. What is Express?

Express is a small Node.js library for building web servers. It matches each incoming request to a route function, such as the `POST /:id/votes` handler in `server/src/routes/issues.js`, and sends back a JSON response.

### 154. Why PostgreSQL instead of `localStorage`?

`localStorage` lives inside one browser. PostgreSQL runs on the server, so every visitor reads the same rows. It also enforces rules such as primary keys and foreign keys, and it supports transactions.

### 155. What are Docker and docker-compose?

Docker runs software in an isolated container with everything it needs. `docker-compose.yml` describes our containers: a `db` service running `postgres:16-alpine` with a named volume so data survives restarts. `npm run db:up` starts it; nobody has to install PostgreSQL by hand.

### 156. What is a primary key and how does it prevent double voting?

A primary key is a column or set of columns that must be unique in a table. `issue_votes` has `PRIMARY KEY (issue_id, user_id)`, so the same neighbour and the same report can appear together only once. PostgreSQL rejects a second row, even if two requests arrive at the same instant or bypass the frontend.

### 157. What is a transaction?

A transaction groups several SQL statements so that either all of them happen or none do. The vote toggle deletes, then inserts if nothing was deleted, then re-reads the issue, all inside `withTransaction` in `server/src/db.js`. If a step fails, the database rolls back the others.

### 158. How does the server know who is voting without a login?

On first visit the browser calls `POST /v1/session`. The server creates a `users` row and returns a random token. The browser stores it in `localStorage` and sends it as `Authorization: Bearer <token>` with every request. The server looks up the user by that token.

### 159. Why do you hash the token before storing it?

The database stores only the SHA-256 hash (`server/src/lib/auth.js`). If someone copied the database they would have hashes, not tokens, so they could not impersonate any neighbour. It is the same principle as never storing plain passwords.

### 160. What are the limits of this anonymous identity?

It identifies a browser, not a human. Clearing site data, using another device, or a private window creates a new "Neighbour #N", so one person could vote more than once by switching browsers. A public launch should add phone or email verification on top of the same `users` table.

### 161. How are photos stored?

The browser sends the JPEG as a data URL inside the JSON body (the server accepts bodies up to 4 MB). `savePhotoFromDataUrl` decodes it into binary and, by default, inserts it into the `photos` table. The `issues` row stores only `photo_url`, which is `/v1/photos/<id>`, and `server/src/routes/photos.js` serves the bytes with a 7-day cache header. With `PHOTO_STORAGE=disk` the old behaviour applies: a file under `UPLOAD_DIR`, served at `/uploads/`.

### 162. How is the majority threshold applied on the server?

After inserting a confirmation, the server counts rows in `issue_votes` and `resolution_votes` for that report inside the same transaction. If confirmations are at least `max(3, floor(votes / 2) + 1)`, it updates the issue to `resolved` and records `resolved_at`. The browser never sends counts or status.

### 163. How does the frontend stay in sync with the server after a vote?

Every vote endpoint returns the complete updated issue. `App.jsx` calls `replaceIssue` to swap that copy into state, so counts, `viewerHasVoted`, and status all come from the database. While the request is in flight the issue ID sits in `pendingIssueIds` and the button is disabled.

### 164. How does the API create its tables?

On every start `server/src/index.js` waits for the database, runs `server/sql/schema.sql` (every statement is `CREATE ... IF NOT EXISTS`, so it is safe to repeat), runs `seedLocalities()` with `server/sql/seed-localities.sql` (idempotent through `ON CONFLICT`), and runs `seedDemoDataIfEmpty()` with `server/sql/seed-demo.sql` only if the `issues` table is empty and `SEED_DEMO_DATA` is not `false`. Then it checks the upload folder and listens.

### 165. How would you inspect the data during the demo?

Run `npm run db:shell` to open `psql` inside the Docker container, then `SELECT * FROM issue_votes;`. Click “This affects me” in the browser and run the query again to show the row appear, then disappear on the second click.

### 166. What would still be needed for production?

Verified identity, stronger bot protection on top of the rate limits, a moderation screen with face and number-plate blurring, object storage for photos at larger scale, an audit history of status changes, notifications, PostGIS polygons for official boundaries, and separate deployment environments.

### 167. Why are photos stored in the database instead of on the server's disk?

Hosting providers such as Render give the API a disk that is wiped on every deploy. Files saved there would vanish. With `PHOTO_STORAGE=database` (the default) the bytes go into the `photos` table, so everything the app needs lives in PostgreSQL and the API is stateless. The issue stores `/v1/photos/<id>`, and `GET /v1/photos/:id` sends the bytes with a 7-day cache header. `PHOTO_STORAGE=disk` is still available for a server with a persistent disk.

### 168. How does moderation work?

A neighbour calls `POST /v1/issues/:id/flags` with a reason. The `issue_flags` table has `PRIMARY KEY (issue_id, user_id)`, so one neighbour can flag a report once. A moderator calls `GET /v1/admin/issues?flagged=true` to see flagged reports with their `flagCount`, then `POST /v1/admin/issues/:id/hide` with `{ "hidden": true }`. That sets `issues.hidden_at`, and hidden reports disappear from every public endpoint and answer `404`. `POST /v1/admin/issues/:id/status` with `{ "status": "in-progress" }` marks a report "Acknowledged".

### 169. Why does the moderator use a token header instead of a login?

There is no account system yet, so a single shared secret is the simplest safe option. The moderator sends `X-Admin-Token`, and `requireAdmin` in `server/src/lib/auth.js` compares it with the `ADMIN_TOKEN` environment variable using `timingSafeEqual`, which does not leak how many characters matched. A wrong token gets `403`; if `ADMIN_TOKEN` is not set at all the endpoints answer `503`, so moderation is off until a secret exists. The token never appears in frontend code.

### 170. What is rate limiting and where is it applied?

Rate limiting caps how many requests one client may send in a time window. `express-rate-limit` in `server/src/app.js` allows 600 requests per 15 minutes per IP on `/v1`, 30 new sessions per hour, and 12 new reports per hour. Over the limit, the API answers `429`. Behind a hosting proxy `TRUST_PROXY=1` tells Express to read the visitor's real IP from the proxy header, otherwise every visitor would share the proxy's IP and one limit.

### 171. How does one service serve both the frontend and the API?

`npm run build` creates `dist/`. When `app.js` finds that folder (or `WEB_DIST`), it serves the files with `express.static` and sends `index.html` for any unknown path, so React's routing still works. The same process also answers `/v1/...`. Because both come from one address, `.env.production` sets `VITE_API_URL` empty and `src/lib/api.js` calls the same origin, so there is no CORS to configure. `npm start` and the root `Dockerfile` both run this single service.

### 172. How is the app hosted?

Two free-tier services, described step by step in `docs/HOSTING_GUIDE.md`. Neon hosts the PostgreSQL database; its connection string with `?sslmode=require` becomes `DATABASE_URL`. Render builds the root `Dockerfile` and runs the one container with `SEED_DEMO_DATA=false`, `TRUST_PROXY=1`, and an `ADMIN_TOKEN`. On boot the API creates its tables and localities itself, so there is no manual database setup. Render gives the site HTTPS, which the camera and location APIs require.

---

## A short opening speech

You can begin the demonstration with:

> Good morning. My project is Citizen Connect, a Bengaluru-only civic infrastructure reporting platform. It helps residents report problems such as potholes, broken streetlights, garbage, footpath damage, and drainage issues using a live photo and fresh live location. Reports appear on an interactive OpenStreetMap, residents can show that an issue affects them, and the community can confirm when it has been fixed. The frontend is built with React, JavaScript, Tailwind CSS, Vite, Leaflet, and OpenStreetMap. The backend is an Express REST API with PostgreSQL, which stores every report and enforces one vote per neighbour through a database primary key. I have also designed the official civic-data architecture required for a public launch.

---

## A short closing speech

You can finish with:

> Citizen Connect demonstrates the complete resident experience and the full technical flow from live evidence, through a REST API, to a row in PostgreSQL and back onto a shared map. The next phase is to add verified users, a moderation screen on top of the existing flag and admin API, image redaction, PostGIS boundary data, verified GBA and constituency contacts, and official authority routing. The goal is not only to collect complaints, but to make civic problems visible, accountable, and verifiably resolved.

---

## Answers to avoid

Avoid saying:

- “OpenStreetMap has no rules because it is free.”
- “The Google API key is secret because it is in `.env`.”
- “React is a programming language.”
- “Tailwind means there is no CSS.”
- “localStorage is our database.” (It only holds the session token and map preference.)
- “The voting system cannot be abused.” (Duplicates are blocked, but identity is per browser.)
- “The session token is the same as a login.”
- “The current contacts are all live government data.”
- “Live camera makes fake reports impossible.”
- “The project is production-ready.”

Teachers often value a student who understands limitations more than someone who makes unrealistic claims.

---

## Last-minute revision list

Before the viva, be able to explain:

1. The problem and target users.
2. Why the project is Bengaluru-only.
3. React component, props, state, and effect.
4. OpenStreetMap versus Leaflet.
5. How fresh location reaches the blue marker.
6. How a video frame becomes a photo.
7. The majority resolution formula.
8. How the session token and the database primary key give one vote per neighbour.
9. Why MLA/MP lookup needs polygons.
10. Frontend versus backend responsibility.
11. Privacy and abuse risks.
12. Current limitations and the next development phase.

If you can explain those twelve points in your own words, you understand the project well enough to handle most follow-up questions.
