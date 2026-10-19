# SCOOP! — a little scoop of chaos

An original doodle-style ice-cream maze game. Play solo or in local two-player co-op, collect fruit, build and break ice walls, and outsmart Wanderers and Chasers across six levels. Optional accounts save progress and feed a casual leaderboard.

**Zero dependencies.** Node.js 20+ only (developed on Node 22). No `npm install`, no network needed.

## Run

```bash
node server.mjs          # http://127.0.0.1:3000
npm test                 # same as: node --test
```

Env vars (all optional, see `.env.example`): `PORT`, `HOST`, `DATA_DIR`, `NODE_ENV=production` (adds `Secure` to cookies; serve over HTTPS).

## Controls
| | Move | Make ice | Break ice |
|---|---|---|---|
| Pip (P1) | W A S D | F | G |
| Mallow (P2, co-op) | Arrow keys | / | . |

Solo: Pip also answers to the arrow keys, `/` and `.`. Pause: `P` or `Esc`. Ice appears in the cell you are **facing** (only on empty floor: not on walls, fruit, the exit, players or enemies). Ice blocks players and enemies; break it any time. Keyboard only (no touch controls yet).

## Structure
```
server.mjs            HTTP server: static files + API, same origin
server/               router, api routes, auth (scrypt, sessions), validation, security, JSON storage
public/index.html, styles.css, app.js, api.js
public/game/          constants, state, levels, engine (simulation), renderer, input, audio, score
public/ui/            screens, menus, hud, profile, leaderboard
tests/                node:test suites (game, levels, api)
data/                 runtime db.json (git-ignored)
```
The engine (`public/game/engine.js`, `levels.js`, `score.js`) has no DOM dependency; the server imports the same level data and score formula to validate submissions.

## API (`/api/v1`)
`GET /health` · `POST /auth/register|login|logout` · `GET /auth/me` · `GET|PATCH /profile` · `GET|PUT /progress` · `POST /progress/sync` · `POST /scores` · `GET /leaderboards` · `GET /leaderboards/levels/:levelId` · `GET /levels` · `GET /levels/:levelId`

Errors: `{"error":{"code","message","fields?","requestId"}}`. Leaderboards take `?page=&pageSize=`.

## Persistence
`data/db.json` (atomic tmp+rename writes). Guest progress lives in browser `localStorage` (lost if browser data is cleared). On login/register you are asked whether to merge local progress; merging takes the per-level max and never lowers account stars. Posting a score requires an account.

## Security notes
scrypt password hashing; random session tokens (only SHA-256 hashes stored), HTTP-only `SameSite=Strict` cookies; CSRF token header + Origin check on mutating requests; in-memory rate limits (auth, scores); 16 KB body limit; CSP and other headers; static server blocks traversal and dotfiles.
**Limitations:** the game is client-simulated, so scores can't be cheat-proof. The server recomputes score/stars from reported time, lives and fruit, and rejects implausible values, but a determined cheater can still submit plausible ones. Progress stars via `PUT/sync` are client-claimed. Rate limits reset on restart and are per-process. The JSON store is single-process only. Run behind HTTPS in production.

## Not done / future
Browser-level (Playwright) tests; touch controls; music and settings sliders; account deletion endpoint; PostgreSQL (replace `server/storage.mjs`, keep the API); online multiplayer (the pure engine is a good base for an authoritative server).
