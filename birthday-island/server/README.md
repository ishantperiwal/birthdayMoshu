# Private multiplayer island

Cloudflare Worker + one SQLite-backed Durable Object, with runtime assets hosted
on the same origin. There is no separate database service or paid container.

## Development

From this directory, run `npm ci`. Create an ignored `.dev.vars` with independent
random URL-safe tokens (at least 32 characters):

```
ISHIEE_TOKEN=your-local-ishiee-token
MOSHIEE_TOKEN=your-local-moshiee-token
```

Run `npm run dev`, then open separate browser tabs:

- `http://127.0.0.1:8787/?user=ISHIEE#invite=your-local-ishiee-token`
- `http://127.0.0.1:8787/?user=MOSHIEE#invite=your-local-moshiee-token`

The existing Python server on port 4173 still supports the original solo mode.
Multiplayer requires the Worker endpoint; the Python server cannot run it.

## Deploy

`wrangler login`, `wrangler deploy --dry-run`, then `npm run deploy`.
Set independent production secrets using `wrangler secret put ISHIEE_TOKEN` and
`wrangler secret put MOSHIEE_TOKEN`. Never use local testing tokens in production.
Keep the full generated invite links private. Role names alone grant no access.
Build-public copies only runtime JS/CSS/HTML and the three required assets;
credentials, server sources, tests, and modeling sources are never uploaded as assets.

## Behavior

The shared `../control-mode.js` setting is currently `companion`. Setting it to
`manual` and redeploying restores the earlier two-player movement mode. Its code
and tests remain intact; no room storage or progress is deleted by this change.
Both browsers should refresh after switching modes.

- MOSHIEE controls exploration, gifts, candles, hats, sky, and interactions.
- Her browser runs the male companion's original local waiting/following logic
  whether ISHIEE is online or absent. Connecting the viewer never takes movement
  authority away from her browser.
- ISHIEE sees the male companion's first-person POV with free mouse look. Hold R
  to point in the look direction; Space triggers a cheerful pair of hops. Server
  checks reject ISHIEE's movement packets and world-changing actions in this mode.
- Original hand holding, automatic gift attention, candle celebration, stone
  skipping and following remain available on MOSHIEE's side. While connected,
  ISHIEE's look direction takes priority over automatic head attention. Hands and
  stargazing are initiated/ended by MOSHIEE using the original controls.
- The viewer's camera follows the companion through a 180 ms movement buffer;
  look direction uses a 140 ms buffer on MOSHIEE's side. Teleports, lying down and
  reconnects clear the relevant buffer. Her companion's walking is locally smooth.
- A role remains exclusive to one connected browser tab. Close it before opening
  another. Duplicate invite use cannot take over an active session.
- Without MOSHIEE connected, the viewer waits at the last saved companion position.
  No one simulates movement when her browser is closed. Saved gifts/candles/hats
  and sky survive reloads. ISHIEE can still look around while waiting.
- Live glitter and stones are relayed; ambient effects and exact firework particle
  randomness remain locally rendered. Best-distance HUDs remain local.
- Tokens travel in a WebSocket protocol header, never in HTTP URLs. Only the user
  name is in the query; the private token is in the fragment. Referrers are disabled.

## Checks

- `npm test`: validation, interaction state, snapshot interpolation, companion-mode
  authority and look sanitization.
- With local dev running, `npm run test:integration` checks control permissions,
  look/point/cheer messages, POV updates and uninterrupted autopilot on disconnect.
- `npm run test:browser` checks two Chrome scenes, blocked movement/world controls,
  visible pointing, hops, hand holding, following, and the stargazing camera.
  It uses Codex's bundled Playwright dependency and installed Google Chrome.
- The original `server-integration.mjs` and `browser-smoke.mjs` tests are retained
  for the optional `manual` control mode.
- `wrangler types` regenerates ignored runtime/binding declarations.

Production invite links are stored in the ignored, owner-readable
`private-invites.json` after deployment. They must not be committed.
